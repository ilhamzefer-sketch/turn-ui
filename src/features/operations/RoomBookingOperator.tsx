import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { todayInTimezone } from "../discovery/discoveryFormatters";
import { managementApi } from "../../shared/api/managementApi";
import { bookingApi } from "../../shared/api/bookingApi";
import type { PlannedBooking } from "../../shared/api/contracts";
import { Button } from "../../shared/ui/Button";
import { SelectField } from "../../shared/ui/SelectField";
import { TextAreaField } from "../../shared/ui/TextAreaField";
import { TextField } from "../../shared/ui/TextField";
import { StatusBadge } from "../management/ManagementUi";
import { bookingStatusLabel, cancellationLabel, localTimeLabel, sourceLabel } from "./operationFormatters";
import { manualBookingSchema, type ManualBookingFormValues } from "./schemas";

const emptyManual: ManualBookingFormValues = { displayName: "", phone: "", source: "OWNER_PHONE", internalNote: "", serviceId: "" };

export function RoomBookingOperator({ roomId, timezone }: { roomId: number; timezone: string }) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayInTimezone(timezone));
  const [selectedStart, setSelectedStart] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<ManualBookingFormValues>({ resolver: zodResolver(manualBookingSchema), defaultValues: emptyManual });
  const bookings = useQuery({ queryKey: ["operator-room-bookings", roomId, date], queryFn: () => bookingApi.roomBookings(roomId, date) });
  const slots = useQuery({ queryKey: ["operator-booking-slots", roomId, date], queryFn: () => bookingApi.slots(roomId, date) });
  const services = useQuery({ queryKey: ["management-room-services", roomId], queryFn: () => managementApi.roomServices(roomId) });
  const create = useMutation({
    mutationFn: (values: ManualBookingFormValues) => {
      if (!selectedStart) throw new Error("Rezervasiya saatını seçin.");
      return bookingApi.createManual(roomId, { ...values, serviceId: values.serviceId ? Number(values.serviceId) : null, internalNote: values.internalNote.trim() || null, startAt: selectedStart });
    },
    onSuccess: async () => { form.reset(emptyManual); setSelectedStart(""); setMessage("Manual rezervasiya yaradıldı."); await refresh(); },
  });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["operator-room-bookings", roomId] }),
      queryClient.invalidateQueries({ queryKey: ["operator-booking-slots", roomId] }),
    ]);
  };
  return <div className="booking-operator">
    {message ? <div className="success-alert" role="status">{message}</div> : null}
    <section className="date-control"><div><p className="eyebrow">Günün rezervasiyaları</p><h2>{new Intl.DateTimeFormat("az-AZ", { dateStyle: "long" }).format(new Date(`${date}T12:00:00`))}</h2></div><TextField label="Göstərilən tarix" type="date" value={date} onChange={(event) => { setDate(event.target.value); setSelectedStart(""); }} /></section>
    <div className="operator-grid">
      <section className="management-panel" aria-labelledby="operator-bookings-title"><div className="management-panel__header"><div><p className="eyebrow">Cədvəl</p><h2 id="operator-bookings-title">Rezervasiyalar</h2></div><span>{bookings.data?.length ?? 0}</span></div>
        {bookings.isPending ? <p role="status">Rezervasiyalar açılır…</p> : bookings.isError ? <div className="form-alert" role="alert">{bookings.error.message}</div> : bookings.data?.length ? <div className="operator-booking-list">{bookings.data.map((booking) => <OperatorBookingCard key={booking.id} booking={booking} roomId={roomId} timezone={timezone} onUpdated={refresh} />)}</div> : <p>Bu tarix üçün rezervasiya yoxdur.</p>}
      </section>
      <section className="management-panel manual-entry-panel" aria-labelledby="manual-booking-title"><p className="eyebrow">Telefon və ya yerində müraciət</p><h2 id="manual-booking-title">Manual rezervasiya</h2><p>Bu əməliyyat istifadəçi hesabı yaratmır.</p>{create.error ? <div className="form-alert" role="alert">{create.error.message}</div> : null}<form className="operation-form" onSubmit={form.handleSubmit((values) => create.mutate(values))} noValidate><TextField label="Ad və soyad" error={form.formState.errors.displayName?.message} {...form.register("displayName")} /><TextField label="Telefon" type="tel" inputMode="tel" error={form.formState.errors.phone?.message} {...form.register("phone")} /><SelectField label="Əlaqə mənbəyi" {...form.register("source")}><option value="OWNER_PHONE">Telefonla əlaqə</option><option value="OWNER_WALK_IN">Yerində müraciət</option><option value="OWNER_OTHER">Digər əlaqə</option></SelectField>{services.data?.filter((service) => service.active).length ? <SelectField label="Xidmət (istəyə bağlı)" {...form.register("serviceId")}><option value="">Seçilməyib</option>{services.data.filter((service) => service.active).map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</SelectField> : null}<div className="field"><span className="field__label">Boş saat</span>{slots.isPending ? <p role="status">Saatlar açılır…</p> : <div className="slot-picker">{(slots.data ?? []).map((slot) => <button type="button" key={slot.startAt} className={selectedStart === slot.startAt ? "slot-button is-selected" : "slot-button"} aria-pressed={selectedStart === slot.startAt} onClick={() => setSelectedStart(slot.startAt)}>{localTimeLabel(slot.startAt)}</button>)}</div>}</div><TextAreaField label="Daxili qeyd" error={form.formState.errors.internalNote?.message} {...form.register("internalNote")} /><Button type="submit" disabled={!selectedStart} loading={create.isPending}>Rezervasiya yarat</Button></form></section>
    </div>
  </div>;
}

