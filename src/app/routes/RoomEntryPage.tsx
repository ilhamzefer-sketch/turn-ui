import { useQuery } from "@tanstack/react-query";
import { Navigate, useParams } from "react-router-dom";

import { ManagementError, ManagementLoading } from "../../features/management/ManagementUi";
import { apiMessage } from "../../features/management/managementUtils";
import { managementApi } from "../../shared/api/managementApi";

export function RoomEntryPage() {
  const roomId = Number(useParams().roomId);
  const roomQuery = useQuery({
    queryKey: ["management-room", roomId],
    queryFn: () => managementApi.room(roomId),
    enabled: Number.isInteger(roomId),
  });

  if (!Number.isInteger(roomId)) return <ManagementError message="Otaq identifikatoru düzgün deyil." />;
  if (roomQuery.isPending) return <ManagementLoading label="Otaq açılır…" />;
  if (roomQuery.isError || !roomQuery.data) {
    return <ManagementError message={apiMessage(roomQuery.error, "Otaq açıla bilmədi.")} />;
  }

  const destination = roomQuery.data.status === "DRAFT"
    ? `/app/rooms/${roomId}/settings`
    : `/app/rooms/${roomId}/today`;
  return <Navigate to={destination} replace />;
}
