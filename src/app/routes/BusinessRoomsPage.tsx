import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { EmptyState, ManagementError, ManagementLoading, ManagementPageHeader, StatusBadge } from "../../features/management/ManagementUi";
import { apiMessage } from "../../features/management/managementUtils";
import { reservationModeLabel, roomStatusLabel, visibilityLabel, nullableText } from "../../features/management/managementLabels";
import { roomSchema, type RoomFormValues } from "../../features/management/schemas";
import { RoomSetupProgress } from "../../features/management/room/RoomSetupProgress";
import { managementApi } from "../../shared/api/managementApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { NotificationEvent } from "../../shared/notifications/NotificationProvider";
import { Button, ButtonLink } from "../../shared/ui/Button";
import { SelectField } from "../../shared/ui/SelectField";
import { TextAreaField } from "../../shared/ui/TextAreaField";
import { TextField } from "../../shared/ui/TextField";

const emptyRoom: RoomFormValues = {
  name: "",
  roomNumberOrCode: "",
  description: "",
  notes: "",
  reservationMode: "LIVE_QUEUE",
  defaultSlotDurationMinutes: "20",
  visibility: "UNLISTED",
  personalPublicAddress: "",
};

export function BusinessRoomsPage() {
  const businessId = Number(useParams().businessId);
  usePageMeta("Otaqlar — NövbəTime", "Biznes otaqlarını yaradın və onların növbə rejimini idarə edin.");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [creatorOpen, setCreatorOpen] = useState(false);
  const branchesQuery = useQuery({
    queryKey: ["management-branches", businessId],
    queryFn: () => managementApi.branches(businessId),
    enabled: Number.isInteger(businessId),
  });
  const roomsQuery = useQuery({
    queryKey: ["management-business-rooms", businessId],
    queryFn: () => managementApi.businessRooms(businessId),
    enabled: Number.isInteger(businessId),
  });
  const form = useForm<RoomFormValues & { branchId: string }>({
    resolver: zodResolver(roomSchema.extend({ branchId: z.string().min(1, "Filial seçin.") })),
    defaultValues: { ...emptyRoom, branchId: "" },
  });
  const createMutation = useMutation({
    mutationFn: (values: RoomFormValues & { branchId: string }) => {
      const branch = branchesQuery.data?.find((item) => item.id === Number(values.branchId));
      if (!branch) throw new Error("Filial seçin.");
      return managementApi.createBusinessRoom(branch.id, {
        name: values.name,
        roomNumberOrCode: nullableText(values.roomNumberOrCode),
        description: nullableText(values.description),
        notes: nullableText(values.notes),
        timezone: branch.timezone,
        reservationMode: values.reservationMode,
        defaultSlotDurationMinutes: Number(values.defaultSlotDurationMinutes),
        visibility: values.visibility,
        personalPublicAddress: null,
        personalLatitude: null,
        personalLongitude: null,
      });
    },
    onSuccess: async (room) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["management-business-rooms", businessId] }),
        queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
      ]);
      await navigate(`/app/rooms/${room.id}/settings?step=owners`);
    },
  });

  if (!Number.isInteger(businessId)) return <ManagementError message="Biznes identifikatoru düzgün deyil." />;
  if (branchesQuery.isPending || roomsQuery.isPending) return <ManagementLoading label="Otaqlar açılır…" />;
  if (branchesQuery.isError || roomsQuery.isError) {
    return <ManagementError message={apiMessage(branchesQuery.error ?? roomsQuery.error, "Otaqlar açıla bilmədi.")} />;
  }

  const branches = branchesQuery.data.filter((branch) => branch.status === "ACTIVE");
  const rooms = roomsQuery.data.filter((room) => room.status !== "ARCHIVED");
  const branchName = new Map(branches.map((branch) => [branch.id, branch.name]));

  return (
    <div className="management-page">
      <ManagementPageHeader
        eyebrow="Növbə sahələri"
        title="Otaqlar"
        description="Otaq bir ortaq növbə və qrafikdir. Eyni vaxtda müstəqil qəbul aparan əməkdaşlar üçün ayrıca otaqlar yaradın."
        actions={branches.length > 0 ? <Button onClick={() => setCreatorOpen(true)}>Yeni otaq</Button> : undefined}
      />

      {creatorOpen ? (
        <section className="management-panel management-panel--editor" aria-labelledby="room-create-title">
          <div className="section-heading">
            <div><p className="eyebrow">Qaralama yaradın</p><h2 id="room-create-title">Yeni otaq</h2></div>
            <Button variant="quiet" onClick={() => setCreatorOpen(false)}>Bağla</Button>
          </div>
          <RoomSetupProgress currentStep="basics" />
          <NotificationEvent tone="error" message={createMutation.isError ? apiMessage(createMutation.error, "Otaq yaradıla bilmədi.") : null} />
          <form className="management-form" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))} noValidate>
            <div className="management-form__grid">
              <SelectField label="Filial" error={form.formState.errors.branchId?.message} {...form.register("branchId")}>
                <option value="">Filial seçin</option>
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </SelectField>
              <TextField label="Otaq adı" autoFocus error={form.formState.errors.name?.message} {...form.register("name")} />
              <TextField label="Otaq nömrəsi və ya kodu" error={form.formState.errors.roomNumberOrCode?.message} {...form.register("roomNumberOrCode")} />
              <TextField label="Standart növbə müddəti (dəqiqə)" type="number" min="1" max="1440" inputMode="numeric" error={form.formState.errors.defaultSlotDurationMinutes?.message} {...form.register("defaultSlotDurationMinutes")} />
              <SelectField label="İş rejimi" error={form.formState.errors.reservationMode?.message} {...form.register("reservationMode")}>
                <option value="LIVE_QUEUE">Canlı növbə</option>
                <option value="PLANNED_BOOKING">Planlı rezervasiya</option>
              </SelectField>
              <SelectField label="Görünürlük" hint="Otaq yayımlanana qədər hər halda qaralama qalır." error={form.formState.errors.visibility?.message} {...form.register("visibility")}>
                <option value="UNLISTED">Yalnız link və QR ilə</option>
                <option value="PUBLIC">Açıq axtarışda</option>
                <option value="PRIVATE">Məxfi</option>
              </SelectField>
            </div>
            <TextAreaField label="Müştəri üçün açıqlama (istəyə bağlı)" rows={3} error={form.formState.errors.description?.message} {...form.register("description")} />
            <TextAreaField label="Daxili qeyd (istəyə bağlı)" rows={3} error={form.formState.errors.notes?.message} {...form.register("notes")} />
            <p className="form-note">Otaq əvvəl qaralama kimi yaranır. Otaq sahibi, iş qrafiki və rejim ayarlarını tamamladıqdan sonra ayrıca yayımlayacaqsınız.</p>
            <div className="management-form__actions">
              <Button type="button" variant="secondary" onClick={() => setCreatorOpen(false)}>Ləğv et</Button>
              <Button type="submit" loading={createMutation.isPending}>Davam et</Button>
            </div>
          </form>
        </section>
      ) : null}

      {branches.length === 0 ? (
        <EmptyState
          title="Əvvəl filial yaradın"
          description="Biznes otağı ünvan və əlaqə məlumatlarını filialdan götürür."
          actionLabel="Filial yarat"
          actionTo={`/app/businesses/${businessId}/branches`}
        />
      ) : rooms.length === 0 ? (
        <section className="empty-state">
          <span className="empty-state__mark" aria-hidden="true">02</span>
          <h2>İlk otağınızı yaradın</h2>
          <p>Otağın canlı növbə və ya planlı rezervasiya ilə işləyəcəyini seçin.</p>
          <Button onClick={() => setCreatorOpen(true)}>Otaq yarat</Button>
        </section>
      ) : (
        <section className="room-card-grid" aria-label="Biznes otaqları">
          {rooms.map((room) => (
            <article className="room-management-card" key={room.id}>
              <div className="room-management-card__topline">
                <span>{room.branchId ? branchName.get(room.branchId) ?? "Filial" : "Fərdi sahə"}</span>
                <StatusBadge tone={room.status === "PUBLISHED" ? "success" : room.status === "DRAFT" ? "warning" : "neutral"}>{roomStatusLabel(room.status)}</StatusBadge>
              </div>
              <h2>{room.name}</h2>
              <p>{room.description ?? "Müştəri üçün açıqlama hələ əlavə edilməyib."}</p>
              <dl className="compact-details">
                <div><dt>Rejim</dt><dd>{reservationModeLabel(room.reservationMode)}</dd></div>
                <div><dt>Müddət</dt><dd>{room.defaultSlotDurationMinutes} dəqiqə</dd></div>
                <div><dt>Görünürlük</dt><dd>{visibilityLabel(room.visibility)}</dd></div>
              </dl>
              <ButtonLink to={`/app/rooms/${room.id}`}>{room.status === "DRAFT" ? "Quruluma davam et" : "Otağı idarə et"}</ButtonLink>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
