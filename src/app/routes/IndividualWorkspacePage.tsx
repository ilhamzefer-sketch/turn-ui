import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import { ManagementError, ManagementLoading, ManagementPageHeader, StatusBadge } from "../../features/management/ManagementUi";
import { apiMessage } from "../../features/management/managementUtils";
import { nullableText, reservationModeLabel, roomStatusLabel, visibilityLabel } from "../../features/management/managementLabels";
import { roomSchema, type RoomFormValues } from "../../features/management/schemas";
import { managementApi } from "../../shared/api/managementApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { Button, ButtonLink } from "../../shared/ui/Button";
import { SelectField } from "../../shared/ui/SelectField";
import { TextAreaField } from "../../shared/ui/TextAreaField";
import { TextField } from "../../shared/ui/TextField";
import { useWorkspace } from "../../shared/workspace/useWorkspace";

export function IndividualWorkspacePage() {
  const workspaceId = Number(useParams().workspaceId);
  usePageMeta("Fərdi iş sahəsi — NövbəTime", "Fərdi otağınızı və növbə rejimini idarə edin.");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshWorkspaces } = useWorkspace();
  const workspaceQuery = useQuery({
    queryKey: ["individual-workspace", workspaceId],
    queryFn: () => managementApi.individualWorkspace(workspaceId),
    enabled: Number.isInteger(workspaceId),
  });
  const existingRoomQuery = useQuery({
    queryKey: ["individual-workspace-rooms", workspaceId],
    queryFn: () => managementApi.individualRooms(workspaceId),
    enabled: Number.isInteger(workspaceId),
  });
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: workspaceQuery.data?.name ?? "",
      roomNumberOrCode: "",
      description: "",
      notes: "",
      reservationMode: "PLANNED_BOOKING",
      defaultSlotDurationMinutes: "30",
      visibility: "UNLISTED",
      personalPublicAddress: "",
    },
  });
  const createMutation = useMutation({
    mutationFn: (values: RoomFormValues) => managementApi.createIndividualRoom(workspaceId, {
      name: values.name,
      roomNumberOrCode: nullableText(values.roomNumberOrCode),
      description: nullableText(values.description),
      notes: nullableText(values.notes),
      timezone: workspaceQuery.data?.timezone ?? "Asia/Baku",
      reservationMode: values.reservationMode,
      defaultSlotDurationMinutes: Number(values.defaultSlotDurationMinutes),
      visibility: values.visibility,
      personalPublicAddress: nullableText(values.personalPublicAddress),
      personalLatitude: null,
      personalLongitude: null,
    }),
    onSuccess: async (room) => {
      await Promise.all([refreshWorkspaces(), queryClient.invalidateQueries({ queryKey: ["individual-workspace-rooms", workspaceId] })]);
      await navigate(`/app/rooms/${room.id}`);
    },
  });
  const archiveMutation = useMutation({
    mutationFn: (roomId: number) => managementApi.archiveRoom(roomId),
    onSuccess: async (_, roomId) => {
      queryClient.removeQueries({ queryKey: ["management-room", roomId] });
      await Promise.all([
        refreshWorkspaces(),
        queryClient.invalidateQueries({ queryKey: ["individual-workspace-rooms", workspaceId] }),
      ]);
    },
  });

  useEffect(() => {
    if (workspaceQuery.data && !form.getValues("name")) {
      form.setValue("name", workspaceQuery.data.name);
    }
  }, [form, workspaceQuery.data]);

  if (!Number.isInteger(workspaceId)) return <ManagementError message="İş sahəsi identifikatoru düzgün deyil." />;
  if (workspaceQuery.isPending || existingRoomQuery.isPending) return <ManagementLoading label="Fərdi sahə açılır…" />;
  if (workspaceQuery.isError || existingRoomQuery.isError) {
    return <ManagementError message={apiMessage(workspaceQuery.error ?? existingRoomQuery.error, "Fərdi sahə açıla bilmədi.")} />;
  }

  const existingRoom = existingRoomQuery.data?.[0] ?? null;

  return (
    <div className="management-page">
      <ManagementPageHeader
        eyebrow="Fərdi mütəxəssis"
        title={workspaceQuery.data.name}
        description="Fərdi sahədə bir otaq və bir ortaq qrafik olur. Otağın sahibi avtomatik olaraq siz olursunuz."
        actions={existingRoom ? (
          <>
            <ButtonLink variant="secondary" to={`/app/rooms/${existingRoom.id}`}>Redaktə et</ButtonLink>
            <Button
              variant="danger"
              loading={archiveMutation.isPending}
              onClick={() => {
                if (window.confirm(`${existingRoom.name} otağını silmək istəyirsiniz? Otaq arxivə göndəriləcək, tarixçə saxlanılacaq və sonra yeni otaq yarada biləcəksiniz.`)) {
                  archiveMutation.mutate(existingRoom.id);
                }
              }}
            >Otağı sil</Button>
          </>
        ) : undefined}
      />
      {archiveMutation.isError ? <div className="form-alert" role="alert">{apiMessage(archiveMutation.error, "Otaq silinə bilmədi.")}</div> : null}
      {existingRoom ? (
        <section className="management-panel individual-room-summary" aria-labelledby="individual-room-title">
          <div className="individual-room-summary__content">
            <div className="management-list__title">
              <h2 id="individual-room-title">{existingRoom.name}</h2>
              <StatusBadge tone={existingRoom.status === "PUBLISHED" ? "success" : "warning"}>{roomStatusLabel(existingRoom.status)}</StatusBadge>
            </div>
            <p>{existingRoom.description ?? "Otağın açıqlaması əlavə edilməyib."}</p>
            <dl className="individual-room-summary__details">
              <div><dt>İş rejimi</dt><dd>{reservationModeLabel(existingRoom.reservationMode)}</dd></div>
              <div><dt>Standart müddət</dt><dd>{existingRoom.defaultSlotDurationMinutes} dəqiqə</dd></div>
              <div><dt>Görünürlük</dt><dd>{visibilityLabel(existingRoom.visibility)}</dd></div>
            </dl>
          </div>
          <ButtonLink to={`/app/rooms/${existingRoom.id}/today`}>Otağın idarəetməsini aç</ButtonLink>
        </section>
      ) : (
        <section className="management-panel management-panel--editor" aria-labelledby="individual-room-create-title">
          <div className="section-heading">
            <div><p className="eyebrow">İlk və yeganə otaq</p><h2 id="individual-room-create-title">Otağınızı yaradın</h2></div>
            <p>Sonradan rejim və açıq saatları otaq idarəetməsindən dəyişə bilərsiniz.</p>
          </div>
          {createMutation.isError ? <div className="form-alert" role="alert">{apiMessage(createMutation.error, "Otaq yaradıla bilmədi.")}</div> : null}
          <form className="management-form" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))} noValidate>
            <div className="management-form__grid">
              <TextField label="Otaq və ya mütəxəssis adı" error={form.formState.errors.name?.message} {...form.register("name")} />
              <TextField label="Qeyd/kod (istəyə bağlı)" error={form.formState.errors.roomNumberOrCode?.message} {...form.register("roomNumberOrCode")} />
              <SelectField label="İş rejimi" error={form.formState.errors.reservationMode?.message} {...form.register("reservationMode")}>
                <option value="PLANNED_BOOKING">Planlı rezervasiya</option>
                <option value="LIVE_QUEUE">Canlı növbə</option>
              </SelectField>
              <TextField label="Standart müddət (dəqiqə)" type="number" min="1" max="1440" inputMode="numeric" error={form.formState.errors.defaultSlotDurationMinutes?.message} {...form.register("defaultSlotDurationMinutes")} />
              <SelectField label="Görünürlük" error={form.formState.errors.visibility?.message} {...form.register("visibility")}>
                <option value="UNLISTED">Yalnız link və QR ilə</option>
                <option value="PUBLIC">Açıq axtarışda</option>
                <option value="PRIVATE">Məxfi</option>
              </SelectField>
              <TextField label="İctimai ünvan (istəyə bağlı)" autoComplete="street-address" error={form.formState.errors.personalPublicAddress?.message} {...form.register("personalPublicAddress")} />
            </div>
            <TextAreaField label="Müştəri üçün açıqlama (istəyə bağlı)" rows={3} error={form.formState.errors.description?.message} {...form.register("description")} />
            <TextAreaField label="Şəxsi qeyd (istəyə bağlı)" rows={3} error={form.formState.errors.notes?.message} {...form.register("notes")} />
            <div className="management-form__actions"><Button type="submit" loading={createMutation.isPending}>Otağı yarat və qur</Button></div>
          </form>
        </section>
      )}
    </div>
  );
}
