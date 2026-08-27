import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import type { ManagedRoom } from "../../../shared/api/contracts";
import { managementApi } from "../../../shared/api/managementApi";
import { NotificationEvent } from "../../../shared/notifications/NotificationProvider";
import { Button } from "../../../shared/ui/Button";
import { SelectField } from "../../../shared/ui/SelectField";
import { TextAreaField } from "../../../shared/ui/TextAreaField";
import { TextField } from "../../../shared/ui/TextField";
import { apiMessage } from "../managementUtils";
import { nullableText } from "../managementLabels";
import { roomErrorNavigation } from "./roomErrorNavigation";
import {
  roomSchema,
  roomTimingSchema,
  type RoomFormValues,
  type RoomTimingFormValues,
} from "../schemas";

export function RoomOverviewSection({ room }: { room: ManagedRoom }) {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const roomForm = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: roomValues(room),
  });
  const configForm = useForm<RoomTimingFormValues>({
    resolver: zodResolver(roomTimingSchema),
    defaultValues: timingValues(room),
  });
  const selectedMode = useWatch({ control: roomForm.control, name: "reservationMode" });

  useEffect(() => {
    roomForm.reset(roomValues(room));
    configForm.reset(timingValues(room));
  }, [configForm, room, roomForm]);

  const roomMutation = useMutation({
    mutationFn: (values: RoomFormValues) => managementApi.updateRoom(room.id, {
      name: values.name,
      roomNumberOrCode: nullableText(values.roomNumberOrCode),
      description: nullableText(values.description),
      notes: nullableText(values.notes),
      timezone: room.timezone,
      reservationMode: values.reservationMode,
      defaultSlotDurationMinutes: Number(values.defaultSlotDurationMinutes),
      visibility: values.visibility,
      personalPublicAddress: room.individualWorkspaceId ? nullableText(values.personalPublicAddress) : null,
      personalLatitude: room.personalLatitude,
      personalLongitude: room.personalLongitude,
    }),
    onSuccess: async () => {
      setSuccessMessage("Otağın əsas məlumatları saxlanıldı.");
      await queryClient.invalidateQueries({ queryKey: ["management-room", room.id] });
    },
  });
  const configurationMutation = useMutation({
    mutationFn: (values: RoomTimingFormValues) => managementApi.updateRoomConfiguration(room.id, {
      defaultSlotDurationMinutes: Number(values.defaultSlotDurationMinutes),
      appointmentBufferMinutes: Number(values.appointmentBufferMinutes),
      bookingWindowDays: Number(values.bookingWindowDays),
      minimumAdvanceMinutes: Number(values.minimumAdvanceMinutes),
      cancellationCutoffMinutes: Number(values.cancellationCutoffMinutes),
      liveQueueResetPolicy: room.reservationMode === "LIVE_QUEUE" ? room.liveQueueResetPolicy : null,
      liveQueueResetLocalTime: room.reservationMode === "LIVE_QUEUE" ? room.liveQueueResetLocalTime : null,
      liveQueueResetIntervalMinutes: room.reservationMode === "LIVE_QUEUE" ? room.liveQueueResetIntervalMinutes : null,
      liveQueueMaxParticipants: room.reservationMode === "LIVE_QUEUE" ? room.liveQueueMaxParticipants : null,
      liveQueueAcceptingNewEntries: room.liveQueueAcceptingNewEntries,
    }),
    onSuccess: async () => {
      setSuccessMessage("Növbə rejiminin ayarları saxlanıldı.");
      await queryClient.invalidateQueries({ queryKey: ["management-room", room.id] });
    },
  });
  const error = roomMutation.error ?? configurationMutation.error;
  const errorAction = error ? roomErrorNavigation(error, {
    roomId: room.id,
    businessId: room.businessId,
    individualWorkspaceId: room.individualWorkspaceId,
    setupMode: false,
  }) : null;

  return (
    <div className="room-section-stack">
      <NotificationEvent tone="success" message={successMessage} />
      <NotificationEvent tone="error" message={error ? apiMessage(error, "Dəyişiklik saxlanılmadı.") : null} action={errorAction} />

      <section className="management-panel" aria-labelledby="room-details-title">
        <div className="section-heading">
          <div><p className="eyebrow">Kimlik və görünürlük</p><h2 id="room-details-title">Əsas məlumatlar</h2></div>
          <p>Rejimi dəyişərkən açıq canlı sessiya və gələcək rezervasiyalar əvvəl həll edilməlidir.</p>
        </div>
        <form className="management-form" onSubmit={roomForm.handleSubmit((values) => { setSuccessMessage(null); roomMutation.mutate(values); })} noValidate>
          <div className="management-form__grid">
            <TextField label="Otaq adı" error={roomForm.formState.errors.name?.message} {...roomForm.register("name")} />
            <TextField label="Otaq nömrəsi və ya kodu" error={roomForm.formState.errors.roomNumberOrCode?.message} {...roomForm.register("roomNumberOrCode")} />
            <SelectField label="İş rejimi" error={roomForm.formState.errors.reservationMode?.message} {...roomForm.register("reservationMode")}>
              <option value="LIVE_QUEUE">Canlı növbə</option>
              <option value="PLANNED_BOOKING">Planlı rezervasiya</option>
            </SelectField>
            <SelectField label="Görünürlük" error={roomForm.formState.errors.visibility?.message} {...roomForm.register("visibility")}>
              <option value="PUBLIC">Açıq axtarışda</option>
              <option value="UNLISTED">Yalnız link və QR ilə</option>
              <option value="PRIVATE">Məxfi</option>
            </SelectField>
            <TextField label="Standart müddət (dəqiqə)" type="number" min="1" max="1440" inputMode="numeric" error={roomForm.formState.errors.defaultSlotDurationMinutes?.message} {...roomForm.register("defaultSlotDurationMinutes")} />
            {room.individualWorkspaceId ? (
              <TextField label="İctimai ünvan (istəyə bağlı)" error={roomForm.formState.errors.personalPublicAddress?.message} {...roomForm.register("personalPublicAddress")} />
            ) : null}
          </div>
          <TextAreaField label="Müştəri üçün açıqlama (istəyə bağlı)" rows={4} error={roomForm.formState.errors.description?.message} {...roomForm.register("description")} />
          <TextAreaField label="Otaq sahibləri üçün daxili qeyd (istəyə bağlı)" rows={3} error={roomForm.formState.errors.notes?.message} {...roomForm.register("notes")} />
          {selectedMode !== room.reservationMode ? <div className="warning-note">Rejim saxlanıldıqdan sonra aşağıdakı ayarlar yeni rejimə uyğun yenilənəcək.</div> : null}
          <div className="management-form__actions"><Button type="submit" loading={roomMutation.isPending}>Əsas məlumatları saxla</Button></div>
        </form>
      </section>

      <section className="management-panel" aria-labelledby="room-config-title">
        <div className="section-heading">
          <div><p className="eyebrow">{room.reservationMode === "LIVE_QUEUE" ? "Ümumi vaxtlar" : "Planlı rezervasiya"}</p><h2 id="room-config-title">Vaxt ayarları</h2></div>
          <p>Canlı növbənin sıfırlanma vaxtı “İş qrafiki” bölməsində idarə olunur.</p>
        </div>
        <form className="management-form" onSubmit={configForm.handleSubmit((values) => { setSuccessMessage(null); configurationMutation.mutate(values); })} noValidate>
          <div className="management-form__grid">
            <TextField label="Standart müddət (dəqiqə)" type="number" min="1" max="1440" error={configForm.formState.errors.defaultSlotDurationMinutes?.message} {...configForm.register("defaultSlotDurationMinutes")} />
            <TextField label="Növbələr arası fasilə (dəqiqə)" type="number" min="0" max="1440" error={configForm.formState.errors.appointmentBufferMinutes?.message} {...configForm.register("appointmentBufferMinutes")} />
            {room.reservationMode === "PLANNED_BOOKING" ? (
              <>
                <TextField label="Rezervasiya pəncərəsi (gün)" type="number" min="1" max="90" error={configForm.formState.errors.bookingWindowDays?.message} {...configForm.register("bookingWindowDays")} />
                <TextField label="Minimum əvvəlcədən vaxt (dəqiqə)" type="number" min="0" max="10080" error={configForm.formState.errors.minimumAdvanceMinutes?.message} {...configForm.register("minimumAdvanceMinutes")} />
                <TextField label="Ləğv üçün son müddət (dəqiqə)" type="number" min="0" error={configForm.formState.errors.cancellationCutoffMinutes?.message} {...configForm.register("cancellationCutoffMinutes")} />
              </>
            ) : null}
          </div>
          <div className="management-form__actions"><Button type="submit" loading={configurationMutation.isPending}>Vaxt ayarlarını saxla</Button></div>
        </form>
      </section>
    </div>
  );
}

function roomValues(room: ManagedRoom): RoomFormValues {
  return {
    name: room.name,
    roomNumberOrCode: room.roomNumberOrCode ?? "",
    description: room.description ?? "",
    notes: room.notes ?? "",
    reservationMode: room.reservationMode,
    defaultSlotDurationMinutes: String(room.defaultSlotDurationMinutes),
    visibility: room.visibility,
    personalPublicAddress: room.personalPublicAddress ?? "",
  };
}

function timingValues(room: ManagedRoom): RoomTimingFormValues {
  return {
    defaultSlotDurationMinutes: String(room.defaultSlotDurationMinutes),
    appointmentBufferMinutes: String(room.appointmentBufferMinutes),
    bookingWindowDays: String(room.bookingWindowDays),
    minimumAdvanceMinutes: String(room.minimumAdvanceMinutes),
    cancellationCutoffMinutes: String(room.cancellationCutoffMinutes),
  };
}
