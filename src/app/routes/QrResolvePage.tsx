import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { publicApi } from "../../shared/api/publicApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { PageLoader } from "../../shared/ui/PageLoader";

export function QrResolvePage() {
  const token = useParams().token ?? "";
  const navigate = useNavigate();
  usePageMeta("QR link açılır — E-Növbə", "E-Növbə otağının daimi QR linki açılır.");
  const query = useQuery({
    queryKey: ["public-qr", token],
    queryFn: () => publicApi.resolveQr(token),
    enabled: token.length > 0,
    retry: false,
  });

  useEffect(() => {
    if (!query.data) return;
    const destination = query.data.reservationMode === "LIVE_QUEUE"
      ? `/rooms/${query.data.roomId}/live?qr=${encodeURIComponent(token)}`
      : `/rooms/${query.data.roomId}/book`;
    void navigate(destination, { replace: true });
  }, [navigate, query.data, token]);

  if (query.isError || !token) {
    return (
      <section className="qr-resolution-error shell">
        <p className="eyebrow">QR link</p>
        <h1>Bu QR kod aktiv deyil</h1>
        <p>Kod ləğv edilmiş, otaq dayandırılmış və ya link səhv yazılmış ola bilər.</p>
        <Link to="/rooms">Açıq otaqlara bax</Link>
      </section>
    );
  }

  return <PageLoader label="Otaq açılır…" />;
}
