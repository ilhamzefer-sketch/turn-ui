import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { todayInTimezone } from "../../features/discovery/discoveryFormatters";
import { localTimeLabel } from "../../features/operations/operationFormatters";
import { bookingNoteSchema, type BookingNoteFormValues } from "../../features/operations/schemas";
import { bookingApi } from "../../shared/api/bookingApi";
import { publicApi } from "../../shared/api/publicApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { Button, ButtonLink } from "../../shared/ui/Button";
import { TextAreaField } from "../../shared/ui/TextAreaField";
import { TextField } from "../../shared/ui/TextField";

export function BookRoomPage() {
  const roomId = Number(useParams().roomId);
  const roomQuery = useQuery({ queryKey: ["public-room", roomId], queryFn: () => publicApi.room(roomId), enabled: Number.isInteger(roomId) });
  const room = roomQuery.data;
  const [date, setDate] = useState("");
  const [selectedStart, setSelectedStart] = useState("");
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const form = useForm<BookingNoteFormValues>({ resolver: zodResolver(bookingNoteSchema), defaultValues: { customerNote: "" } });
  const effectiveDate = date || (room ? todayInTimezone(room.timezone) : "");
  const slotsQuery = useQuery({
    queryKey: ["booking-slots", roomId, effectiveDate],
    queryFn: () => bookingApi.slots(roomId, effectiveDate),
    enabled: Boolean(room && room.reservationMode === "PLANNED_BOOKING" && effectiveDate),
  });
  const mutation = useMutation({
    mutationFn: (values: BookingNoteFormValues) => {
      if (!selectedStart) throw new Error("Rezervasiya saatını seçin.");
      return bookingApi.create({
        roomId,
        startAt: selectedStart,
        customerNote: values.customerNote.trim() || null,
      });
    },
  });
  usePageMeta(room ? `${room.name} — rezervasiya | NövbəTime` : "Rezervasiya — NövbəTime", "Uyğun tarixi və boş saatı seçərək rezervasiyanızı təsdiqləyin.");

  useEffect(() => {
    if (mutation.data) successHeadingRef.current?.focus();
  }, [mutation.data]);

  if (roomQuery.isPending) return <div className="booking-shell shell" role="status">Otaq məlumatları açılır…</div>;
  if (roomQuery.isError || !room || room.reservationMode !== "PLANNED_BOOKING") return <div className="booking-shell shell" role="alert"><h1>Rezervasiya açıla bilmədi</h1><p>Bu otaq planlı rezervasiya rejimində deyil və ya yayımdan çıxarılıb.</p><Link to={`/rooms/${roomId}`}>Otağa qayıt</Link></div>;

  if (mutation.data) {
    return (
      <main className="booking-success shell">
        <span className="booking-success__mark" aria-hidden="true">✓</span>
        <p className="eyebrow">Rezervasiya təsdiqləndi</p>
        <h1 ref={successHeadingRef} tabIndex={-1}>{room.name}</h1>
        <p>Rezervasiya kodunuz: <strong>{mutation.data.bookingReference}</strong></p>
        <dl><div><dt>Tarix və saat</dt><dd>{mutation.data.startAt.slice(0, 10)} · {localTimeLabel(mutation.data.startAt)}</dd></div><div><dt>Müddət</dt><dd>{room.defaultSlotDurationMinutes} dəqiqə</dd></div></dl>
        <div className="booking-success__actions"><ButtonLink to="/app/bookings">Rezervasiyalarımı aç</ButtonLink><ButtonLink variant="secondary" to={`/rooms/${room.id}`}>Otaq profilinə qayıt</ButtonLink></div>
      </main>
    );
  }

  return (
    <main className="booking-shell shell">
      <nav className="breadcrumbs" aria-label="Səhifə yolu"><Link to={`/rooms/${room.id}`}>{room.name}</Link><span>/</span><span aria-current="page">Rezervasiya</span></nav>
      <header><p className="eyebrow">Planlı rezervasiya</p><h1>Uyğun vaxtı seçin</h1><p>{room.providerName} · {room.name}. Saatlar {room.timezone} vaxtı ilə göstərilir.</p></header>
      {mutation.error ? <div className="form-alert" role="alert">{mutation.error.message}</div> : null}
      <form className="booking-layout" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <section className="booking-step" aria-labelledby="booking-date-title">
          <span className="booking-step__number">1</span><div><h2 id="booking-date-title">Tarixi seçin</h2><TextField label="Rezervasiya tarixi" type="date" min={todayInTimezone(room.timezone)} value={effectiveDate} onChange={(event) => { setDate(event.target.value); setSelectedStart(""); }} /></div>
        </section>
        <section className="booking-step" aria-labelledby="booking-time-title">
          <span className="booking-step__number">2</span><div><h2 id="booking-time-title">Boş saatı seçin</h2>
            {slotsQuery.isPending ? <p role="status">Boş saatlar yoxlanılır…</p> : slotsQuery.isError ? <p role="alert">Boş saatları göstərmək mümkün olmadı.</p> : !slotsQuery.data?.length ? <p>Bu tarix üçün boş saat yoxdur.</p> : (
              <div className="slot-picker" role="group" aria-label="Boş rezervasiya saatları">{slotsQuery.data.map((slot) => <button key={slot.startAt} type="button" className={selectedStart === slot.startAt ? "slot-button is-selected" : "slot-button"} aria-pressed={selectedStart === slot.startAt} onClick={() => setSelectedStart(slot.startAt)}>{localTimeLabel(slot.startAt)}</button>)}</div>
            )}
          </div>
        </section>
        <section className="booking-step" aria-labelledby="booking-detail-title">
          <span className="booking-step__number">3</span><div><h2 id="booking-detail-title">Detalları tamamlayın</h2>
            <TextAreaField label="Otaq sahibinə qeyd (istəyə bağlı)" error={form.formState.errors.customerNote?.message} {...form.register("customerNote")} />
          </div>
        </section>
        <div className="booking-submit"><div><strong>{selectedStart ? `${effectiveDate} · ${localTimeLabel(selectedStart)}` : "Saat seçilməyib"}</strong><span>Ayrıca owner təsdiqi tələb olunmur.</span></div><Button type="submit" disabled={!selectedStart} loading={mutation.isPending}>Rezervasiyanı təsdiqlə</Button></div>
      </form>
    </main>
  );
}
