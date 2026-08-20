import { Link } from "react-router-dom";

import type { PublicRoomSummary } from "../../shared/api/contracts";
import { locationLabel, ratingLabel, reservationModeLabel } from "./discoveryFormatters";

export function RoomCard({ room }: { room: PublicRoomSummary }) {
  const services = room.serviceNames.slice(0, 3);

  return (
    <article className="room-card">
      <div className="room-card__header">
        <div className="provider-mark" aria-hidden="true">{room.providerName.trim().slice(0, 1).toLocaleUpperCase("az")}</div>
        <div>
          <p className="room-card__provider">{room.providerName}</p>
          <p className="room-card__branch">{room.branchName || "Fərdi mütəxəssis"}</p>
        </div>
        <span className={`mode-badge mode-badge--${room.reservationMode.toLowerCase()}`}>
          {reservationModeLabel(room.reservationMode)}
        </span>
      </div>

      <div className="room-card__body">
        <p className="room-card__category">{room.category?.name || room.customSubcategory || "Xidmət otağı"}</p>
        <h2><Link to={`/rooms/${room.id}`}>{room.name}</Link></h2>
        {room.description && <p className="room-card__description">{room.description}</p>}
        <p className="room-card__location"><span aria-hidden="true">⌖</span>{locationLabel(room.location)}</p>
        {services.length > 0 && (
          <ul className="service-tags" aria-label="Xidmətlər">
            {services.map((service) => <li key={service}>{service}</li>)}
          </ul>
        )}
      </div>

      <div className="room-card__footer">
        <span className="rating-label" aria-label={ratingLabel(room.averageRating, room.ratingCount)}>
          <span aria-hidden="true">★</span> {ratingLabel(room.averageRating, room.ratingCount)}
        </span>
        <Link className="room-card__link" to={`/rooms/${room.id}`}>
          Profili aç <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
