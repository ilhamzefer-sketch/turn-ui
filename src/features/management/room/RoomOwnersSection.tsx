import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { BusinessMember, ManagedRoom } from "../../../shared/api/contracts";
import { managementApi } from "../../../shared/api/managementApi";
import { useAuth } from "../../../shared/auth/useAuth";
import { RoomInlineFeedback, type RoomNavigationState } from "./RoomInlineFeedback";
import { Button, ButtonLink } from "../../../shared/ui/Button";
import { SelectField } from "../../../shared/ui/SelectField";
import { PhoneField } from "../../../shared/ui/PhoneField";
import { TextField } from "../../../shared/ui/TextField";
import { useWorkspace } from "../../../shared/workspace/useWorkspace";
import { StatusBadge } from "../ManagementUi";
import { apiMessage } from "../managementUtils";
import { assignmentStatusLabel, nullableText } from "../managementLabels";
import { memberInviteSchema, type MemberInviteFormValues } from "../schemas";

type RoomOwnersSetupNavigation = {
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
};

export function RoomOwnersSection({ room, setupNavigation, onNavigationStateChange }: {
  room: ManagedRoom;
  setupNavigation?: RoomOwnersSetupNavigation;
  onNavigationStateChange?: (state: RoomNavigationState) => void;
}) {
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
  const inviteForm = useForm<MemberInviteFormValues>({
    resolver: zodResolver(memberInviteSchema),
    defaultValues: { phone: "", firstName: "", lastName: "", role: "EMPLOYEE" },
  });
  const assignmentsQuery = useQuery({
    queryKey: ["management-room-assignments", room.id],
    queryFn: () => managementApi.roomAssignments(room.id),
    refetchInterval: (query) => query.state.data?.some((assignment) => assignment.status === "PENDING_ACCEPTANCE") ? 5_000 : false,
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
      void queryClient.invalidateQueries({ queryKey: ["management-room-readiness", room.id] });
    },
  });
  const inviteTeamMutation = useMutation({
    mutationFn: (values: MemberInviteFormValues) => managementApi.inviteMember(room.businessId!, {
      phone: values.phone, firstName: nullableText(values.firstName), lastName: nullableText(values.lastName), role: "EMPLOYEE",
    }),
    onSuccess: (member) => {
      queryClient.setQueryData(["management-members", room.businessId], (current: BusinessMember[] = []) => [member, ...current.filter((item) => item.id !== member.id)]);
      setSelectedUserId(String(member.userId));
      inviteForm.reset();
      setSuccessMessage("Komanda dəvəti yaradıldı və istifadəçi seçildi. İndi otaq sahibi dəvətini göndərin.");
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
      void queryClient.invalidateQueries({ queryKey: ["management-room-readiness", room.id] });
    },
  });

  const busy = assignMutation.isPending || inviteTeamMutation.isPending || revokeMutation.isPending || visibilityMutation.isPending;
  useEffect(() => {
    onNavigationStateChange?.({ busy, dirty: inviteForm.formState.isDirty });
    return () => onNavigationStateChange?.({ busy: false, dirty: false });
  }, [busy, inviteForm.formState.isDirty, onNavigationStateChange]);
  const assignments = useMemo(() => assignmentsQuery.data ?? [], [assignmentsQuery.data]);
  const assignedUserIds = useMemo(
    () => new Set(assignments.filter((assignment) => assignment.status !== "REVOKED" && assignment.status !== "REJECTED").map((assignment) => assignment.userId)),
    [assignments],
  );
  const candidates = (membersQuery.data ?? []).filter(
    (member) => (member.status === "ACTIVE" || member.status === "PENDING_ACCEPTANCE") && !assignedUserIds.has(member.userId),
  );
  const error = assignmentsQuery.error ?? membersQuery.error ?? assignMutation.error ?? inviteTeamMutation.error ?? revokeMutation.error ?? visibilityMutation.error;

  return (
    <div className="room-section-stack">
      <RoomInlineFeedback success={successMessage} error={error ? apiMessage(error, "Otaq sahibi əməliyyatı tamamlanmadı.") : null} />

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
                <option key={member.userId} value={member.userId}>{member.firstName} {member.lastName} · {member.phone}{member.status === "PENDING_ACCEPTANCE" ? " · Əvvəl komanda dəvətini qəbul etməlidir" : ""}</option>
              ))}
            </SelectField>
            <Button disabled={!selectedUserId || busy} loading={assignMutation.isPending} onClick={() => assignMutation.mutate(Number(selectedUserId))}>Otaq sahibi dəvəti göndər</Button>
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
            {assignments.some((assignment) => assignment.status === "PENDING_ACCEPTANCE") ? <p className="info-note" role="status">Dəvət göndərilib. İstifadəçi əvvəl komanda dəvətini, sonra otaq dəvətini qəbul etməlidir. Status avtomatik yenilənir.</p> : null}
            {assignments.filter((assignment) => assignment.status !== "REVOKED" && assignment.status !== "REJECTED").map((assignment) => {
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
                          disabled={busy}
                          onChange={(event) => visibilityMutation.mutate({ assignmentId: assignment.id, show: event.target.checked })}
                        />
                        <span>Telefonumu ictimai göstər</span>
                      </label>
                    ) : null}
                    {!isCurrentUser && canManageAssignments ? (
                      <Button
                        variant="quiet"
                        disabled={busy}
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
          <div><strong>Telefon siyahıda yoxdur?</strong><p>Qurulumdan çıxmadan komanda üzvünü dəvət edin. Ona yalnız işçi rolu verilir; otaq icazəsi ayrıca təsdiqlənir.</p>
            <details><summary>Telefonla komanda üzvü əlavə et</summary>
              <form className="management-form" onSubmit={inviteForm.handleSubmit((values) => inviteTeamMutation.mutate(values))} noValidate>
                <fieldset className="room-owner-invite-fields" disabled={busy}>
                  <legend className="sr-only">Yeni komanda üzvü</legend>
                  <PhoneField label="Telefon nömrəsi" error={inviteForm.formState.errors.phone?.message} {...inviteForm.register("phone")} />
                  <TextField label="Ad (yeni hesab üçün)" error={inviteForm.formState.errors.firstName?.message} {...inviteForm.register("firstName")} />
                  <TextField label="Soyad (yeni hesab üçün)" error={inviteForm.formState.errors.lastName?.message} {...inviteForm.register("lastName")} />
                  <Button type="submit" loading={inviteTeamMutation.isPending}>Komandaya dəvət et</Button>
                </fieldset>
              </form>
            </details>
          </div>
          <ButtonLink variant="secondary" to={`/app/businesses/${room.businessId}/team`}>Komandanı aç</ButtonLink>
        </aside>
      ) : null}

      {setupNavigation ? (
        <div className="room-setup-actions">
          <Button variant="secondary" disabled={busy} onClick={setupNavigation.onBack}>Geri</Button>
          <div>
            {!setupNavigation.canContinue ? <p role="status">Davam etmək üçün ən azı bir aktiv otaq sahibi olmalıdır.</p> : null}
            <Button disabled={!setupNavigation.canContinue || busy} onClick={setupNavigation.onContinue}>Davam et</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
