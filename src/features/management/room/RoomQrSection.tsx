import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import type { ManagedRoom, QrCredential } from "../../../shared/api/contracts";
import { managementApi } from "../../../shared/api/managementApi";
import { Button } from "../../../shared/ui/Button";
import { StatusBadge } from "../ManagementUi";
import { apiMessage } from "../managementUtils";
import { formatManagementDate } from "../managementLabels";

export function RoomQrSection({ room }: { room: ManagedRoom }) {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const qrQuery = useQuery({
    queryKey: ["management-room-qr", room.id],
    queryFn: () => managementApi.qrCodes(room.id),
  });
  const createMutation = useMutation({
    mutationFn: () => managementApi.createQrCode(room.id),
    onSuccess: async () => {
      setSuccessMessage("Yeni daimi QR kod yaradıldı.");
      await queryClient.invalidateQueries({ queryKey: ["management-room-qr", room.id] });
    },
  });
  const regenerateMutation = useMutation({
    mutationFn: (credentialId: number) => managementApi.regenerateQrCode(room.id, credentialId),
    onSuccess: async () => {
      setSuccessMessage("QR kod yeniləndi. Köhnə kod artıq işləmir.");
      await queryClient.invalidateQueries({ queryKey: ["management-room-qr", room.id] });
    },
  });
  const revokeMutation = useMutation({
    mutationFn: (credentialId: number) => managementApi.revokeQrCode(room.id, credentialId),
    onSuccess: async () => {
      setSuccessMessage("QR kod ləğv edildi.");
      await queryClient.invalidateQueries({ queryKey: ["management-room-qr", room.id] });
    },
  });
  const error = qrQuery.error ?? createMutation.error ?? regenerateMutation.error ?? revokeMutation.error;
  const activeCodes = (qrQuery.data ?? []).filter((code) => code.active);

  return (
    <div className="room-section-stack">
      {successMessage ? <div className="success-alert" role="status">{successMessage}</div> : null}
      {error ? <div className="form-alert" role="alert">{apiMessage(error, "QR əməliyyatı tamamlanmadı.")}</div> : null}
      <section className="management-panel" aria-labelledby="qr-title">
        <div className="section-heading">
          <div><p className="eyebrow">Daimi giriş nöqtələri</p><h2 id="qr-title">QR kodlar</h2></div>
          <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Yeni QR yarat</Button>
        </div>
        <p className="section-intro">Eyni otaq üçün istədiyiniz qədər daimi kod yarada bilərsiniz. Kod rejim dəyişsə də həmin otağı açır; ayrıca ləğv edilənədək aktiv qalır.</p>
        {room.status !== "PUBLISHED" ? <div className="warning-note">QR kodu indi hazırlaya bilərsiniz, lakin otaq yayımlanana qədər ictimai link açılmayacaq.</div> : null}
        {qrQuery.isPending ? <p role="status">QR kodlar açılır…</p> : activeCodes.length === 0 ? (
          <div className="empty-state empty-state--compact"><span className="empty-state__mark" aria-hidden="true">QR</span><h3>Aktiv QR kod yoxdur</h3><p>Qapı, resepsiya və ya fərqli giriş nöqtələri üçün daimi kod yaradın.</p></div>
        ) : (
          <div className="qr-grid">
            {activeCodes.map((credential, index) => (
              <QrCard
                key={credential.id}
                credential={credential}
                roomName={room.name}
                index={index + 1}
                busy={regenerateMutation.isPending || revokeMutation.isPending}
                onRegenerate={() => regenerateMutation.mutate(credential.id)}
                onRevoke={() => {
                  if (window.confirm("Bu QR kod ləğv edilsin? Çap edilmiş köhnə nüsxələr dərhal işləməyəcək.")) revokeMutation.mutate(credential.id);
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type QrCardProps = {
  credential: QrCredential;
  roomName: string;
  index: number;
  busy: boolean;
  onRegenerate: () => void;
  onRevoke: () => void;
};

function QrCard({ credential, roomName, index, busy, onRegenerate, onRevoke }: QrCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [copyLabel, setCopyLabel] = useState("Linki kopyala");
  const token = credential.token?.trim() ?? "";
  const publicUrl = token ? `${window.location.origin}/q/${encodeURIComponent(token)}` : null;

  const copy = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopyLabel("Kopyalandı");
    window.setTimeout(() => setCopyLabel("Linki kopyala"), 1800);
  };

  const download = () => {
    if (!publicUrl) return;
    const svg = wrapperRef.current?.querySelector("svg");
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFilename(roomName)}-qr-${index}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <article className="qr-card">
      <div className="qr-card__image" ref={wrapperRef}>
        {publicUrl ? (
          <QRCodeSVG value={publicUrl} size={192} level="M" marginSize={2} title={`${roomName} üçün QR kod ${index}`} />
        ) : (
          <div className="qr-card__unavailable" role="status"><strong>QR</strong><span>Kodu yeniləyin</span></div>
        )}
      </div>
      <div className="qr-card__content">
        <div className="management-list__title"><h3>QR kod {index}</h3><StatusBadge tone="success">Aktiv</StatusBadge></div>
        <p>{formatManagementDate(credential.createdAt)} tarixində yaradılıb</p>
        {!publicUrl ? <p className="qr-card__repair-note">Bu köhnə QR kodu işlək vəziyyətə gətirmək üçün yeniləyin.</p> : null}
      </div>
      <div className="qr-card__actions">
        {publicUrl ? <Button variant="secondary" onClick={() => void copy()}>{copyLabel}</Button> : null}
        {publicUrl ? <Button variant="secondary" onClick={download}>SVG yüklə</Button> : null}
        <Button variant={publicUrl ? "quiet" : "primary"} disabled={busy} onClick={onRegenerate}>
          {publicUrl ? "Yenilə" : "QR kodu bərpa et"}
        </Button>
        <Button variant="quiet" disabled={busy} onClick={onRevoke}>Ləğv et</Button>
      </div>
    </article>
  );
}

function safeFilename(value: string) {
  return value.toLocaleLowerCase("az-AZ").replace(/[^a-z0-9əöüğışç]+/gi, "-").replace(/^-|-$/g, "");
}
