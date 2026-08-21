import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

import { todayInTimezone } from "../../features/discovery/discoveryFormatters";
import { bookingStatusLabel, cancellationLabel, localDateTimeLabel, localTimeLabel, queueStatusLabel, sourceLabel } from "../../features/operations/operationFormatters";
import { bookingApi } from "../../shared/api/bookingApi";
import type { PlannedBooking } from "../../shared/api/contracts";
import { queueApi } from "../../shared/api/queueApi";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { Button, ButtonLink } from "../../shared/ui/Button";
import { TextField } from "../../shared/ui/TextField";
import { SelectField } from "../../shared/ui/SelectField";
import { TextAreaField } from "../../shared/ui/TextAreaField";

export function CustomerBookingsPage() {
  usePageMeta("Növbələrim və rezervasiyalarım — E-Növbə", "Aktiv və keçmiş növbələrinizi bir yerdə izləyin.");
  const bookings = useQuery({ queryKey: ["customer-bookings"], queryFn: bookingApi.history });
  const queues = useQuery({ queryKey: ["customer-live-queue-history"], queryFn: queueApi.history });
  if (bookings.isPending || queues.isPending) return <div className="management-state" role="status">Növbələriniz açılır…</div>;
  if (bookings.isError || queues.isError) return <div className="management-state management-state--error" role="alert"><h1>Növbələr açıla bilmədi</h1><p>{(bookings.error ?? queues.error)?.message}</p></div>;
  const active = (bookings.data ?? []).filter((booking) => booking.status === "ACTIVE");
  const history = (bookings.data ?? []).filter((booking) => booking.status !== "ACTIVE");
  return (
    <div className="management-page customer-operations">
      <header className="management-heading"><div><p className="eyebrow">Müştəri hesabı</p><h1>Növbələrim</h1><p>Planlı rezervasiyalarınızı idarə edin və canlı növbə tarixçənizi görün.</p></div><ButtonLink to="/rooms">Yeni otaq tap</ButtonLink></header>
      <section className="management-panel" aria-labelledby="active-bookings-title"><div className="management-panel__header"><div><p className="eyebrow">Qarşıdakı görüşlər</p><h2 id="active-bookings-title">Aktiv rezervasiyalar</h2></div><span>{active.length}</span></div>
        {active.length ? <div className="customer-booking-list">{active.map((booking) => <CustomerBookingCard key={booking.id} booking={booking} />)}</div> : <div className="empty-state empty-state--compact"><h3>Aktiv rezervasiya yoxdur</h3><p>Otaq profilindən uyğun saatı seçərək rezervasiya yarada bilərsiniz.</p></div>}
      </section>
      <section className="management-panel" aria-labelledby="queue-history-title"><div className="management-panel__header"><div><p className="eyebrow">Canlı növbə</p><h2 id="queue-history-title">Son iştiraklar</h2></div></div>
        {(queues.data ?? []).length ? <div className="operation-history-list">{queues.data!.map((item) => <article key={item.entryId}><div><strong>{item.roomName}</strong><p>{item.publicReference} · {sourceLabel(item.source)}</p>{item.status === "COMPLETED" ? <RatingForm type="live" id={item.entryId} /> : null}</div><div><span>{queueStatusLabel(item.status)}</span><Link to={`/queue/${encodeURIComponent(item.publicReference)}`}>Statusu aç</Link></div></article>)}</div> : <p>Canlı növbə tarixçəniz yoxdur.</p>}
      </section>
      {history.length ? <section className="management-panel" aria-labelledby="booking-history-title"><div className="management-panel__header"><div><p className="eyebrow">Tarixçə</p><h2 id="booking-history-title">Keçmiş rezervasiyalar</h2></div></div><div className="operation-history-list">{history.map((booking) => <article key={booking.id}><div><strong>{booking.roomName}</strong><p>{localDateTimeLabel(booking.startAt, booking.timezone)} · {booking.bookingReference}</p>{booking.status === "COMPLETED" ? <RatingForm type="booking" id={booking.id} /> : null}</div><span>{booking.status === "CANCELLED" ? cancellationLabel(booking.cancellationReason) : bookingStatusLabel(booking.status)}</span></article>)}</div></section> : null}
    </div>
  );
}

