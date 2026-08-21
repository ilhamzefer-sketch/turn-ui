import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";

import { publicApi } from "../../shared/api/publicApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { PageLoader } from "../../shared/ui/PageLoader";

export function QrResolvePage() {
  const token = useParams().token ?? "";
  usePageMeta("QR link açılır — NövbəTime", "NövbəTime otağının daimi QR linki açılır.");
  const query = useQuery({
    queryKey: ["public-qr", token],
    queryFn: ({ signal }) => publicApi.resolveQr(
      token,
      AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
    ),
    enabled: token.length > 0,
    retry: false,
  });

  if (query.data) {
    const destination = query.data.reservationMode === "LIVE_QUEUE"
      ? `/rooms/${query.data.roomId}/live?qr=${encodeURIComponent(token)}`
      : query.data.publicPath || `/rooms/${query.data.roomId}`;
    return <Navigate to={destination} replace />;
  }

  if (query.isError || !token) {
    return (
      <section className="qr-resolution-error shell">
        <p className="eyebrow">QR link</p>
        <h1>Bu QR kod aktiv deyil</h1>
        <p>Kod ləğv edilmiş, otaq dayandırılmış, link səhv yazılmış və ya serverə qoşulmaq mümkün olmamış ola bilər.</p>
        <Link to="/rooms">Açıq otaqlara bax</Link>
      </section>
    );
  }

  return <PageLoader label="Otaq açılır…" />;
}