function OperatorBookingCard({ booking, roomId, timezone, onUpdated }: { booking: PlannedBooking; roomId: number; timezone: string; onUpdated: () => Promise<void> }) {
  const [action, setAction] = useState<"cancel" | "move" | null>(null);
  const [reason, setReason] = useState("");
  const [informed, setInformed] = useState(false);
  const [newDate, setNewDate] = useState(booking.startAt.slice(0, 10));
  const [newStart, setNewStart] = useState("");
  const slots = useQuery({ queryKey: ["operator-reschedule-slots", roomId, newDate], queryFn: () => bookingApi.slots(roomId, newDate), enabled: action === "move" });
  const mutation = useMutation({
    mutationFn: (kind: "complete" | "no-show" | "cancel" | "move") => {
      if (kind === "complete") return bookingApi.complete(roomId, booking.id);
      if (kind === "no-show") return bookingApi.noShow(roomId, booking.id);
      if (kind === "cancel") return bookingApi.cancelByOperator(roomId, booking.id, reason);
      return bookingApi.rescheduleByOperator(roomId, booking.id, newStart);
    },
    onSuccess: async () => { setAction(null); await onUpdated(); },
  });
  const active = booking.status === "ACTIVE";
  return <article className="operator-booking"><div className="operator-booking__time"><strong>{localTimeLabel(booking.startAt)}</strong><span>{localTimeLabel(booking.endAt)}</span></div><div className="operator-booking__body"><div className="management-list__title"><h3>{booking.participantName}</h3><StatusBadge tone={active ? "success" : booking.status === "CANCELLED" ? "danger" : "neutral"}>{bookingStatusLabel(booking.status)}</StatusBadge></div><p>{booking.participantPhone} · {booking.bookingReference} · {sourceLabel(booking.source)}</p>{booking.serviceName ? <p>{booking.serviceName}</p> : null}{booking.internalNote ? <small>{booking.internalNote}</small> : null}{booking.status === "CANCELLED" ? <p>{cancellationLabel(booking.cancellationReason)}{booking.cancellationDetail ? ` · ${booking.cancellationDetail}` : ""}</p> : null}
    {active ? <div className="operator-booking__actions"><Button onClick={() => mutation.mutate("complete")}>Tamamla</Button><Button variant="secondary" onClick={() => { if (window.confirm("İştirakçı gəlməyib kimi işarələnsin?")) mutation.mutate("no-show"); }}>Gəlmədi</Button><Button variant="quiet" onClick={() => { setAction(action === "move" ? null : "move"); setInformed(false); }}>Vaxtı dəyiş</Button><Button variant="quiet" onClick={() => { setAction(action === "cancel" ? null : "cancel"); setInformed(false); }}>Ləğv et</Button></div> : null}
    {mutation.error ? <div className="form-alert" role="alert">{mutation.error.message}</div> : null}
    {action === "cancel" ? <div className="operator-action-panel"><TextAreaField label="Ləğv səbəbi" value={reason} onChange={(event) => setReason(event.target.value)} /><InformedCheck checked={informed} onChange={setInformed} /><Button disabled={!reason.trim() || !informed} loading={mutation.isPending} onClick={() => mutation.mutate("cancel")}>Rezervasiyanı ləğv et</Button></div> : null}
    {action === "move" ? <div className="operator-action-panel"><TextField label="Yeni tarix" type="date" min={todayInTimezone(timezone)} value={newDate} onChange={(event) => { setNewDate(event.target.value); setNewStart(""); }} /><div className="slot-picker">{(slots.data ?? []).map((slot) => <button type="button" key={slot.startAt} className={newStart === slot.startAt ? "slot-button is-selected" : "slot-button"} aria-pressed={newStart === slot.startAt} onClick={() => setNewStart(slot.startAt)}>{localTimeLabel(slot.startAt)}</button>)}</div><InformedCheck checked={informed} onChange={setInformed} /><Button disabled={!newStart || !informed} loading={mutation.isPending} onClick={() => mutation.mutate("move")}>Yeni vaxtı saxla</Button></div> : null}
  </div></article>;
}

function InformedCheck({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="check-row"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span><strong>İştirakçıya şəxsən məlumat vermişəm</strong><small>Sistem bildirişi olmadığı üçün dəyişiklikdən əvvəl əlaqə saxlanılmalıdır.</small></span></label>;
}
