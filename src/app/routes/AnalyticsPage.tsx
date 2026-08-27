import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { daysAgo, dateInput } from "../../features/step-six/formatters";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { Button } from "../../shared/ui/Button";
import { TextField } from "../../shared/ui/TextField";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { NotificationEvent } from "../../shared/notifications/NotificationProvider";

export function AnalyticsPage({ scope }: { scope: "business" | "room" }) {
  const params = useParams();
  const id = Number(scope === "business" ? params.businessId : params.roomId);
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(dateInput());
  const query = useQuery({ queryKey: [scope, id, "analytics", from, to], queryFn: () => scope === "business" ? stepSixApi.businessAnalytics(id, from, to) : stepSixApi.roomAnalytics(id, from, to), enabled: Number.isFinite(id) && from <= to });
  const [downloading, setDownloading] = useState(false);
  usePageMeta("Əməliyyat analitikası — NövbəTime", "Canlı növbə və planlı rezervasiya üzrə əməliyyat göstəriciləri.");
  const report = query.data;
  const maxRoom = Math.max(1, ...(report?.rooms.map((room) => room.liveEntries + room.plannedBookings) ?? [1]));
  const download = async () => { setDownloading(true); try { if (scope === "business") await stepSixApi.downloadBusinessAnalytics(id, from, to); else await stepSixApi.downloadRoomAnalytics(id, from, to); } finally { setDownloading(false); } };
  return <div className="insight-page">
    <header className="insight-header"><div><p className="eyebrow">Əməliyyat hesabatı</p><h1>İş yükünü aydın görün</h1><p>Göstəricilər ödəniş və gəliri deyil, növbə əməliyyatlarını ölçür.</p></div><Button variant="secondary" loading={downloading} disabled={!report} onClick={() => void download()}>Excel hesabatını endir</Button></header>
    <section className="report-filter" aria-label="Hesabat tarix aralığı"><TextField label="Başlanğıc tarixi" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /><TextField label="Son tarix" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /><p>Maksimum 366 günlük aralıq seçilə bilər.</p></section>
    <NotificationEvent tone="error" message={query.error?.message ?? null} />
    {query.isPending ? <div className="management-state" role="status">Hesabat hazırlanır…</div> : query.isError ? null : report ? <>
      <section className="metric-grid" aria-label="Əsas göstəricilər">
        <Metric label="Ümumi iştirakçı" value={report.totalPeople} /><Metric label="Tamamlanan" value={report.completed} /><Metric label="Canlı növbə" value={report.liveQueueEntries} /><Metric label="Planlı rezervasiya" value={report.plannedBookings} />
      </section>
      <section className="insight-grid"><article className="insight-panel"><p className="eyebrow">Axın keyfiyyəti</p><h2>Nəticələr</h2><dl className="detail-list"><div><dt>Ləğv edilən</dt><dd>{report.cancelled}</dd></div><div><dt>Skip edilən</dt><dd>{report.skipped}</dd></div><div><dt>Silinən</dt><dd>{report.removed}</dd></div><div><dt>Sıfırlanan</dt><dd>{report.reset}</dd></div></dl></article><article className="insight-panel"><p className="eyebrow">Gözləmə</p><h2>Vaxt göstəriciləri</h2><dl className="detail-list"><div><dt>Orta təxmini vaxt</dt><dd>{report.averageEstimatedWaitMinutes} dəq.</dd></div><div><dt>Maksimum</dt><dd>{report.maximumEstimatedWaitMinutes} dəq.</dd></div><div><dt>Ən sıx gün</dt><dd>{report.busiestDay ?? "Məlumat yoxdur"}</dd></div><div><dt>Ən sıx saat</dt><dd>{report.busiestHour == null ? "Məlumat yoxdur" : `${String(report.busiestHour).padStart(2, "0")}:00`}</dd></div></dl></article></section>
      <section className="insight-panel"><div className="panel-heading"><div><p className="eyebrow">Müqayisə</p><h2>Otaqlar üzrə fəaliyyət</h2></div><p>{report.guestParticipants} qonaq · {report.registeredParticipants} qeydiyyatlı</p></div>{report.rooms.length ? <div className="room-chart">{report.rooms.map((room) => { const total = room.liveEntries + room.plannedBookings; return <article key={room.roomId}><div><strong>{room.roomName}</strong><span>{room.branchName ?? "Fərdi iş sahəsi"}</span></div><div className="room-chart__track" aria-hidden="true"><span style={{ width: `${Math.max(2, total / maxRoom * 100)}%` }} /></div><b>{total}</b></article>; })}</div> : <p>Seçilən aralıqda əməliyyat yoxdur.</p>}</section>
    </> : null}
  </div>;
}

function Metric({ label, value }: { label: string; value: number }) { return <article><span>{label}</span><strong>{value}</strong></article>; }
