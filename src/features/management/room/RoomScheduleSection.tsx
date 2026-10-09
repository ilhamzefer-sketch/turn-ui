import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import type {
  AvailabilityExceptionInput,
  AvailabilityExceptionType,
  ManagedRoom,
  Weekday,
} from "../../../shared/api/contracts";
import { managementApi } from "../../../shared/api/managementApi";
import { Button } from "../../../shared/ui/Button";
import { SelectField } from "../../../shared/ui/SelectField";
import { TextField } from "../../../shared/ui/TextField";
import { TimeField } from "../../../shared/ui/TimeField";
import { StatusBadge } from "../ManagementUi";
import { apiMessage } from "../managementUtils";
import { weekdayOptions } from "../managementLabels";
import { liveQueueConfigurationSchema, type LiveQueueConfigurationFormValues } from "../schemas";

import { emptyWeek, liveQueueConfigurationInput, liveQueueValues, newInterval, readScheduleDraft, replaceInterval, scheduleFromRules, scheduleInput, scheduleSignature, validateSchedule, writeScheduleDraft, type DaySchedule } from "./roomScheduleDraft";
import "./RoomScheduleSection.css";

type RoomScheduleSetupNavigation = {
  onBack: () => void;
  onContinue: () => void;
};

export function RoomScheduleSection({ room, setupNavigation, onNavigationStateChange }: {
  room: ManagedRoom;
  setupNavigation?: RoomScheduleSetupNavigation;
  onNavigationStateChange?: (state: { busy: boolean; dirty: boolean }) => void;
}) {
  const queryClient = useQueryClient();
  const [restoredDraft] = useState(() => readScheduleDraft(room.id));
  const liveQueueBaseline = useRef(liveQueueValues(room));
  const liveQueueForm = useForm<LiveQueueConfigurationFormValues>({
    resolver: zodResolver(liveQueueConfigurationSchema),
    defaultValues: restoredDraft?.configuration ?? liveQueueValues(room),
  });
  const selectedResetPolicy = useWatch({ control: liveQueueForm.control, name: "liveQueueResetPolicy" });
  const configurationValues = useWatch({ control: liveQueueForm.control });
  const [scheduleDraft, setScheduleDraft] = useState<DaySchedule[] | null>(() => restoredDraft?.days ?? null);
  const draftRoomVersion = useRef(restoredDraft?.expectedUpdatedAt ?? room.updatedAt ?? null);
  const [editingExceptionId, setEditingExceptionId] = useState<number | null>(null);
  const [discarding, setDiscarding] = useState(false);
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

  useEffect(() => {
    const nextBaseline = liveQueueValues(room);
    // Background room refreshes must not erase edits made in this form.
    if (JSON.stringify(liveQueueForm.getValues()) === JSON.stringify(liveQueueBaseline.current)) {
      liveQueueForm.reset(nextBaseline);
    }
    liveQueueBaseline.current = nextBaseline;
  }, [liveQueueForm, room]);

  useEffect(() => {
    if (scheduleQuery.isPending || scheduleQuery.isError || window.location.hash !== "#live-queue-reset-policy") return;
    const resetPolicyField = document.getElementById("live-queue-reset-policy");
    resetPolicyField?.scrollIntoView({ block: "center" });
    resetPolicyField?.focus();
  }, [room.id, scheduleQuery.isPending, scheduleQuery.isError]);

  const days = scheduleDraft ?? (scheduleQuery.data?.length ? scheduleFromRules(scheduleQuery.data) : emptyWeek());
  const hasUnsavedChanges = scheduleDraft !== null && scheduleSignature(scheduleInput(days)) !== scheduleSignature(scheduleQuery.data ?? []);
  const hasConfigurationChanges = room.reservationMode === "LIVE_QUEUE"
    && (!room.liveQueueResetPolicy
      || (room.liveQueueResetPolicy === "DAILY_AT_TIME" && !room.liveQueueResetLocalTime)
      || (room.liveQueueResetPolicy === "EVERY_INTERVAL" && !room.liveQueueResetIntervalMinutes)
      || JSON.stringify(configurationValues) !== JSON.stringify(liveQueueValues(room)));
  const setDays = (updater: DaySchedule[] | ((current: DaySchedule[]) => DaySchedule[])) => {
    setScheduleDraft((current) => typeof updater === "function" ? updater(current ?? days) : updater);
  };

  useEffect(() => {
    if (!hasUnsavedChanges && !hasConfigurationChanges) draftRoomVersion.current = room.updatedAt ?? null;
    writeScheduleDraft(room.id, {
      days: hasUnsavedChanges ? scheduleDraft : null,
      configuration: hasConfigurationChanges ? liveQueueForm.getValues() : null,
      expectedUpdatedAt: draftRoomVersion.current,
    });
  }, [room.id, room.updatedAt, scheduleDraft, hasUnsavedChanges, hasConfigurationChanges, configurationValues, liveQueueForm]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const validation = validateSchedule(days);
      if (validation) throw new Error(validation);
      return managementApi.saveRoomSetupSchedule(room.id, {
        weeklyAvailability: scheduleInput(days), configuration: null,
        expectedUpdatedAt: draftRoomVersion.current,
      });
    },
    onSuccess: (saved) => {
      setScheduleError(null);
      setSuccessMessage("Həftəlik iş qrafiki saxlanıldı.");
      draftRoomVersion.current = saved.room.updatedAt ?? null;
      queryClient.setQueryData(["management-room-schedule", room.id], saved.weeklyAvailability);
      queryClient.setQueryData(["management-room", room.id], saved.room);
      void queryClient.invalidateQueries({ queryKey: ["management-room-readiness", room.id] });
      setScheduleDraft(null);
    },
    onError: (error) => setScheduleError(apiMessage(error, "İş qrafiki saxlanılmadı.")),
  });
  const configurationMutation = useMutation({
    mutationFn: (values: LiveQueueConfigurationFormValues) => managementApi.saveRoomSetupSchedule(room.id, {
      weeklyAvailability: null, configuration: liveQueueConfigurationInput(room, values),
      expectedUpdatedAt: draftRoomVersion.current,
    }),
    onSuccess: (saved) => {
      const savedRoom = saved.room;
      draftRoomVersion.current = savedRoom.updatedAt ?? null;
      setScheduleError(null);
      setSuccessMessage("Canlı növbənin sıfırlanma ayarları saxlanıldı.");
      liveQueueBaseline.current = liveQueueValues(savedRoom);
      liveQueueForm.reset(liveQueueValues(savedRoom));
      queryClient.setQueryData(["management-room", room.id], savedRoom);
      void queryClient.invalidateQueries({ queryKey: ["management-room-readiness", room.id] });
    },
    onError: (error) => setScheduleError(apiMessage(error, "Canlı növbə ayarları saxlanılmadı.")),
  });
  const continueMutation = useMutation({
    mutationFn: async (values: LiveQueueConfigurationFormValues | null) => {
      const hasSavedSchedule = (scheduleQuery.data ?? []).some((rule) => rule.active);
      if (!hasUnsavedChanges && hasSavedSchedule && !hasConfigurationChanges) return null;
      return managementApi.saveRoomSetupSchedule(room.id, {
        weeklyAvailability: hasUnsavedChanges || !hasSavedSchedule ? scheduleInput(days) : null,
        configuration: values && hasConfigurationChanges ? liveQueueConfigurationInput(room, values) : null,
        expectedUpdatedAt: draftRoomVersion.current,
      });
    },
    onSuccess: (saved) => {
      setScheduleError(null);
      if (saved) {
        draftRoomVersion.current = saved.room.updatedAt ?? null;
        void queryClient.invalidateQueries({ queryKey: ["management-room-readiness", room.id] });
        queryClient.setQueryData(["management-room-schedule", room.id], saved.weeklyAvailability);
        queryClient.setQueryData(["management-room", room.id], saved.room);
        liveQueueBaseline.current = liveQueueValues(saved.room);
        liveQueueForm.reset(liveQueueValues(saved.room));
      }
      setScheduleDraft(null);
      writeScheduleDraft(room.id, { days: null, configuration: null });
      setupNavigation?.onContinue();
    },
    onError: (error) => setScheduleError(apiMessage(error, "Məcburi iş qrafiki ayarları saxlanılmadı. Dəyişiklikləriniz qorunub, yenidən cəhd edə bilərsiniz.")),
  });
  const createExceptionMutation = useMutation({
    mutationFn: () => {
      if (!exception.date) throw new Error("Tarixi seçin.");
      if (exception.type !== "CLOSED" && (!exception.startTime || !exception.endTime || exception.startTime >= exception.endTime)) {
        throw new Error("Xüsusi saat üçün düzgün başlanğıc və bitmə vaxtı seçin.");
      }
      const input = {
        ...exception,
        startTime: exception.type === "CLOSED" ? null : exception.startTime,
        endTime: exception.type === "CLOSED" ? null : exception.endTime,
      };
      return editingExceptionId === null
        ? managementApi.createAvailabilityException(room.id, input)
        : managementApi.updateAvailabilityException(room.id, editingExceptionId, input);
    },
    onSuccess: async () => {
      setException({ date: "", type: "CLOSED", startTime: null, endTime: null, reason: null });
      setEditingExceptionId(null);
      setSuccessMessage("Xüsusi tarix qaydası saxlanıldı.");
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
  const busy = discarding || scheduleQuery.isPending || scheduleQuery.isError
    || saveMutation.isPending || configurationMutation.isPending || continueMutation.isPending
    || createExceptionMutation.isPending || deleteExceptionMutation.isPending;
  const dirty = hasUnsavedChanges || hasConfigurationChanges;
  useEffect(() => {
    onNavigationStateChange?.({ busy, dirty });
  }, [busy, dirty, onNavigationStateChange]);
  useEffect(() => {
    if (!dirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);
  const error = scheduleQuery.error ?? exceptionsQuery.error ?? createExceptionMutation.error ?? deleteExceptionMutation.error;

  const continueSetup = async () => {
    setSuccessMessage(null);
    const validation = validateSchedule(days);
    if (validation) {
      setScheduleError(`Davam etmək üçün iş qrafikini tamamlayın. ${validation}`);
      return;
    }
    if (room.reservationMode === "LIVE_QUEUE") {
      const isValid = await liveQueueForm.trigger(undefined, { shouldFocus: true });
      if (!isValid) {
        setScheduleError("Davam etmək üçün növbənin sıfırlanma qaydasını və uyğun vaxtı doldurun.");
        return;
      }
      continueMutation.mutate(liveQueueForm.getValues());
      return;
    }
    continueMutation.mutate(null);
  };

  const updateDay = (day: Weekday, updater: (current: DaySchedule) => DaySchedule) => {
    setDays((current) => current.map((item) => item.day === day ? updater(item) : item));
    setScheduleError(null);
    setSuccessMessage(null);
  };

  const discardChanges = async () => {
    if (!window.confirm("Saxlanmamış qrafik və növbə ayarları ləğv edilsin? Serverdəki son məlumatlar göstəriləcək.")) return;
    setDiscarding(true);
    try {
      const [savedRoom, savedRules] = await Promise.all([managementApi.room(room.id), managementApi.weeklyAvailability(room.id)]);
      draftRoomVersion.current = savedRoom.updatedAt ?? null;
      liveQueueBaseline.current = liveQueueValues(savedRoom);
      liveQueueForm.reset(liveQueueValues(savedRoom));
      queryClient.setQueryData(["management-room", room.id], savedRoom);
      queryClient.setQueryData(["management-room-schedule", room.id], savedRules);
      setScheduleDraft(null);
      writeScheduleDraft(room.id, { days: null, configuration: null });
      setScheduleError(null);
      setSuccessMessage("Dəyişikliklər ləğv edildi. Serverdəki son məlumatlar göstərilir.");
    } catch (failure) {
      setScheduleError(apiMessage(failure, "Son məlumatlar alınmadı. Dəyişiklikləriniz qorunub."));
    } finally {
      setDiscarding(false);
    }
  };

  return (
    <div className="room-section-stack room-schedule">
      {successMessage ? <p className="room-schedule__feedback" role="status">{successMessage}</p> : null}
      {scheduleError || error ? <p className="room-schedule__feedback room-schedule__feedback--error" role="alert">{scheduleError ?? apiMessage(error, "Qrafik əməliyyatı tamamlanmadı.")}</p> : null}
      {scheduleQuery.isError ? <Button variant="secondary" onClick={() => void scheduleQuery.refetch()}>Qrafiki yenidən yüklə</Button> : null}
      {dirty ? <Button variant="quiet" disabled={busy} onClick={() => void discardChanges()}>Dəyişiklikləri ləğv et</Button> : null}
      <fieldset className="room-schedule__controls" disabled={busy}>
        <legend className="sr-only">Otağın iş qrafiki və ayarları</legend>

      <section className="management-panel" aria-labelledby="weekly-hours-title">
        <div className="section-heading">
          <div><p className="eyebrow">Təkrarlanan həftə</p><h2 id="weekly-hours-title">İş saatları</h2></div>
          <p>Bir gündə birdən çox interval əlavə edərək nahar və digər fasilələri ayıra bilərsiniz.</p>
        </div>
        <div className="schedule-toolbar">
          {hasUnsavedChanges ? <strong role="status">Saxlanmamış dəyişikliklər var</strong> : <span>{scheduleQuery.data?.length ? "Qrafik serverlə eynidir" : "İş günlərini seçin və qrafiki saxlayın"}</span>}
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
          <Button loading={saveMutation.isPending} disabled={!hasUnsavedChanges && Boolean(scheduleQuery.data?.length)} onClick={() => saveMutation.mutate()}>Dəyişiklikləri saxla</Button>
        </div>
        {scheduleQuery.isPending ? <p role="status">İş saatları açılır…</p> : (
          <div className="week-editor">
            {days.map((day) => {
              const option = weekdayOptions.find((item) => item.value === day.day);
              return (
                <fieldset className="day-editor" key={day.day} disabled={busy}>
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
                        <TimeField hint="" label="Başlayır" value={interval.startTime} onChange={(event) => updateDay(day.day, (current) => replaceInterval(current, index, "startTime", event.target.value))} />
                        <span aria-hidden="true">—</span>
                        <TimeField hint="" label="Bitir" value={interval.endTime} onChange={(event) => updateDay(day.day, (current) => replaceInterval(current, index, "endTime", event.target.value))} />
                        {day.intervals.length > 1 ? <Button variant="quiet" onClick={() => updateDay(day.day, (current) => ({ ...current, intervals: current.intervals.filter((_, itemIndex) => itemIndex !== index) }))}>Sil</Button> : null}
                      </div>
                    )) : <p>Bu gün yeni növbə qəbul edilmir.</p>}
                    {day.enabled ? <Button variant="quiet" onClick={() => updateDay(day.day, (current) => ({ ...current, intervals: [...current.intervals, newInterval("", "")] }))} disabled={days.reduce((sum, item) => sum + (item.enabled ? item.intervals.length : 0), 0) >= 56}>+ Interval əlavə et</Button> : null}
                  </div>
                </fieldset>
              );
            })}
          </div>
        )}
        <p className="room-schedule__time-hint">Saatları 24 saat formatında yazın: məsələn, 09:00–18:00. Həftədə ən çox 56 interval əlavə edə bilərsiniz.</p>
      </section>

      {room.reservationMode === "LIVE_QUEUE" ? (
        <section className="management-panel" aria-labelledby="live-queue-schedule-title">
          <div className="section-heading">
            <div><p className="eyebrow">Avtomatik növbə dövrü</p><h2 id="live-queue-schedule-title">Canlı növbənin sıfırlanması</h2></div>
            <p>Gözləyənlər siyahısının nə vaxt yeni dövrə keçəcəyini iş qrafiki ilə birlikdə təyin edin.</p>
          </div>
          <form
            className="management-form"
            onSubmit={liveQueueForm.handleSubmit((values) => {
              setSuccessMessage(null);
              configurationMutation.mutate(values);
            })}
            noValidate
          >
            <div className="management-form__grid">
              <SelectField
                id="live-queue-reset-policy"
                label="Növbənin sıfırlanma qaydası"
                required
                error={liveQueueForm.formState.errors.liveQueueResetPolicy?.message}
                {...liveQueueForm.register("liveQueueResetPolicy")}
              >
                <option value="">Qaydanı seçin</option>
                <option value="DAILY_AT_TIME">Hər gün seçilən saatda</option>
                <option value="EVERY_INTERVAL">Müəyyən intervaldan bir</option>
              </SelectField>
              {selectedResetPolicy === "DAILY_AT_TIME" ? (
                <TimeField
                  label="Gündəlik sıfırlama saatı"
                  required
                  error={liveQueueForm.formState.errors.liveQueueResetLocalTime?.message}
                  {...liveQueueForm.register("liveQueueResetLocalTime")}
                />
              ) : selectedResetPolicy === "EVERY_INTERVAL" ? (
                <TextField
                  label="Sıfırlama intervalı (dəqiqə)"
                  type="number"
                  min="1"
                  max="10080"
                  required
                  error={liveQueueForm.formState.errors.liveQueueResetIntervalMinutes?.message}
                  {...liveQueueForm.register("liveQueueResetIntervalMinutes")}
                />
              ) : null}
              <TextField label="İştirakçı limiti (boş = limitsiz)" type="number" min="1" error={liveQueueForm.formState.errors.liveQueueMaxParticipants?.message} {...liveQueueForm.register("liveQueueMaxParticipants")} />
            </div>
            <label className="switch-field">
              <input type="checkbox" {...liveQueueForm.register("liveQueueAcceptingNewEntries")} />
              <span><strong>Yeni iştirakçıları qəbul et</strong><small>Otaq sahibi lazım olduqda canlı növbəyə qoşulmanı dayandıra bilər.</small></span>
            </label>
            <div className="warning-note"><strong>Sıfırlama zamanı:</strong> aktiv gözləyənlər cari növbədən çıxarılır, köhnə sessiya isə tarixçədə saxlanılır.</div>
            <div className="management-form__actions"><Button type="submit" disabled={!hasConfigurationChanges} loading={configurationMutation.isPending}>Sıfırlama ayarlarını saxla</Button></div>
          </form>
        </section>
      ) : null}

      <details className="management-panel room-schedule__exceptions">
        <summary><strong>Xüsusi tarixlər</strong><span>Tətil və fərqli saatlar · istəyə bağlı</span></summary>
        <section aria-labelledby="exceptions-title">
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
          <Button loading={createExceptionMutation.isPending} onClick={() => createExceptionMutation.mutate()}>{editingExceptionId === null ? "Tarixi əlavə et" : "Tarixi yadda saxla"}</Button>
          {editingExceptionId !== null ? <Button variant="secondary" onClick={() => { setEditingExceptionId(null); setException({ date: "", type: "CLOSED", startTime: null, endTime: null, reason: null }); }}>Ləğv et</Button> : null}
        </div>
        <div className="exception-list">
          {(exceptionsQuery.data ?? []).length === 0 ? <p>Hələ xüsusi tarix əlavə edilməyib.</p> : (exceptionsQuery.data ?? []).map((item) => (
            <article key={item.id}>
              <div><strong>{new Intl.DateTimeFormat("az-AZ", { dateStyle: "long" }).format(new Date(`${item.date}T12:00:00`))}</strong><p>{exceptionLabel(item.type)}{item.startTime && item.endTime ? ` · ${item.startTime.slice(0, 5)}–${item.endTime.slice(0, 5)}` : ""}{item.reason ? ` · ${item.reason}` : ""}</p></div>
              <StatusBadge tone={item.type === "CLOSED" ? "warning" : "neutral"}>{exceptionLabel(item.type)}</StatusBadge>
              <Button variant="quiet" onClick={() => { setEditingExceptionId(item.id); setException({ date: item.date, type: item.type, startTime: item.startTime?.slice(0, 5) ?? null, endTime: item.endTime?.slice(0, 5) ?? null, reason: item.reason }); }}>Düzəliş et</Button>
              <Button variant="quiet" disabled={deleteExceptionMutation.isPending} onClick={() => deleteExceptionMutation.mutate(item.id)}>Sil</Button>
            </article>
          ))}
        </div>
        </section>
      </details>
      </fieldset>

      {setupNavigation ? (
        <div className="room-setup-actions">
          <Button variant="secondary" disabled={busy} onClick={setupNavigation.onBack}>Geri</Button>
          <Button
            loading={continueMutation.isPending}
            disabled={busy || scheduleQuery.isPending}
            onClick={() => void continueSetup()}
          >{dirty ? "Saxla və davam et" : "Davam et"}</Button>
        </div>
      ) : null}
    </div>
  );
}

function exceptionLabel(type: AvailabilityExceptionType) {
  if (type === "CLOSED") return "Bağlı";
  if (type === "CUSTOM_HOURS") return "Fərqli saatlar";
  return "Bağlı interval";
}
