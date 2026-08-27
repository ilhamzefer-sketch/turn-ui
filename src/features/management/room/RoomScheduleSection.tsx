import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type {
  AvailabilityExceptionInput,
  AvailabilityExceptionType,
  ManagedRoom,
  Weekday,
  WeeklyAvailabilityRule,
} from "../../../shared/api/contracts";
import { managementApi } from "../../../shared/api/managementApi";
import { NotificationEvent } from "../../../shared/notifications/NotificationProvider";
import { Button } from "../../../shared/ui/Button";
import { SelectField } from "../../../shared/ui/SelectField";
import { TextField } from "../../../shared/ui/TextField";
import { TimeField } from "../../../shared/ui/TimeField";
import { isTime24 } from "../../../shared/time/time24Hour";
import { StatusBadge } from "../ManagementUi";
import { apiMessage } from "../managementUtils";
import { weekdayOptions } from "../managementLabels";

type ScheduleInterval = { key: string; startTime: string; endTime: string };
type DaySchedule = { day: Weekday; enabled: boolean; intervals: ScheduleInterval[] };

let intervalSequence = 0;

type RoomScheduleSetupNavigation = {
  onBack: () => void;
  onContinue: () => void;
};

export function RoomScheduleSection({ room, setupNavigation }: { room: ManagedRoom; setupNavigation?: RoomScheduleSetupNavigation }) {
  const queryClient = useQueryClient();
  const [scheduleDraft, setScheduleDraft] = useState<{
    source: WeeklyAvailabilityRule[] | undefined;
    days: DaySchedule[];
  } | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [exception, setException] = useState<AvailabilityExceptionInput>({
    date: "",
    type: "CLOSED",
    startTime: null,
    endTime: null,
    reason: null,
  });
  const scheduleQuery = useQuery({
    queryKey: ["management-room-schedule", room.id],
    queryFn: () => managementApi.weeklyAvailability(room.id),
  });
  const exceptionsQuery = useQuery({
    queryKey: ["management-room-exceptions", room.id],
    queryFn: () => managementApi.availabilityExceptions(room.id),
  });

  const days = scheduleDraft && scheduleDraft.source === scheduleQuery.data
    ? scheduleDraft.days
    : scheduleQuery.data
      ? scheduleFromRules(scheduleQuery.data)
      : emptyWeek();
  const hasUnsavedChanges = Boolean(scheduleDraft && scheduleDraft.source === scheduleQuery.data);
  const setDays = (updater: DaySchedule[] | ((current: DaySchedule[]) => DaySchedule[])) => {
    setScheduleDraft((current) => {
      const currentDays = current && current.source === scheduleQuery.data
        ? current.days
        : scheduleQuery.data
          ? scheduleFromRules(scheduleQuery.data)
          : emptyWeek();
      return {
        source: scheduleQuery.data,
        days: typeof updater === "function" ? updater(currentDays) : updater,
      };
    });
  };

  const saveMutation = useMutation({
    mutationFn: (continueAfterSave: boolean) => {
      void continueAfterSave;
      const validation = validateSchedule(days);
      if (validation) throw new Error(validation);
      return managementApi.replaceWeeklyAvailability(
        room.id,
        days.flatMap((day) => day.enabled
          ? day.intervals.map((interval) => ({
              dayOfWeek: day.day,
              startTime: interval.startTime,
              endTime: interval.endTime,
              active: true,
            }))
          : []),
      );
    },
    onSuccess: (savedRules, continueAfterSave) => {
      setScheduleError(null);
      setSuccessMessage("Həftəlik iş qrafiki saxlanıldı.");
      queryClient.setQueryData(["management-room-schedule", room.id], savedRules);
      setScheduleDraft(null);
      if (continueAfterSave) setupNavigation?.onContinue();
    },
    onError: (error) => setScheduleError(apiMessage(error, "İş qrafiki saxlanılmadı.")),
  });
  const createExceptionMutation = useMutation({
    mutationFn: () => {
      if (!exception.date) throw new Error("Tarixi seçin.");
      if (exception.type !== "CLOSED" && (!exception.startTime || !exception.endTime || exception.startTime >= exception.endTime)) {
        throw new Error("Xüsusi saat üçün düzgün başlanğıc və bitmə vaxtı seçin.");
      }
      return managementApi.createAvailabilityException(room.id, {
        ...exception,
        startTime: exception.type === "CLOSED" ? null : exception.startTime,
        endTime: exception.type === "CLOSED" ? null : exception.endTime,
      });
    },
    onSuccess: async () => {
      setException({ date: "", type: "CLOSED", startTime: null, endTime: null, reason: null });
      setSuccessMessage("Xüsusi tarix qaydası əlavə edildi.");
      await queryClient.invalidateQueries({ queryKey: ["management-room-exceptions", room.id] });
    },
  });
  const deleteExceptionMutation = useMutation({
    mutationFn: (exceptionId: number) => managementApi.deleteAvailabilityException(room.id, exceptionId),
    onSuccess: async () => {
      setSuccessMessage("Xüsusi tarix qaydası silindi.");
      await queryClient.invalidateQueries({ queryKey: ["management-room-exceptions", room.id] });
    },
  });
  const error = scheduleQuery.error ?? exceptionsQuery.error ?? createExceptionMutation.error ?? deleteExceptionMutation.error;

  const updateDay = (day: Weekday, updater: (current: DaySchedule) => DaySchedule) => {
    setDays((current) => current.map((item) => item.day === day ? updater(item) : item));
    setScheduleError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="room-section-stack">
      <NotificationEvent tone="success" message={successMessage} />
      <NotificationEvent tone="error" message={scheduleError ?? (error ? apiMessage(error, "Qrafik əməliyyatı tamamlanmadı.") : null)} />

      <section className="management-panel" aria-labelledby="weekly-hours-title">
        <div className="section-heading">
          <div><p className="eyebrow">Təkrarlanan həftə</p><h2 id="weekly-hours-title">İş saatları</h2></div>
          <p>Bir gündə birdən çox interval əlavə edərək nahar və digər fasilələri ayıra bilərsiniz.</p>
        </div>
        <div className="schedule-toolbar">
          {hasUnsavedChanges ? <strong role="status">Saxlanmamış dəyişikliklər var</strong> : <span>Qrafik serverlə eynidir</span>}
          <Button
            variant="secondary"
            onClick={() => {
              const monday = days.find((day) => day.day === "MONDAY");
              if (!monday) return;
              setDays((current) => current.map((day) => {
                if (day.day === "SATURDAY" || day.day === "SUNDAY" || day.day === "MONDAY") return day;
                return { ...day, enabled: monday.enabled, intervals: monday.intervals.map((item) => newInterval(item.startTime, item.endTime)) };
              }));
              setSuccessMessage("Bazar ertəsinin saatları digər iş günlərinə kopyalandı. Saxlamağı unutmayın.");
            }}
          >B.e saatlarını iş günlərinə kopyala</Button>
          <Button loading={saveMutation.isPending} disabled={!hasUnsavedChanges} onClick={() => saveMutation.mutate(false)}>Dəyişiklikləri saxla</Button>
        </div>
        {scheduleQuery.isPending ? <p role="status">İş saatları açılır…</p> : (
          <div className="week-editor">
            {days.map((day) => {
              const option = weekdayOptions.find((item) => item.value === day.day);
              return (
                <fieldset className="day-editor" key={day.day}>
                  <legend className="sr-only">{option?.label}</legend>
                  <label className="day-editor__toggle">
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={(event) => updateDay(day.day, (current) => ({ ...current, enabled: event.target.checked }))}
                    />
                    <span><strong>{option?.label}</strong><small>{day.enabled ? "Açıq" : "Bağlı"}</small></span>
                  </label>
                  <div className="day-editor__intervals">
                    {day.enabled ? day.intervals.map((interval, index) => (
                      <div className="time-interval" key={interval.key}>
                        <TimeField label="Başlayır" value={interval.startTime} onChange={(event) => updateDay(day.day, (current) => replaceInterval(current, index, "startTime", event.target.value))} />
                        <span aria-hidden="true">—</span>
                        <TimeField label="Bitir" value={interval.endTime} onChange={(event) => updateDay(day.day, (current) => replaceInterval(current, index, "endTime", event.target.value))} />
                        {day.intervals.length > 1 ? <Button variant="quiet" onClick={() => updateDay(day.day, (current) => ({ ...current, intervals: current.intervals.filter((_, itemIndex) => itemIndex !== index) }))}>Sil</Button> : null}
                      </div>
                    )) : <p>Bu gün yeni növbə qəbul edilmir.</p>}
                    {day.enabled ? <Button variant="quiet" onClick={() => updateDay(day.day, (current) => ({ ...current, intervals: [...current.intervals, newInterval("14:00", "18:00")] }))}>+ Interval əlavə et</Button> : null}
                  </div>
                </fieldset>
              );
            })}
          </div>
        )}
        <div className="management-form__actions"><Button loading={saveMutation.isPending} disabled={!hasUnsavedChanges} onClick={() => saveMutation.mutate(false)}>İş qrafikini saxla</Button></div>
      </section>

      <section className="management-panel" aria-labelledby="exceptions-title">
        <div className="section-heading">
          <div><p className="eyebrow">Tətil və fərqli saatlar</p><h2 id="exceptions-title">Xüsusi tarixlər</h2></div>
          <p>Həftəlik qrafiki dəyişmədən bir günü bağlayın və ya fərqli saat təyin edin.</p>
        </div>
        <div className="exception-form">
          <TextField label="Tarix" type="date" value={exception.date} onChange={(event) => setException((current) => ({ ...current, date: event.target.value }))} />
          <SelectField label="Qayda" value={exception.type} onChange={(event) => setException((current) => ({ ...current, type: event.target.value as AvailabilityExceptionType }))}>
            <option value="CLOSED">Bütün gün bağlı</option>
            <option value="CUSTOM_HOURS">Fərqli iş saatları</option>
            <option value="BLOCKED_INTERVAL">Bağlı interval</option>
          </SelectField>
          {exception.type !== "CLOSED" ? (
            <>
              <TimeField label="Başlanğıc" value={exception.startTime ?? ""} onChange={(event) => setException((current) => ({ ...current, startTime: event.target.value }))} />
              <TimeField label="Bitmə" value={exception.endTime ?? ""} onChange={(event) => setException((current) => ({ ...current, endTime: event.target.value }))} />
            </>
          ) : null}
          <TextField label="Səbəb (istəyə bağlı)" value={exception.reason ?? ""} onChange={(event) => setException((current) => ({ ...current, reason: event.target.value || null }))} />
          <Button loading={createExceptionMutation.isPending} onClick={() => createExceptionMutation.mutate()}>Tarixi əlavə et</Button>
        </div>
        <div className="exception-list">
          {(exceptionsQuery.data ?? []).length === 0 ? <p>Hələ xüsusi tarix əlavə edilməyib.</p> : (exceptionsQuery.data ?? []).map((item) => (
            <article key={item.id}>
              <div><strong>{new Intl.DateTimeFormat("az-AZ", { dateStyle: "long" }).format(new Date(`${item.date}T12:00:00`))}</strong><p>{exceptionLabel(item.type)}{item.startTime && item.endTime ? ` · ${item.startTime.slice(0, 5)}–${item.endTime.slice(0, 5)}` : ""}{item.reason ? ` · ${item.reason}` : ""}</p></div>
              <StatusBadge tone={item.type === "CLOSED" ? "warning" : "neutral"}>{exceptionLabel(item.type)}</StatusBadge>
              <Button variant="quiet" disabled={deleteExceptionMutation.isPending} onClick={() => deleteExceptionMutation.mutate(item.id)}>Sil</Button>
            </article>
          ))}
        </div>
      </section>

      {setupNavigation ? (
        <div className="room-setup-actions">
          <Button variant="secondary" onClick={setupNavigation.onBack}>Geri</Button>
          <Button
            loading={saveMutation.isPending}
            onClick={() => {
              const hasSavedSchedule = (scheduleQuery.data ?? []).some((rule) => rule.active);
              if (hasUnsavedChanges || !hasSavedSchedule) saveMutation.mutate(true);
              else setupNavigation.onContinue();
            }}
          >Davam et</Button>
        </div>
      ) : null}
    </div>
  );
}

