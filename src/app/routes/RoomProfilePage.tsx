import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import {
  locationLabel,
  ratingLabel,
  reservationModeLabel,
  timeLabel,
  todayInTimezone,
} from "../../features/discovery/discoveryFormatters";
import { localDateTimeLabel } from "../../features/operations/operationFormatters";
import { ApiError } from "../../shared/api/httpClient";
import { publicApi } from "../../shared/api/publicApi";
import { queueApi } from "../../shared/api/queueApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { ButtonLink } from "../../shared/ui/Button";

export function RoomProfilePage() {
  const roomId = Number(useParams().roomId);
  const hasValidId = Number.isInteger(roomId) && roomId > 0;
  const roomQuery = useQuery({
    queryKey: ["public-room", roomId],
    queryFn: () => publicApi.room(roomId),
    enabled: hasValidId,
  });
  const room = roomQuery.data;
  const today = room ? todayInTimezone(room.timezone) : "";
  const slotsQuery = useQuery({
    queryKey: ["public-room-slots", roomId, today],
    queryFn: () => publicApi.availableSlots(roomId, today),
    enabled: Boolean(room && room.reservationMode === "PLANNED_BOOKING" && today),
  });
  const liveQueueQuery = useQuery({
    queryKey: ["public-live-queue", roomId],
    queryFn: () => queueApi.publicRoom(roomId),
    enabled: Boolean(room && room.reservationMode === "LIVE_QUEUE"),
    refetchInterval: 30_000,
  });
  const structuredData = useMemo(() => room ? {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${room.name} — ${room.providerName}`,
    description: room.description || room.providerDescription || `${room.providerName} üçün onlayn növbə və qəbul səhifəsi.`,
    url: `https://novbetime.az/rooms/${room.id}`,
    serviceType: reservationModeLabel(room.reservationMode),
    provider: {
      "@type": "Organization",
      name: room.providerName,
      telephone: room.contactPhone ?? undefined,
    },
    areaServed: room.location?.city ? {
      "@type": "City",
      name: room.location.city,
    } : undefined,
  } : undefined, [room]);

  usePageMeta(
    room ? `${room.name} — ${room.providerName} | NövbəTime` : "Otaq profili — NövbəTime",
    room?.description || "Otağın növbə növü, ünvanı və uyğun saatları ilə tanış olun.",
    { canonicalPath: hasValidId ? `/rooms/${roomId}` : "/rooms", structuredData },
  );

  if (!hasValidId) return <ProfileNotFound />;

  if (roomQuery.isPending) {
    return (
      <div className="profile-loading shell" role="status">
        <span className="page-loader__mark" aria-hidden="true" />
        <p>Otaq profili yüklənir...</p>
      </div>
    );
  }

  if (roomQuery.isError) {
    if (roomQuery.error instanceof ApiError && roomQuery.error.status === 404) return <ProfileNotFound />;
    return (
      <div className="shell profile-error" role="alert">
        <p className="eyebrow">Bağlantı xətası</p>
        <h1>Otaq profili yüklənmədi</h1>
        <p>Bağlantını yoxlayın və yenidən cəhd edin.</p>
        <button className="button button--secondary" type="button" onClick={() => roomQuery.refetch()}>
          Yenidən yoxla
        </button>
      </div>
    );
  }

  if (!room) return null;

  const category = room.category?.name || room.customSubcategory;
  const acceptingNewEntries = liveQueueQuery.data?.acceptingNewEntries ?? false;

  return (
    <article className="room-profile">
      <header className="profile-hero">
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Səhifə yolu">
            <Link to="/rooms">Otaqlar</Link><span aria-hidden="true">/</span>
            <span>{room.providerName}</span><span aria-hidden="true">/</span>
            <span aria-current="page">{room.name}</span>
          </nav>

          <div className="profile-hero__grid">
            <div className="profile-identity">
              {room.providerLogoUrl ? (
                <img src={room.providerLogoUrl} width="80" height="80" alt={`${room.providerName} loqosu`} />
              ) : (
                <div className="provider-mark provider-mark--large" aria-hidden="true">
                  {room.providerName.trim().slice(0, 1).toLocaleUpperCase("az")}
                </div>
              )}
              <div>
                <p className="profile-provider">{room.providerName}</p>
                <p>{room.branchName || "Fərdi mütəxəssis"}</p>
              </div>
            </div>

            <div className="profile-title">
              <div className="profile-title__meta">
                {category && <span>{category}</span>}
                <span className={`mode-badge mode-badge--${room.reservationMode.toLowerCase()}`}>
                  {reservationModeLabel(room.reservationMode)}
                </span>
              </div>
              <h1>{room.name}</h1>
              {room.description && <p>{room.description}</p>}
            </div>

            <dl className="profile-facts">
              <div><dt>Ünvan</dt><dd>{locationLabel(room.location)}</dd></div>
              <div><dt>Qiymətləndirmə</dt><dd>{ratingLabel(room.averageRating, room.ratingCount)}</dd></div>
              <div><dt>Standart müddət</dt><dd>{room.defaultSlotDurationMinutes} dəqiqə</dd></div>
            </dl>
          </div>
        </div>
      </header>

      <div className="shell profile-layout">
        <div className="profile-content">
          <section className="profile-section" aria-labelledby="provider-title">
            <p className="eyebrow">Biznes və filial</p>
            <h2 id="provider-title">{room.providerName}</h2>
            {room.providerDescription && <p>{room.providerDescription}</p>}
            <dl className="detail-list">
              {room.branchName && <div><dt>Filial</dt><dd>{room.branchName}</dd></div>}
              <div><dt>Ünvan</dt><dd>{locationLabel(room.location)}</dd></div>
              {room.contactPhone && (
                <div><dt>Əlaqə</dt><dd><a href={`tel:${room.contactPhone}`}>{room.contactPhone}</a></dd></div>
              )}
            </dl>
          </section>

          <section className="profile-section" aria-labelledby="owners-title">
            <p className="eyebrow">Otaq sahibləri</p>
            <h2 id="owners-title">Otağı idarə edən komanda</h2>
            <div className="owner-list">
              {room.owners.map((owner) => (
                <article key={`${owner.displayName}-${owner.phone ?? "private"}`}>
                  <div className="provider-mark" aria-hidden="true">{owner.displayName.slice(0, 1).toLocaleUpperCase("az")}</div>
                  <div><h3>{owner.displayName}</h3><p>{owner.phone ? <a href={`tel:${owner.phone}`}>{owner.phone}</a> : "Telefon gizlidir"}</p></div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="availability-card" aria-labelledby="availability-title">
          <p className="eyebrow">{reservationModeLabel(room.reservationMode)}</p>
          <h2 id="availability-title">
            {room.reservationMode === "LIVE_QUEUE" ? "Cari qəbul vəziyyəti" : "Bu gün üçün boş saatlar"}
          </h2>

          {room.reservationMode === "LIVE_QUEUE" ? (
            <div className="live-status-panel">
              <span className={acceptingNewEntries ? "is-open" : "is-closed"} aria-hidden="true" />
              <div>
                <strong>{liveQueueQuery.isPending ? "Cari vəziyyət yoxlanılır" : acceptingNewEntries ? "Yeni iştirakçılar qəbul olunur" : "Hazırda qoşulmaq mümkün deyil"}</strong>
                <p>Hər iştirakçı üçün təxmini növbə müddəti {room.defaultSlotDurationMinutes} dəqiqədir.</p>
                {!acceptingNewEntries && liveQueueQuery.data?.nextOpeningAt ? (
                  <p>Növbəti açılış: {localDateTimeLabel(liveQueueQuery.data.nextOpeningAt, room.timezone)}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <SlotPreview isPending={slotsQuery.isPending} isError={slotsQuery.isError} slots={slotsQuery.data} />
          )}

          <ButtonLink to={room.reservationMode === "LIVE_QUEUE" ? `/rooms/${room.id}/live` : `/rooms/${room.id}/book`}>
            {room.reservationMode === "LIVE_QUEUE" ? "Canlı növbəyə qoşul" : "Vaxt seç və rezervasiya et"}
          </ButtonLink>

          <div className="availability-card__note">
            <strong>{room.timezone}</strong>
            <span>Saatlar otağın yerli vaxtı ilə göstərilir.</span>
          </div>
        </aside>
      </div>
    </article>
  );
}

function SlotPreview({ isPending, isError, slots }: { isPending: boolean; isError: boolean; slots?: { startAt: string }[] }) {
  if (isPending) return <p className="empty-copy" role="status">Boş saatlar yoxlanılır...</p>;
  if (isError) return <p className="empty-copy" role="status">Boş saatları hazırda göstərmək mümkün deyil.</p>;
  if (!slots?.length) return <p className="empty-copy">Bu gün üçün boş saat yoxdur.</p>;
  return (
    <ul className="available-slots" aria-label="Bu günün boş saatları">
      {slots.slice(0, 8).map((slot) => <li key={slot.startAt}>{timeLabel(slot.startAt)}</li>)}
    </ul>
  );
}

function ProfileNotFound() {
  return (
    <div className="shell profile-error">
      <p className="eyebrow">Otaq tapılmadı</p>
      <h1>Bu profil artıq açıq deyil</h1>
      <p>Otaq gizlədilmiş, silinmiş və ya keçid düzgün olmaya bilər.</p>
      <Link className="button button--primary" to="/rooms">Açıq otaqları göstər</Link>
    </div>
  );
}
