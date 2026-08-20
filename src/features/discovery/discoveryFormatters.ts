import type { PublicRoomLocation, ReservationMode } from "../../shared/api/contracts";

export function reservationModeLabel(mode: ReservationMode) {
  return mode === "LIVE_QUEUE" ? "Canlı növbə" : "Planlı rezervasiya";
}

export function locationLabel(location: PublicRoomLocation | null) {
  if (!location) return "Ünvan paylaşılmayıb";
  return [location.district, location.city, location.address]
    .filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index)
    .join(" · ") || "Ünvan paylaşılmayıb";
}

export function ratingLabel(averageRating: number, ratingCount: number) {
  if (ratingCount === 0) return "Hələ qiymətləndirilməyib";
  return `${averageRating.toFixed(1)} · ${ratingCount} qiymət`;
}

export function formatPrice(price: number | null, currency: string | null) {
  if (price === null) return null;
  try {
    return new Intl.NumberFormat("az-AZ", {
      style: "currency",
      currency: currency || "AZN",
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${price} ${currency || "AZN"}`;
  }
}

export function todayInTimezone(timezone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function timeLabel(localDateTime: string) {
  return localDateTime.slice(11, 16);
}
