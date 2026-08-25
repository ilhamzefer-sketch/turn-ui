import type {
  BookingCancellationReason,
  LiveQueueAcceptanceOverride,
  LiveQueueEntrySource,
  LiveQueueEntryStatus,
  PlannedBookingStatus,
} from "../../shared/api/contracts";

export function queueStatusLabel(status: LiveQueueEntryStatus) {
  if (status === "WAITING") return "Gözləyir";
  if (status === "CURRENT") return "İndi qəbul olunur";
  if (status === "SKIPPED") return "Gözləməyə alınıb";
  if (status === "COMPLETED") return "Tamamlanıb";
  if (status === "REMOVED") return "Növbədən çıxarılıb";
  return "Sessiya sıfırlanıb";
}

export function bookingStatusLabel(status: PlannedBookingStatus) {
  if (status === "ACTIVE") return "Aktiv";
  if (status === "COMPLETED") return "Tamamlanıb";
  return "Ləğv edilib";
}

export function sourceLabel(source: LiveQueueEntrySource) {
  if (source === "QR") return "QR kod";
  if (source === "WEB") return "Onlayn";
  if (source === "OWNER_PHONE") return "Telefonla əlaqə";
  if (source === "OWNER_WALK_IN") return "Yerində müraciət";
  return "Digər əlaqə";
}

export function acceptanceLabel(value: LiveQueueAcceptanceOverride) {
  if (value === "AUTO") return "İş qrafikinə görə";
  if (value === "FORCE_OPEN") return "Otaq sahibi tərəfindən açıq";
  return "Otaq sahibi tərəfindən bağlı";
}

export function cancellationLabel(reason: BookingCancellationReason | null) {
  if (reason === "CUSTOMER_CANCELLED") return "Müştəri ləğv edib";
  if (reason === "OWNER_CANCELLED") return "Otaq sahibi ləğv edib";
  if (reason === "NO_SHOW") return "İştirakçı gəlməyib";
  return "Ləğv edilib";
}

export function localDateTimeLabel(value: string, timezone?: string) {
  try {
    const [date, time = ""] = value.split("T");
    const dateLabel = new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium" }).format(new Date(`${date}T12:00:00`));
    return `${dateLabel} · ${time.slice(0, 5)}${timezone ? ` (${timezone})` : ""}`;
  } catch {
    return value.replace("T", " ").slice(0, 16);
  }
}

export function localTimeLabel(value: string) {
  return value.slice(11, 16);
}
