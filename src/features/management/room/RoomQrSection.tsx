import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import type { ManagedRoom, QrCredential } from "../../../shared/api/contracts";
import { managementApi } from "../../../shared/api/managementApi";
import { RoomInlineFeedback, type RoomNavigationState } from "./RoomInlineFeedback";
import { Button } from "../../../shared/ui/Button";
import { StatusBadge } from "../ManagementUi";
import { apiMessage } from "../managementUtils";
import { formatManagementDate } from "../managementLabels";

type RoomQrSetupNavigation = {
  finishing: boolean;
  canFinish: boolean;
  onBack: () => void;
  onFinish: () => void;
};

export function RoomQrSection({ room, setupNavigation, onNavigationStateChange }: {
  room: ManagedRoom;
  setupNavigation?: RoomQrSetupNavigation;
  onNavigationStateChange?: (state: RoomNavigationState) => void;
}) {
  const queryClient = useQueryClient();
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
  const markDirty = useCallback((id: number, dirty: boolean) => setDirtyIds((current) => {
    if (current.has(id) === dirty) return current;
    const next = new Set(current);
    if (dirty) next.add(id); else next.delete(id);
    return next;
  }), []);
  const cacheCredential = (saved: QrCredential, removedId?: number) => {
    queryClient.setQueryData<QrCredential[]>(["management-room-qr", room.id], (current = []) => [saved, ...current.filter((item) => item.id !== saved.id && item.id !== removedId)]);
  };
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const qrQuery = useQuery({
    queryKey: ["management-room-qr", room.id],
    queryFn: () => managementApi.qrCodes(room.id),
  });
  const createMutation = useMutation({
    mutationFn: (idempotencyKey: string) => managementApi.createQrCode(room.id, idempotencyKey),
    onSuccess: (saved) => {
      cacheCredential(saved);
      setSuccessMessage("Yeni daimi QR kod yaradıldı.");
    },
  });
  const regenerateMutation = useMutation({
    mutationFn: (credentialId: number) => managementApi.regenerateQrCode(room.id, credentialId),
    onSuccess: (saved, credentialId) => {
      cacheCredential(saved, credentialId);
      markDirty(credentialId, false);
      setSuccessMessage("QR kod yeniləndi. Köhnə kod artıq işləmir.");
    },
  });
  const revokeMutation = useMutation({
    mutationFn: (credentialId: number) => managementApi.revokeQrCode(room.id, credentialId),
    onSuccess: (_, credentialId) => {
      queryClient.setQueryData<QrCredential[]>(["management-room-qr", room.id], (current = []) => current.filter((item) => item.id !== credentialId));
      markDirty(credentialId, false);
      setSuccessMessage("QR kod ləğv edildi.");
    },
  });
  const titleMutation = useMutation({
    mutationFn: ({ credentialId, posterTitle }: { credentialId: number; posterTitle: string | null }) =>
      managementApi.updateQrPosterTitle(room.id, credentialId, posterTitle),
    onSuccess: (saved) => {
      cacheCredential(saved);
      setSuccessMessage("QR afişasının başlığı yadda saxlanıldı.");
    },
  });
  const downloadMutation = useMutation({
    mutationFn: ({ credentialId, filename }: { credentialId: number; filename: string }) =>
      managementApi.downloadQrPoster(room.id, credentialId, filename),
    onSuccess: () => setSuccessMessage("QR afişası PDF kimi yükləndi."),
  });
  const busy = createMutation.isPending || regenerateMutation.isPending || revokeMutation.isPending || titleMutation.isPending || downloadMutation.isPending || Boolean(setupNavigation?.finishing);
  const dirty = dirtyIds.size > 0;
  useEffect(() => {
    onNavigationStateChange?.({ busy, dirty });
    return () => onNavigationStateChange?.({ busy: false, dirty: false });
  }, [busy, dirty, onNavigationStateChange]);
  const error = qrQuery.error
    ?? createMutation.error
    ?? regenerateMutation.error
    ?? revokeMutation.error
    ?? titleMutation.error
    ?? downloadMutation.error;
  const activeCodes = (qrQuery.data ?? []).filter((code) => code.active);

  return (
    <div className="room-section-stack">
      <RoomInlineFeedback success={successMessage} error={error ? apiMessage(error, "QR əməliyyatı tamamlanmadı.") : null} />
      {setupNavigation ? <section className="management-panel room-setup-summary" aria-labelledby="room-summary-title">
        <p className="eyebrow">Son yoxlama</p><h2 id="room-summary-title">Otağınız yayıma hazırdır?</h2>
        <dl><div><dt>Otaq</dt><dd>{room.name}</dd></div><div><dt>İş rejimi</dt><dd>{room.reservationMode === "LIVE_QUEUE" ? "Canlı növbə" : "Planlı rezervasiya"}</dd></div><div><dt>Qəbul müddəti</dt><dd>{room.defaultSlotDurationMinutes} dəqiqə</dd></div><div><dt>Görünürlük</dt><dd>{room.visibility === "PUBLIC" ? "Açıq axtarışda" : room.visibility === "UNLISTED" ? "Yalnız link və QR ilə" : "Məxfi"}</dd></div></dl>
        <p>{setupNavigation.canFinish ? "Əsas məlumatlar, otaq sahibi, qrafik və abunəlik yoxlanılıb. QR kod əlavə etmək istəyə bağlıdır." : "Yayımlama tələbləri yoxlanılır. Yuxarıda göstərilən çatışmazlıqları tamamlayın."}</p>
      </section> : null}
      <section className="management-panel" aria-labelledby="qr-title">
        <div className="section-heading">
          <div><p className="eyebrow">Daimi giriş nöqtələri</p><h2 id="qr-title">QR kodlar</h2></div>
          <Button loading={createMutation.isPending} disabled={busy || setupNavigation?.finishing} onClick={() => createMutation.mutate(crypto.randomUUID())}>Yeni QR yarat</Button>
        </div>
        <p className="section-intro">Hər giriş nöqtəsi üçün ayrıca daimi QR yaradın. Kod siz ləğv edənədək işləyir.</p>
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
                busy={busy || Boolean(setupNavigation?.finishing)}
                saving={titleMutation.isPending && titleMutation.variables?.credentialId === credential.id}
                regenerating={regenerateMutation.isPending && regenerateMutation.variables === credential.id}
                revoking={revokeMutation.isPending && revokeMutation.variables === credential.id}
                onDirtyChange={markDirty}
                downloading={downloadMutation.isPending && downloadMutation.variables?.credentialId === credential.id}
                onSaveTitle={(posterTitle) => titleMutation.mutate({ credentialId: credential.id, posterTitle })}
                onDownload={(filename) => downloadMutation.mutate({ credentialId: credential.id, filename })}
                onRegenerate={() => {
                  if (window.confirm("QR kod yenilənsin? Köhnə link və çap edilmiş afişalar dərhal işləməyəcək. Yeni afişanı yenidən çap etməlisiniz.")) regenerateMutation.mutate(credential.id);
                }}
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
          <Button variant="secondary" disabled={busy || setupNavigation.finishing} onClick={setupNavigation.onBack}>Geri</Button>
          <div>
            <p>{dirty ? "Əvvəl QR afişasının dəyişdirilmiş başlığını saxlayın." : "QR kod istəyə bağlıdır. Sonradan da əlavə edə bilərsiniz."}</p>
            <Button loading={setupNavigation.finishing} disabled={busy || dirty || !setupNavigation.canFinish} onClick={setupNavigation.onFinish}>Otağı yayımla</Button>
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
  saving: boolean;
  regenerating: boolean;
  revoking: boolean;
  onDirtyChange: (id: number, dirty: boolean) => void;
  onSaveTitle: (posterTitle: string | null) => void;
  onDownload: (filename: string) => void;
  onRegenerate: () => void;
  onRevoke: () => void;
};

function QrCard({ credential, room, index, busy, downloading, saving, regenerating, revoking, onDirtyChange, onSaveTitle, onDownload, onRegenerate, onRevoke }: QrCardProps) {
  const [copyLabel, setCopyLabel] = useState("Linki kopyala");
  const savedTitle = credential.posterTitle?.trim() || room.name;
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const posterTitle = titleDraft ?? savedTitle;
  const [copyError, setCopyError] = useState<string | null>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  const token = credential.token?.trim() ?? "";
  const publicUrl = token ? `${window.location.origin}/q/${encodeURIComponent(token)}` : null;
  const modeLabel = room.reservationMode === "LIVE_QUEUE" ? "Canlı növbə" : "Planlı qəbul";
  const normalizedTitle = posterTitle.trim().replace(/\s+/g, " ");
  const previewTitle = normalizedTitle || room.name;
  const titleChanged = previewTitle !== savedTitle;

  useEffect(() => {
    onDirtyChange(credential.id, titleChanged);
    return () => onDirtyChange(credential.id, false);
  }, [credential.id, onDirtyChange, titleChanged]);
  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const copy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyError(null);
      setCopyLabel("Kopyalandı");
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopyLabel("Linki kopyala"), 1800);
    } catch {
      setCopyError("Link kopyalanmadı. Aşağıdakı linki seçib əl ilə kopyalaya bilərsiniz.");
    }
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
        <StatusBadge tone={room.status === "PUBLISHED" ? "success" : "warning"}>{room.status === "PUBLISHED" ? "Aktiv" : "Yayımlanmanı gözləyir"}</StatusBadge>
      </header>
      <div className="qr-card__title-editor">
        <label htmlFor={`qr-poster-title-${credential.id}`}>Afişa başlığı</label>
        <div>
          <input
            id={`qr-poster-title-${credential.id}`}
            className="field__control"
            maxLength={80}
            value={posterTitle}
            disabled={busy}
            onChange={(event) => setTitleDraft(event.target.value)}
          />
          <Button variant="secondary" loading={saving} disabled={!titleChanged || busy} onClick={saveTitle}>Başlığı yadda saxla</Button>
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
          <QrImage publicUrl={publicUrl} title={`${room.name} üçün QR kod ${index}`} />
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
      {copyError ? <div className="warning-note" role="alert">{copyError}<input aria-label="QR keçidi" className="field__control" readOnly value={publicUrl ?? ""} onFocus={(event) => event.target.select()} /></div> : null}
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
        <Button variant={publicUrl ? "quiet" : "primary"} loading={regenerating} disabled={busy} onClick={onRegenerate}>
          {publicUrl ? "Yenilə" : "QR kodu bərpa et"}
        </Button>
        <Button variant="quiet" loading={revoking} disabled={busy} onClick={onRevoke}>Ləğv et</Button>
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

const QrImage = memo(function QrImage({ publicUrl, title }: { publicUrl: string; title: string }) {
  return <QRCodeSVG value={publicUrl} size={236} level="H" marginSize={4} fgColor="#004f45" title={title} imageSettings={{ src: "/novbetime-logo.png", height: 62, width: 62, excavate: true }} />;
});
