import type { ManagedRoom, RoomConfigurationInput, Weekday, WeeklyAvailabilityRule, WeeklyAvailabilityRuleInput } from "../../../shared/api/contracts";
import { isTime24 } from "../../../shared/time/time24Hour";
import { nullableNumber, weekdayOptions } from "../managementLabels";
import type { LiveQueueConfigurationFormValues } from "../schemas";

export type ScheduleInterval = { key: string; startTime: string; endTime: string };
export type DaySchedule = { day: Weekday; enabled: boolean; intervals: ScheduleInterval[] };
export type ScheduleDraft = { days: DaySchedule[] | null; configuration: LiveQueueConfigurationFormValues | null; expectedUpdatedAt?: string | null };

export function liveQueueValues(room: ManagedRoom): LiveQueueConfigurationFormValues {
  return {
    liveQueueResetPolicy: room.liveQueueResetPolicy ?? "DAILY_AT_TIME",
    liveQueueResetLocalTime: room.liveQueueResetLocalTime?.slice(0, 5) ?? "00:00",
    liveQueueResetIntervalMinutes: room.liveQueueResetIntervalMinutes ? String(room.liveQueueResetIntervalMinutes) : "",
    liveQueueMaxParticipants: room.liveQueueMaxParticipants ? String(room.liveQueueMaxParticipants) : "",
    liveQueueAcceptingNewEntries: room.liveQueueAcceptingNewEntries,
  };
}

export function liveQueueConfigurationInput(room: ManagedRoom, values: LiveQueueConfigurationFormValues): RoomConfigurationInput {
  if (!values.liveQueueResetPolicy) throw new Error("Növbənin sıfırlanma qaydasını seçin.");
  return {
    defaultSlotDurationMinutes: room.defaultSlotDurationMinutes,
    appointmentBufferMinutes: room.appointmentBufferMinutes,
    bookingWindowDays: room.bookingWindowDays,
    minimumAdvanceMinutes: room.minimumAdvanceMinutes,
    cancellationCutoffMinutes: room.cancellationCutoffMinutes,
    liveQueueResetPolicy: values.liveQueueResetPolicy,
    liveQueueResetLocalTime: values.liveQueueResetPolicy === "DAILY_AT_TIME" ? values.liveQueueResetLocalTime : null,
    liveQueueResetIntervalMinutes: values.liveQueueResetPolicy === "EVERY_INTERVAL" ? nullableNumber(values.liveQueueResetIntervalMinutes) : null,
    liveQueueMaxParticipants: nullableNumber(values.liveQueueMaxParticipants),
    liveQueueAcceptingNewEntries: values.liveQueueAcceptingNewEntries,
  };
}

export function newInterval(startTime: string, endTime: string): ScheduleInterval {
  return { key: `interval-${crypto.randomUUID()}`, startTime, endTime };
}

export function emptyWeek(): DaySchedule[] {
  return weekdayOptions.map((option) => ({
    day: option.value,
    enabled: option.value !== "SATURDAY" && option.value !== "SUNDAY",
    intervals: [{ key: `default-${option.value}`, startTime: "09:00", endTime: "18:00" }],
  }));
}

export function scheduleFromRules(rules: WeeklyAvailabilityRule[]): DaySchedule[] {
  return weekdayOptions.map((option) => {
    const dayRules = rules.filter((rule) => rule.dayOfWeek === option.value && rule.active);
    return {
      day: option.value,
      enabled: dayRules.length > 0,
      intervals: dayRules.length > 0
        ? dayRules.map((rule) => ({ key: `saved-${rule.id}`, startTime: rule.startTime.slice(0, 5), endTime: rule.endTime.slice(0, 5) }))
        : [{ key: `default-${option.value}`, startTime: "09:00", endTime: "18:00" }],
    };
  });
}

export function replaceInterval(day: DaySchedule, index: number, field: "startTime" | "endTime", value: string): DaySchedule {
  return {
    ...day,
    intervals: day.intervals.map((interval, itemIndex) => itemIndex === index ? { ...interval, [field]: value } : interval),
  };
}

export function validateSchedule(days: DaySchedule[]) {
  if (days.reduce((sum, day) => sum + (day.enabled ? day.intervals.length : 0), 0) > 56) return "Həftədə ən çox 56 iş intervalı əlavə etmək olar.";
  for (const day of days) {
    if (!day.enabled) continue;
    const option = weekdayOptions.find((item) => item.value === day.day);
    const intervals = [...day.intervals].sort((first, second) => first.startTime.localeCompare(second.startTime));
    for (let index = 0; index < intervals.length; index += 1) {
      const current = intervals[index];
      if (!isTime24(current.startTime) || !isTime24(current.endTime) || current.startTime >= current.endTime) return `${option?.label}: saatları 24 saat formatında yazın və başlanğıcı bitmədən əvvəl seçin.`;
      const previous = intervals[index - 1];
      if (previous && previous.endTime > current.startTime) return `${option?.label}: iş intervalları üst-üstə düşə bilməz.`;
    }
  }
  if (!days.some((day) => day.enabled)) return "Ən azı bir iş günü açıq olmalıdır.";
  return null;
}


export function scheduleInput(days: DaySchedule[]): WeeklyAvailabilityRuleInput[] {
  return days.flatMap((day) => day.enabled ? day.intervals.map((interval) => ({
    dayOfWeek: day.day, startTime: interval.startTime, endTime: interval.endTime, active: true,
  })) : []);
}

export function scheduleSignature(rules: WeeklyAvailabilityRuleInput[]): string {
  return JSON.stringify(rules.filter((rule) => rule.active).map((rule) => ({
    day: rule.dayOfWeek, start: rule.startTime.slice(0, 5), end: rule.endTime.slice(0, 5),
  })).sort((a, b) => `${a.day}:${a.start}:${a.end}`.localeCompare(`${b.day}:${b.start}:${b.end}`)));
}

const storageKey = (roomId: number) => `novbetime.room-schedule-draft.v1:${roomId}`;
export function readScheduleDraft(roomId: number): ScheduleDraft | null {
  try {
    const value = sessionStorage.getItem(storageKey(roomId));
    if (!value) return null;
    const parsed = JSON.parse(value) as ScheduleDraft;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.expectedUpdatedAt != null && typeof parsed.expectedUpdatedAt !== "string") return null;
    if (parsed.days && (!Array.isArray(parsed.days) || parsed.days.length !== 7
      || !parsed.days.every((day) => weekdayOptions.some((option) => option.value === day.day)
        && typeof day.enabled === "boolean" && Array.isArray(day.intervals)
        && day.intervals.every((interval) => typeof interval.key === "string"
          && typeof interval.startTime === "string" && typeof interval.endTime === "string")))) return null;
    if (parsed.configuration && (typeof parsed.configuration.liveQueueResetLocalTime !== "string"
      || typeof parsed.configuration.liveQueueResetIntervalMinutes !== "string"
      || typeof parsed.configuration.liveQueueMaxParticipants !== "string"
      || typeof parsed.configuration.liveQueueAcceptingNewEntries !== "boolean")) return null;
    return parsed;
  } catch { return null; }
}

export function writeScheduleDraft(roomId: number, draft: ScheduleDraft): void {
  try {
    if (!draft.days && !draft.configuration) sessionStorage.removeItem(storageKey(roomId));
    else sessionStorage.setItem(storageKey(roomId), JSON.stringify(draft));
  } catch { /* Private browsing may disallow storage; in-memory edits still work. */ }
}
