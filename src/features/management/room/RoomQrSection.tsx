import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import type { ManagedRoom, QrCredential } from "../../../shared/api/contracts";
import { managementApi } from "../../../shared/api/managementApi";
import { NotificationEvent } from "../../../shared/notifications/NotificationProvider";
import { Button } from "../../../shared/ui/Button";
import { StatusBadge } from "../ManagementUi";
import { apiMessage } from "../managementUtils";
import { formatManagementDate } from "../managementLabels";

type RoomQrSetupNavigation = {
  finishing: boolean;
  onBack: () => void;
  onFinish: () => void;
};

export function RoomQrSection({ room, setupNavigation }: { room: ManagedRoom; setupNavigation?: RoomQrSetupNavigation }) {
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
      <NotificationEvent tone="success" message={successMessage} />
      <NotificationEvent tone="error" message={error ? apiMessage(error, "QR əməliyyatı tamamlanmadı.") : null} />
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
                room={room}
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
      {setupNavigation ? (
        <div className="room-setup-actions room-setup-actions--final">
          <Button variant="secondary" onClick={setupNavigation.onBack}>Geri</Button>
          <div>
            <p>QR kod istəyə bağlıdır. Otağı yayımladıqdan sonra da əlavə edə və yeniləyə bilərsiniz.</p>
            <Button loading={setupNavigation.finishing} onClick={setupNavigation.onFinish}>Otağı yayımla</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type QrCardProps = {
  credential: QrCredential;
  room: ManagedRoom;
  index: number;
  busy: boolean;
  onRegenerate: () => void;
  onRevoke: () => void;
};

function QrCard({ credential, room, index, busy, onRegenerate, onRevoke }: QrCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [copyLabel, setCopyLabel] = useState("Linki kopyala");
  const token = credential.token?.trim() ?? "";
  const publicUrl = token ? `${window.location.origin}/q/${encodeURIComponent(token)}` : null;
  const modeLabel = room.reservationMode === "LIVE_QUEUE" ? "Canlı növbə" : "Planlı qəbul";

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
    const source = printableQrSvg(svg, {
      roomName: room.name,
      roomCode: room.roomNumberOrCode,
      modeLabel,
      duration: room.defaultSlotDurationMinutes,
      publicUrl,
      description: room.description,
    });
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFilename(room.name)}-qr-${index}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <article className="qr-card">
      <div className="qr-card__poster" ref={wrapperRef}>
        <div className="qr-card__poster-brand">
          <strong>NövbəTime</strong>
          <span>Onlayn növbə və qəbul sistemi</span>
        </div>
        <div className="qr-card__poster-heading">
          <span>QR ilə qoşulun</span>
          <h3>{room.name}</h3>
        </div>
        <div className="qr-card__image">
        {publicUrl ? (
          <QRCodeSVG value={publicUrl} size={236} level="H" marginSize={4} title={`${room.name} üçün QR kod ${index}`} />
        ) : (
          <div className="qr-card__unavailable" role="status"><strong>QR</strong><span>Kodu yeniləyin</span></div>
        )}
        </div>
        <div className="qr-card__poster-details">
          <strong>{modeLabel}</strong>
          <span>{room.roomNumberOrCode ? `Otaq kodu: ${room.roomNumberOrCode}` : `${room.defaultSlotDurationMinutes} dəqiqəlik qəbul`}</span>
          {room.roomNumberOrCode ? <span>{room.defaultSlotDurationMinutes} dəqiqəlik qəbul</span> : null}
          {room.description ? <span>{shortText(room.description, 68)}</span> : null}
        </div>
        <div className="qr-card__poster-footer">
          <span>Kameranızla skan edin</span>
          <strong>novbetime.az</strong>
        </div>
      </div>
      <div className="qr-card__content">
        <div className="management-list__title"><h3>QR kod {index}</h3><StatusBadge tone="success">Aktiv</StatusBadge></div>
        <p>{formatManagementDate(credential.createdAt)} tarixində yaradılıb</p>
        <p className="qr-card__content-note">Çap üçün SVG faylında NövbəTime, otaq adı, rejim, qəbul müddəti və sayt ünvanı da göstərilir.</p>
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

type PrintableQrMetadata = {
  roomName: string;
  roomCode: string | null;
  modeLabel: string;
  duration: number;
  publicUrl: string;
  description: string | null;
};

function printableQrSvg(qrSvg: SVGSVGElement, metadata: PrintableQrMetadata) {
  const qrMarkup = qrSvg.innerHTML;
  const viewBox = qrSvg.getAttribute("viewBox") ?? "0 0 236 236";
  const description = metadata.description?.trim();
  const detailLine = metadata.roomCode
    ? `Otaq kodu: ${metadata.roomCode} · ${metadata.duration} dəqiqəlik qəbul`
    : `${metadata.duration} dəqiqəlik qəbul`;
  const descriptionLine = description ? `<text x="400" y="795" class="muted" text-anchor="middle">${escapeXml(shortText(description, 68))}</text>` : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1040" viewBox="0 0 800 1040" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(metadata.roomName)} üçün NövbəTime QR kodu</title>
  <desc id="description">${escapeXml(metadata.modeLabel)}. ${escapeXml(metadata.publicUrl)}</desc>
  <rect width="800" height="1040" rx="36" fill="#f7f8f5"/>
  <rect x="32" y="32" width="736" height="976" rx="28" fill="#ffffff" stroke="#dce2dc" stroke-width="2"/>
  <text x="72" y="105" fill="#173c31" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">NövbəTime</text>
  <text x="72" y="137" fill="#597067" font-family="Arial, Helvetica, sans-serif" font-size="16">Onlayn növbə və qəbul sistemi</text>
  <text x="400" y="205" fill="#597067" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle">QR ilə qoşulun</text>
  <text x="400" y="246" fill="#173c31" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" text-anchor="middle">${escapeXml(shortText(metadata.roomName, 34))}</text>
  <svg x="180" y="280" width="440" height="440" viewBox="${escapeXml(viewBox)}" shape-rendering="crispEdges">${qrMarkup}</svg>
  <text x="400" y="770" fill="#173c31" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" text-anchor="middle">${escapeXml(metadata.modeLabel)}</text>
  <text x="400" y="805" fill="#597067" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle">${escapeXml(detailLine)}</text>
  ${descriptionLine}
  <line x1="72" y1="850" x2="728" y2="850" stroke="#dce2dc"/>
  <text x="72" y="900" fill="#597067" font-family="Arial, Helvetica, sans-serif" font-size="17">Kameranızla skan edin</text>
  <text x="728" y="900" fill="#173c31" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" text-anchor="end">novbetime.az</text>
  <text x="400" y="954" fill="#8a9991" font-family="Arial, Helvetica, sans-serif" font-size="14" text-anchor="middle">${escapeXml(metadata.publicUrl)}</text>
</svg>`;
}

function shortText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1).trimEnd()}…` : value;
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" })[character] ?? character);
}

function safeFilename(value: string) {
  return value.toLocaleLowerCase("az-AZ").replace(/[^a-z0-9əöüğışç]+/gi, "-").replace(/^-|-$/g, "");
}
