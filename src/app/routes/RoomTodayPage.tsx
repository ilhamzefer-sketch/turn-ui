import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";

import { LiveQueueOperator } from "../../features/operations/LiveQueueOperator";
import { RoomBookingOperator } from "../../features/operations/RoomBookingOperator";
import { managementApi } from "../../shared/api/managementApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { ManagementError, ManagementLoading, ManagementPageHeader, StatusBadge } from "../../features/management/ManagementUi";
import { reservationModeLabel } from "../../features/management/managementLabels";

export function RoomTodayPage() {
  const roomId = Number(useParams().roomId);
  const room = useQuery({ queryKey: ["management-room", roomId], queryFn: () => managementApi.room(roomId), enabled: Number.isInteger(roomId) });
  usePageMeta(room.data ? `${room.data.name} — bu gün | NövbəTime` : "Bu gün — NövbəTime", "Otağın canlı növbəsini və ya planlı rezervasiyalarını idarə edin.");
  if (room.isPending) return <ManagementLoading label="Bugünkü iş sahəsi açılır…" />;
  if (room.isError || !room.data) return <ManagementError message={room.error?.message ?? "Otaq açıla bilmədi."} />;
  const value = room.data;
  if (value.status !== "PUBLISHED") return <Navigate to={`/app/rooms/${value.id}/settings`} replace />;
  return <div className="management-page room-today"><ManagementPageHeader eyebrow="Otağın gündəlik işi" title={value.name} description={value.reservationMode === "LIVE_QUEUE" ? "İştirakçıları ardıcıllıqla çağırın və canlı növbəni idarə edin." : "Günün rezervasiyalarını və manual müraciətləri idarə edin."} actions={<><StatusBadge tone="success">{reservationModeLabel(value.reservationMode)}</StatusBadge><Link className="button button--secondary" to={`/app/rooms/${value.id}/settings`}>Otaq ayarları</Link></>} />{value.reservationMode === "LIVE_QUEUE" ? <LiveQueueOperator roomId={value.id} businessId={value.businessId} individualWorkspaceId={value.individualWorkspaceId} /> : <RoomBookingOperator roomId={value.id} timezone={value.timezone} />}</div>;
}