function newInterval(startTime: string, endTime: string): ScheduleInterval {
  intervalSequence += 1;
  return { key: `interval-${intervalSequence}`, startTime, endTime };
}

function emptyWeek(): DaySchedule[] {
  return weekdayOptions.map((option) => ({
    day: option.value,
    enabled: option.value !== "SATURDAY" && option.value !== "SUNDAY",
    intervals: [newInterval("09:00", "18:00")],
  }));
}

function scheduleFromRules(rules: WeeklyAvailabilityRule[]): DaySchedule[] {
  return weekdayOptions.map((option) => {
    const dayRules = rules.filter((rule) => rule.dayOfWeek === option.value && rule.active);
    return {
      day: option.value,
      enabled: dayRules.length > 0,
      intervals: dayRules.length > 0
        ? dayRules.map((rule) => newInterval(rule.startTime.slice(0, 5), rule.endTime.slice(0, 5)))
        : [newInterval("09:00", "18:00")],
    };
  });
}

function replaceInterval(day: DaySchedule, index: number, field: "startTime" | "endTime", value: string): DaySchedule {
  return {
    ...day,
    intervals: day.intervals.map((interval, itemIndex) => itemIndex === index ? { ...interval, [field]: value } : interval),
  };
}

function validateSchedule(days: DaySchedule[]) {
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

function exceptionLabel(type: AvailabilityExceptionType) {
  if (type === "CLOSED") return "Bağlı";
  if (type === "CUSTOM_HOURS") return "Fərqli saatlar";
  return "Bağlı interval";
}
