import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { NavLink, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { ManagementError, ManagementLoading, StatusBadge } from "../../features/management/ManagementUi";
import { apiMessage } from "../../features/management/managementUtils";
import { reservationModeLabel, roomStatusLabel, visibilityLabel } from "../../features/management/managementLabels";
import { RoomOverviewSection } from "../../features/management/room/RoomOverviewSection";
import { RoomOwnersSection } from "../../features/management/room/RoomOwnersSection";
import { RoomQrSection } from "../../features/management/room/RoomQrSection";
import { RoomScheduleSection } from "../../features/management/room/RoomScheduleSection";
import { managementApi } from "../../shared/api/managementApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { Button, ButtonLink } from "../../shared/ui/Button";

type RoomSection = "overview" | "owners" | "schedule" | "qr";

function roomSection(value: string | null): RoomSection {
  return value === "owners" || value === "schedule" || value === "qr" ? value : "overview";
}

export function RoomManagementPage() {
  const roomId = Number(useParams().roomId);
  const [searchParams, setSearchParams] = useSearchParams();
  const section = roomSection(searchParams.get("section"));
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const roomQuery = useQuery({
    queryKey: ["management-room", roomId],
    queryFn: () => managementApi.room(roomId),
    enabled: Number.isInteger(roomId),
  });
  const assignmentsQuery = useQuery({
    queryKey: ["management-room-assignments", roomId],
    queryFn: () => managementApi.roomAssignments(roomId),
    enabled: Number.isInteger(roomId),
  });
  const scheduleQuery = useQuery({
    queryKey: ["management-room-schedule", roomId],
    queryFn: () => managementApi.weeklyAvailability(roomId),
    enabled: Number.isInteger(roomId),
  });
  const publishMutation = useMutation({
    mutationFn: () => managementApi.publishRoom(roomId),
    onSuccess: async () => {
      setActionMessage("Otaq yayımlandı və yeni növbələr üçün hazırdır.");
      await queryClient.invalidateQueries({ queryKey: ["management-room", roomId] });
    },
  });
  const deactivateMutation = useMutation({
    mutationFn: () => managementApi.deactivateRoom(roomId),
    onSuccess: async () => {
      setActionMessage("Otaq dayandırıldı. Yeni növbə və rezervasiya qəbul edilmir.");
      await queryClient.invalidateQueries({ queryKey: ["management-room", roomId] });
    },
  });
  const archiveMutation = useMutation({
    mutationFn: () => managementApi.archiveRoom(roomId),
    onSuccess: async () => {
      const room = roomQuery.data;
      queryClient.removeQueries({ queryKey: ["management-room", roomId] });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
        room?.businessId
          ? queryClient.invalidateQueries({ queryKey: ["management-business-rooms", room.businessId] })
          : Promise.resolve(),
        room?.individualWorkspaceId
          ? queryClient.invalidateQueries({ queryKey: ["individual-workspace-rooms", room.individualWorkspaceId] })
          : Promise.resolve(),
      ]);
      if (room?.businessId) {
        await navigate(`/app/businesses/${room.businessId}/rooms`);
      } else if (room?.individualWorkspaceId) {
        await navigate(`/app/individual/${room.individualWorkspaceId}`);
      } else {
        await navigate("/app");
      }
    },
  });

  const title = roomQuery.data ? `${roomQuery.data.name} — NövbəTime` : "Otaq idarəetməsi — NövbəTime";
  usePageMeta(title, "Otaq sahibləri, iş qrafiki, növbə rejimi və QR kodlarını idarə edin.");

  if (!Number.isInteger(roomId)) return <ManagementError message="Otaq identifikatoru düzgün deyil." />;
  if (roomQuery.isPending || assignmentsQuery.isPending || scheduleQuery.isPending) return <ManagementLoading label="Otaq idarəetməsi açılır…" />;
  if (roomQuery.isError || assignmentsQuery.isError || scheduleQuery.isError) {
    return <ManagementError message={apiMessage(roomQuery.error ?? assignmentsQuery.error ?? scheduleQuery.error, "Otaq açıla bilmədi.")} />;
  }

  const room = roomQuery.data;
  const hasOwner = assignmentsQuery.data.some((assignment) => assignment.status === "ACTIVE");
  const hasSchedule = scheduleQuery.data.some((rule) => rule.active);
  const hasModeConfiguration = room.reservationMode === "PLANNED_BOOKING"
    ? room.bookingWindowDays > 0
    : Boolean(room.liveQueueResetPolicy && (room.liveQueueResetLocalTime || room.liveQueueResetIntervalMinutes));
  const readyCount = [Boolean(room.name), hasOwner, hasSchedule, hasModeConfiguration].filter(Boolean).length;
  const actionError = publishMutation.error ?? deactivateMutation.error ?? archiveMutation.error;

  return (
    <div className="management-page room-workspace">
      <header className="room-workspace__header">
        <div>
          <p className="eyebrow">{reservationModeLabel(room.reservationMode)}</p>
          <div className="room-workspace__title">
            <h1>{room.name}</h1>
            <StatusBadge tone={room.status === "PUBLISHED" ? "success" : room.status === "DRAFT" ? "warning" : "neutral"}>{roomStatusLabel(room.status)}</StatusBadge>
          </div>
          <p>{visibilityLabel(room.visibility)} · {room.defaultSlotDurationMinutes} dəqiqəlik standart aralıq</p>
        </div>
        <div className="room-workspace__actions">
          <ButtonLink to={`/app/rooms/${room.id}/today`}>Bu günün işinə qayıt</ButtonLink>
          {room.status === "PUBLISHED" && room.visibility !== "PRIVATE" ? <ButtonLink variant="secondary" to={`/rooms/${room.id}`}>İctimai səhifə</ButtonLink> : null}
          {room.status === "PUBLISHED" ? (
            <Button variant="secondary" loading={deactivateMutation.isPending} onClick={() => deactivateMutation.mutate()}>Qəbulu dayandır</Button>
          ) : room.status !== "ARCHIVED" ? (
            <Button loading={publishMutation.isPending} onClick={() => publishMutation.mutate()}>Otağı yayımla</Button>
          ) : null}
        </div>
      </header>

      {actionMessage ? <div className="success-alert" role="status">{actionMessage}</div> : null}
      {actionError ? <div className="form-alert" role="alert">{apiMessage(actionError, "Otaq əməliyyatı tamamlanmadı.")}</div> : null}

      {room.status !== "PUBLISHED" ? (
        <section className="readiness-strip" aria-label={`Otaq hazırlığı: 4 addımdan ${readyCount} addım tamamlanıb`}>
          <div><span>{readyCount}/4</span><strong>Yayıma hazırlıq</strong></div>
          <ul>
            <li className={room.name ? "is-complete" : ""}>Otaq məlumatları</li>
            <li className={hasOwner ? "is-complete" : ""}>Aktiv otaq sahibi</li>
            <li className={hasSchedule ? "is-complete" : ""}>İş qrafiki</li>
            <li className={hasModeConfiguration ? "is-complete" : ""}>Rejim ayarları</li>
          </ul>
        </section>
      ) : null}

      <nav className="room-tabs" aria-label="Otaq ayarları">
        {[
          ["overview", "Əsas ayarlar"],
          ["owners", "Otaq sahibləri"],
          ["schedule", "İş qrafiki"],
          ["qr", "QR kodlar"],
        ].map(([value, label]) => (
          <NavLink
            key={value}
            to={`?section=${value}`}
            className={section === value ? "room-tabs__link room-tabs__link--active" : "room-tabs__link"}
            onClick={(event) => {
              event.preventDefault();
              setSearchParams({ section: value });
            }}
          >{label}</NavLink>
        ))}
      </nav>

      {section === "overview" ? <RoomOverviewSection room={room} /> : null}
      {section === "owners" ? <RoomOwnersSection room={room} /> : null}
      {section === "schedule" ? <RoomScheduleSection room={room} /> : null}
      {section === "qr" ? <RoomQrSection room={room} /> : null}

      {section === "overview" ? <section className="danger-zone" aria-labelledby="room-danger-title">
        <div><h2 id="room-danger-title">Otağı arxivləşdir</h2><p>Tarixçə və hesabatlar saxlanılır, yeni növbə qəbul edilmir.</p></div>
        <Button
          variant="quiet"
          loading={archiveMutation.isPending}
          onClick={() => {
            if (window.confirm(`${room.name} otağını arxivləşdirmək istəyirsiniz? Bu əməliyyat aktiv açıq növbə olduqda qəbul edilməyəcək.`)) archiveMutation.mutate();
          }}
        >Arxivləşdir</Button>
      </section> : null}
    </div>
  );
}
