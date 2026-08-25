import type {
  BusinessMembershipStatus,
  BusinessRole,
  ReservationMode,
  RoomAssignmentStatus,
  RoomStatus,
  RoomVisibility,
  Weekday,
} from "../../shared/api/contracts";

export const weekdayOptions: Array<{ value: Weekday; label: string; shortLabel: string }> = [
  { value: "MONDAY", label: "Bazar ertəsi", shortLabel: "B.e" },
  { value: "TUESDAY", label: "Çərşənbə axşamı", shortLabel: "Ç.a" },
  { value: "WEDNESDAY", label: "Çərşənbə", shortLabel: "Ç" },
  { value: "THURSDAY", label: "Cümə axşamı", shortLabel: "C.a" },
  { value: "FRIDAY", label: "Cümə", shortLabel: "C" },
  { value: "SATURDAY", label: "Şənbə", shortLabel: "Ş" },
  { value: "SUNDAY", label: "Bazar", shortLabel: "B" },
];

export function reservationModeLabel(mode: ReservationMode) {
  return mode === "LIVE_QUEUE" ? "Canlı növbə" : "Planlı rezervasiya";
}

export function visibilityLabel(visibility: RoomVisibility) {
  if (visibility === "PUBLIC") return "Açıq axtarış";
  if (visibility === "UNLISTED") return "Yalnız linklə";
  return "Məxfi";
}

export function roomStatusLabel(status: RoomStatus) {
  if (status === "DRAFT") return "Qaralama";
  if (status === "PUBLISHED") return "Yayımlanıb";
  if (status === "INACTIVE") return "Dayandırılıb";
  return "Arxivdə";
}

export function businessRoleLabel(role: BusinessRole) {
  if (role === "PRIMARY_OWNER") return "Əsas sahib";
  if (role === "ADMIN") return "Administrator";
  return "İşçi";
}

export function membershipStatusLabel(status: BusinessMembershipStatus) {
  if (status === "PENDING_ACCEPTANCE") return "Cavab gözləyir";
  if (status === "ACTIVE") return "Aktiv";
  if (status === "REJECTED") return "Rədd edilib";
  if (status === "SUSPENDED") return "Dayandırılıb";
  return "Silinib";
}

export function assignmentStatusLabel(status: RoomAssignmentStatus) {
  if (status === "PENDING_ACCEPTANCE") return "Dəvət göndərilib";
  if (status === "ACTIVE") return "Aktiv otaq sahibi";
  if (status === "REJECTED") return "Rədd edilib";
  return "Ləğv edilib";
}

export function formatManagementDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function nullableNumber(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? Number(trimmed) : null;
}
