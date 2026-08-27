import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import type { ManagedRoom } from "../../../shared/api/contracts";
import { managementApi } from "../../../shared/api/managementApi";
import { useAuth } from "../../../shared/auth/useAuth";
import { Button, ButtonLink } from "../../../shared/ui/Button";
import { SelectField } from "../../../shared/ui/SelectField";
import { useWorkspace } from "../../../shared/workspace/useWorkspace";
import { StatusBadge } from "../ManagementUi";
import { apiMessage } from "../managementUtils";
import { assignmentStatusLabel } from "../managementLabels";

type RoomOwnersSetupNavigation = {
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
};

export function RoomOwnersSection({ room, setupNavigation }: { room: ManagedRoom; setupNavigation?: RoomOwnersSetupNavigation }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { workspaces } = useWorkspace();
  const canManageAssignments = Boolean(room.businessId && workspaces.some(
    (workspace) => workspace.type === "BUSINESS"
      && workspace.contextId === room.businessId
      && (workspace.role === "PRIMARY_OWNER" || workspace.role === "ADMIN"),
  ));
  const [selectedUserId, setSelectedUserId] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const assignmentsQuery = useQuery({
    queryKey: ["management-room-assignments", room.id],
    queryFn: () => managementApi.roomAssignments(room.id),
  });
  const membersQuery = useQuery({
    queryKey: ["management-members", room.businessId],
    queryFn: () => managementApi.members(room.businessId as number),
    enabled: canManageAssignments,
  });
  const assignMutation = useMutation({
    mutationFn: (userId: number) => managementApi.assignRoomOwner(room.id, userId),
    onSuccess: async () => {
      setSelectedUserId("");
      setSuccessMessage("Otaq sahibi dəvəti göndərildi. İcazə istifadəçi qəbul etdikdən sonra aktiv olacaq.");
      await queryClient.invalidateQueries({ queryKey: ["management-room-assignments", room.id] });
    },
  });
  const revokeMutation = useMutation({
    mutationFn: (assignmentId: number) => managementApi.revokeRoomOwner(room.id, assignmentId),
    onSuccess: async () => {
      setSuccessMessage("Otaq sahibi icazəsi ləğv edildi.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["management-room-assignments", room.id] }),
        queryClient.invalidateQueries({ queryKey: ["management-room", room.id] }),
      ]);
    },
  });
  const visibilityMutation = useMutation({
    mutationFn: ({ assignmentId, show }: { assignmentId: number; show: boolean }) =>
      managementApi.updateMyRoomPhoneVisibility(assignmentId, show),
    onSuccess: async () => {
      setSuccessMessage("İctimai telefon seçiminiz yeniləndi.");
      await queryClient.invalidateQueries({ queryKey: ["management-room-assignments", room.id] });
    },
  });

  const assignments = useMemo(() => assignmentsQuery.data ?? [], [assignmentsQuery.data]);
  const assignedUserIds = useMemo(
    () => new Set(assignments.filter((assignment) => assignment.status !== "REVOKED" && assignment.status !== "REJECTED").map((assignment) => assignment.userId)),
    [assignments],
  );
  const candidates = (membersQuery.data ?? []).filter(
    (member) => (member.status === "ACTIVE" || member.status === "PENDING_ACCEPTANCE") && !assignedUserIds.has(member.userId),
  );
  const error = assignmentsQuery.error ?? membersQuery.error ?? assignMutation.error ?? revokeMutation.error ?? visibilityMutation.error;

  return (
    <div className="room-section-stack">
      {successMessage ? <div className="success-alert" role="status">{successMessage}</div> : null}
      {error ? <div className="form-alert" role="alert">{apiMessage(error, "Otaq sahibi əməliyyatı tamamlanmadı.")}</div> : null}

      <section className="management-panel" aria-labelledby="room-owner-title">
        <div className="section-heading">
          <div><p className="eyebrow">Ortaq idarəetmə</p><h2 id="room-owner-title">Otaq sahibləri</h2></div>
          <p>Bütün aktiv otaq sahibləri eyni növbə, qrafik və otaq ayarlarını idarə edir.</p>
        </div>

        {canManageAssignments ? (
          <div className="owner-invite-bar">
            <SelectField label="Komandadan otaq sahibi seçin" value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
              <option value="">İstifadəçi seçin</option>
              {candidates.map((member) => (
                <option key={member.userId} value={member.userId}>{member.firstName} {member.lastName} · {member.phone}</option>
              ))}
            </SelectField>
            <Button disabled={!selectedUserId} loading={assignMutation.isPending} onClick={() => assignMutation.mutate(Number(selectedUserId))}>Otaq sahibi dəvəti göndər</Button>
            {candidates.length === 0 ? <p>Uyğun yeni komanda üzvü yoxdur. Əvvəl biznes komandasına telefonla dəvət göndərin.</p> : null}
          </div>
        ) : (
          <div className="info-note">
            {room.businessId
              ? "Otaq sahibi əlavə etmək və ya başqa otaq sahibinin icazəsini ləğv etmək yalnız biznesin əsas sahibi və administratorları üçündür."
              : "Fərdi otağın əsas sahibi hesab sahibidir. Şəxsi otağa əlavə sahib təyin edilmir."}
          </div>
        )}

        {assignmentsQuery.isPending ? <p role="status">Otaq sahibləri açılır…</p> : (
          <div className="owner-list">
            {assignments.filter((assignment) => assignment.status !== "REVOKED").map((assignment) => {
              const isCurrentUser = assignment.userId === user?.id;
              const isActive = assignment.status === "ACTIVE";
              return (
                <article key={assignment.id}>
                  <div className="owner-avatar" aria-hidden="true">{assignment.firstName.charAt(0)}{assignment.lastName.charAt(0)}</div>
                  <div className="owner-list__identity">
                    <div><h3>{assignment.firstName} {assignment.lastName}</h3><StatusBadge tone={isActive ? "success" : "warning"}>{assignmentStatusLabel(assignment.status)}</StatusBadge></div>
                    <p>{assignment.phone}{isCurrentUser ? " · Siz" : ""}</p>
                  </div>
                  <div className="owner-list__actions">
                    {isCurrentUser && isActive ? (
                      <label className="compact-check">
                        <input
                          type="checkbox"
                          checked={assignment.showPhonePublicly}
                          disabled={visibilityMutation.isPending}
                          onChange={(event) => visibilityMutation.mutate({ assignmentId: assignment.id, show: event.target.checked })}
                        />
                        <span>Telefonumu ictimai göstər</span>
                      </label>
                    ) : null}
                    {!isCurrentUser && canManageAssignments ? (
                      <Button
                        variant="quiet"
                        disabled={revokeMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`${assignment.firstName} ${assignment.lastName} üçün otaq sahibi icazəsi ləğv edilsin? Son aktiv otaq sahibi silinərsə otaq avtomatik dayandırılacaq.`)) revokeMutation.mutate(assignment.id);
                        }}
                      >İcazəni ləğv et</Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {canManageAssignments && room.businessId ? (
        <aside className="room-helper-card">
          <div><strong>Telefon siyahıda yoxdur?</strong><p>Əvvəl istifadəçini biznes komandasına əlavə edin, sonra bu otağa sahib kimi dəvət edin.</p></div>
          <ButtonLink variant="secondary" to={`/app/businesses/${room.businessId}/team`}>Komandanı aç</ButtonLink>
        </aside>
      ) : null}

      {setupNavigation ? (
        <div className="room-setup-actions">
          <Button variant="secondary" onClick={setupNavigation.onBack}>Geri</Button>
          <div>
            {!setupNavigation.canContinue ? <p role="status">Davam etmək üçün ən azı bir aktiv otaq sahibi olmalıdır.</p> : null}
            <Button disabled={!setupNavigation.canContinue} onClick={setupNavigation.onContinue}>Davam et</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
