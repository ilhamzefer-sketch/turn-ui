import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  const titleMutation = useMutation({
    mutationFn: ({ credentialId, posterTitle }: { credentialId: number; posterTitle: string | null }) =>
      managementApi.updateQrPosterTitle(room.id, credentialId, posterTitle),
    onSuccess: async () => {
      setSuccessMessage("QR afişasının başlığı yadda saxlanıldı.");
      await queryClient.invalidateQueries({ queryKey: ["management-room-qr", room.id] });
    },
  });
  const downloadMutation = useMutation({
    mutationFn: ({ credentialId, filename }: { credentialId: number; filename: string }) =>
      managementApi.downloadQrPoster(room.id, credentialId, filename),
    onSuccess: () => setSuccessMessage("QR afişası PDF kimi yükləndi."),
  });
  const error = qrQuery.error
    ?? createMutation.error
    ?? regenerateMutation.error
    ?? revokeMutation.error
    ?? titleMutation.error
    ?? downloadMutation.error;
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
        <p className="section-intro">Hər giriş nöqtəsi üçün ayrıca daimi QR yaradın. Kod siz ləğv edənədək işləyir.</p>
        {room.status !== "PUBLISHED" ? <div className="warning-note">QR kodu indi hazırlaya bilərsiniz, lakin otaq yayımlanana qədər ictimai link açılmayacaq.</div> : null}
        {qrQuery.isPending ? <p role="status">QR kodlar açılır…</p> : activeCodes.length === 0 ? (
          <div className="empty-state empty-state--compact"><span className="empty-state__mark" aria-hidden="true">QR</span><h3>Aktiv QR kod yoxdur</h3><p>Qapı, resepsiya və ya fərqli giriş nöqtələri üçün daimi kod yaradın.</p></div>
        ) : (
          <div className="qr-grid">
            {activeCodes.map((credential, index) => (
              <QrCard
                key={`${credential.id}:${credential.posterTitle ?? ""}:${room.name}`}
                credential={credential}
                room={room}
                index={index + 1}
                busy={regenerateMutation.isPending || revokeMutation.isPending || titleMutation.isPending}
                downloading={downloadMutation.isPending && downloadMutation.variables?.credentialId === credential.id}
                onSaveTitle={(posterTitle) => titleMutation.mutate({ credentialId: credential.id, posterTitle })}
                onDownload={(filename) => downloadMutation.mutate({ credentialId: credential.id, filename })}
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
  downloading: boolean;
  onSaveTitle: (posterTitle: string | null) => void;
  onDownload: (filename: string) => void;
  onRegenerate: () => void;
  onRevoke: () => void;
};

function QrCard({ credential, room, index, busy, downloading, onSaveTitle, onDownload, onRegenerate, onRevoke }: QrCardProps) {
  const [copyLabel, setCopyLabel] = useState("Linki kopyala");
  const savedTitle = credential.posterTitle?.trim() || room.name;
  const [posterTitle, setPosterTitle] = useState(savedTitle);
  const token = credential.token?.trim() ?? "";
  const publicUrl = token ? `${window.location.origin}/q/${encodeURIComponent(token)}` : null;
  const modeLabel = room.reservationMode === "LIVE_QUEUE" ? "Canlı növbə" : "Planlı qəbul";
  const normalizedTitle = posterTitle.trim().replace(/\s+/g, " ");
  const previewTitle = normalizedTitle || room.name;
  const titleChanged = previewTitle !== savedTitle;

  const copy = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopyLabel("Kopyalandı");
    window.setTimeout(() => setCopyLabel("Linki kopyala"), 1800);
  };

  const saveTitle = () => {
    const roomTitle = room.name.trim().replace(/\s+/g, " ");
    onSaveTitle(normalizedTitle && normalizedTitle !== roomTitle ? normalizedTitle : null);
  };

  return (
    <article className="qr-card" aria-labelledby={`qr-card-title-${credential.id}`}>
      <header className="qr-card__header">
        <div>
          <h3 id={`qr-card-title-${credential.id}`}>QR kod {index}</h3>
          <p>{formatManagementDate(credential.createdAt)} tarixində yaradılıb</p>
        </div>
        <StatusBadge tone="success">Aktiv</StatusBadge>
      </header>
      <div className="qr-card__title-editor">
        <label htmlFor={`qr-poster-title-${credential.id}`}>Afişa başlığı</label>
        <div>
          <input
            id={`qr-poster-title-${credential.id}`}
            className="field__control"
            maxLength={80}
            value={posterTitle}
            onChange={(event) => setPosterTitle(event.target.value)}
          />
          <Button variant="secondary" disabled={!titleChanged || busy} onClick={saveTitle}>Başlığı yadda saxla</Button>
        </div>
        <p>Bu başlıq yalnız həmin QR afişasında görünür. Boş saxlanarsa otağın adı istifadə olunur.</p>
      </div>
      <div className="qr-card__poster">
        <div className="qr-card__poster-brand">
          <div><strong>NövbəTime</strong><span>Onlayn növbə və qəbul sistemi</span></div>
          <span className="qr-card__poster-logo" aria-hidden="true"><img src="/novbetime-logo.png" alt="" /></span>
        </div>
        <div className="qr-card__poster-heading">
          <span>QR ilə qoşulun</span>
          <h3>{previewTitle}</h3>
        </div>
        <div className="qr-card__image">
        {publicUrl ? (
          <QRCodeSVG
            value={publicUrl}
            size={236}
            level="H"
            marginSize={4}
            fgColor="#004f45"
            title={`${previewTitle} üçün QR kod ${index}`}
            imageSettings={{ src: "/novbetime-logo.png", height: 62, width: 62, excavate: true }}
          />
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
        <p className="qr-card__content-note">
          {titleChanged
            ? "PDF yükləmək üçün əvvəlcə yeni başlığı yadda saxlayın."
            : "A4 ölçülü PDF afişada loqo, QR kod və qəbul məlumatları yerləşir."}
        </p>
        {!publicUrl ? <p className="qr-card__repair-note">Bu köhnə QR kodu işlək vəziyyətə gətirmək üçün yeniləyin.</p> : null}
      </div>
      <div className="qr-card__actions">
        {publicUrl ? <Button variant="secondary" onClick={() => void copy()}>{copyLabel}</Button> : null}
        {publicUrl ? (
          <Button
            variant="secondary"
            loading={downloading}
            disabled={titleChanged || busy}
            onClick={() => onDownload(`${safeFilename(previewTitle)}-qr-${index}.pdf`)}
          >
            PDF yüklə
          </Button>
        ) : null}
        <Button variant={publicUrl ? "quiet" : "primary"} disabled={busy} onClick={onRegenerate}>
          {publicUrl ? "Yenilə" : "QR kodu bərpa et"}
        </Button>
        <Button variant="quiet" disabled={busy} onClick={onRevoke}>Ləğv et</Button>
      </div>
    </article>
  );
}

function safeFilename(value: string) {
  return value.toLocaleLowerCase("az-AZ").replace(/[^a-z0-9əöüğışç]+/gi, "-").replace(/^-|-$/g, "") || "novbetime";
}

function shortText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1).trimEnd()}…` : value;
}
