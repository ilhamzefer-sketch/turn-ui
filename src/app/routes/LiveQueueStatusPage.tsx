import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { queueStatusLabel } from "../../features/operations/operationFormatters";
import { queueApi } from "../../shared/api/queueApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";

export function LiveQueueStatusPage() {
  const reference = useParams().reference ?? "";
  const query = useQuery({
    queryKey: ["live-queue-participant", reference],
    queryFn: () => queueApi.participant(reference),
    enabled: reference.length > 0,
    refetchInterval: 5_000,
  });
  usePageMeta("Növbə statusu — NövbəTime", "Canlı növbədəki yerinizi və təxmini gözləmə vaxtını izləyin.");
  if (query.isPending) return <div className="operation-public-state shell" role="status">Növbə statusu yoxlanılır…</div>;
  if (query.isError || !query.data) return <main className="operation-public-state shell" role="alert"><h1>Növbə tapılmadı</h1><p>Kod səhv ola və ya əvvəlki sessiyaya aid ola bilər.</p><Link to="/rooms">Otaqlara bax</Link></main>;
  const status = query.data;
  const current = status.status === "CURRENT";
  return (
    <main className="participant-status shell">
      <p className="eyebrow">Şəxsi növbə statusu</p>
      <h1>{current ? "Növbə sizdədir" : queueStatusLabel(status.status)}</h1>
      <div className={`participant-ticket ${current ? "participant-ticket--current" : ""}`}>
        <span>Növbə kodunuz</span><strong>{status.publicReference}</strong>
      </div>
      <dl className="participant-metrics">
        <div><dt>Qabağınızdakı iştirakçı</dt><dd>{status.peopleAhead}</dd></div>
        <div><dt>Təxmini gözləmə</dt><dd>{status.approximateWaitingMinutes} dəqiqə</dd></div>
        <div><dt>Hazırda qəbul olunur</dt><dd>{status.currentPublicReference ?? "—"}</dd></div>
      </dl>
      <p className="participant-status__note" role="status">Bu səhifə avtomatik yenilənir. Səhifəni açıq saxlaya bilərsiniz.</p>
      <Link className="button button--secondary" to="/rooms">Başqa otaq tap</Link>
    </main>
  );
}