function RatingForm({ type, id }: { type: "live" | "booking"; id: number }) {
  const [open, setOpen] = useState(false); const [score, setScore] = useState("5"); const [comment, setComment] = useState("");
  const rating = useMutation({ mutationFn: () => type === "live" ? stepSixApi.rateLive(id, Number(score), comment.trim() || null) : stepSixApi.rateBooking(id, Number(score), comment.trim() || null) });
  if (rating.data) return <p className="rating-confirmation" role="status">Rəyiniz saxlanıldı · {rating.data.score}/5</p>;
  return <div className="rating-form">{open ? <><SelectField label="Qiymət" value={score} onChange={(e) => setScore(e.target.value)}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</SelectField><TextAreaField label="Qeyd (istəyə bağlı)" value={comment} onChange={(e) => setComment(e.target.value)} /><Button loading={rating.isPending} onClick={() => rating.mutate()}>Rəyi saxla</Button>{rating.error ? <div className="form-alert" role="alert">{rating.error.message}</div> : null}</> : <Button variant="quiet" onClick={() => setOpen(true)}>Rezervasiyanı qiymətləndir</Button>}</div>;
}

function CustomerBookingCard({ booking }: { booking: PlannedBooking }) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<"cancel" | "move" | null>(null);
  const [date, setDate] = useState(booking.startAt.slice(0, 10));
  const [slot, setSlot] = useState("");
  const slots = useQuery({ queryKey: ["booking-reschedule-slots", booking.roomId, date], queryFn: () => bookingApi.slots(booking.roomId, date), enabled: action === "move" });
  const mutation = useMutation({
    mutationFn: () => action === "cancel" ? bookingApi.cancel(booking.id) : bookingApi.reschedule(booking.id, slot),
    onSuccess: async () => { setAction(null); await queryClient.invalidateQueries({ queryKey: ["customer-bookings"] }); },
  });
  return <article className="customer-booking-card">
    <div className="customer-booking-card__time"><strong>{booking.startAt.slice(0, 10)}</strong><span>{localTimeLabel(booking.startAt)}</span></div>
    <div className="customer-booking-card__body"><div><p className="eyebrow">{booking.bookingReference}</p><h3>{booking.roomName}</h3><p>{bookingStatusLabel(booking.status)}</p></div>
      <div className="customer-booking-card__actions"><Button variant="secondary" onClick={() => setAction(action === "move" ? null : "move")}>Vaxtı dəyiş</Button><Button variant="quiet" onClick={() => setAction(action === "cancel" ? null : "cancel")}>Ləğv et</Button></div>
      {mutation.error ? <div className="form-alert" role="alert">{mutation.error.message}</div> : null}
      {action === "cancel" ? <div className="inline-confirm" role="group" aria-label="Rezervasiyanı ləğv etmə təsdiqi"><p>Bu rezervasiyanı ləğv etmək istəyirsiniz?</p><Button loading={mutation.isPending} onClick={() => mutation.mutate()}>Bəli, ləğv et</Button><Button variant="quiet" onClick={() => setAction(null)}>Geri qayıt</Button></div> : null}
      {action === "move" ? <div className="reschedule-panel"><TextField label="Yeni tarix" type="date" min={todayInTimezone(booking.timezone)} value={date} onChange={(event) => { setDate(event.target.value); setSlot(""); }} />{slots.isPending ? <p role="status">Saatlar açılır…</p> : <div className="slot-picker">{(slots.data ?? []).map((item) => <button type="button" key={item.startAt} className={slot === item.startAt ? "slot-button is-selected" : "slot-button"} aria-pressed={slot === item.startAt} onClick={() => setSlot(item.startAt)}>{localTimeLabel(item.startAt)}</button>)}</div>}<Button disabled={!slot} loading={mutation.isPending} onClick={() => mutation.mutate()}>Yeni vaxtı saxla</Button></div> : null}
    </div>
  </article>;
}
