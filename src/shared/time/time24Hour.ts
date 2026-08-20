export const TIME_24_HOUR_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function formatTime24Input(value: string) {
  const filtered = value.replace(/[^0-9:]/g, "");
  if (filtered.includes(":")) {
    const [hour = "", minute = ""] = filtered.split(":");
    return `${hour.slice(0, 2)}:${minute.slice(0, 2)}`;
  }
  const digits = filtered.slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export function normalizeTime24(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return value;
  const normalized = `${match[1].padStart(2, "0")}:${match[2].padStart(2, "0")}`;
  return TIME_24_HOUR_PATTERN.test(normalized) ? normalized : value;
}

export function isTime24(value: string) {
  return TIME_24_HOUR_PATTERN.test(value);
}
