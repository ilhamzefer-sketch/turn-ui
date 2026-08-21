import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

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
  return <div className="management-page room-today"><ManagementPageHeader eyebrow="Otağın gündəlik işi" title={value.name} description={value.reservationMode === "LIVE_QUEUE" ? "İştirakçıları ardıcıllıqla çağırın və canlı növbəni idarə edin." : "Günün rezervasiyalarını və manual müraciətləri idarə edin."} actions={<><StatusBadge tone={value.status === "PUBLISHED" ? "success" : "warning"}>{reservationModeLabel(value.reservationMode)}</StatusBadge><Link className="button button--secondary" to={`/app/rooms/${value.id}`}>Otaq ayarları</Link></>} />{value.reservationMode === "LIVE_QUEUE" ? <LiveQueueOperator roomId={value.id} /> : <RoomBookingOperator roomId={value.id} timezone={value.timezone} />}</div>;
}
