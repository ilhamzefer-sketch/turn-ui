import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../shared/auth/useAuth";
import { workspaceTypeLabel } from "../../features/workspaces/workspaceLabels";
import { workspaceHomePath } from "../../features/workspaces/workspaceLabels";
import { ButtonLink } from "../../shared/ui/Button";
import { useWorkspace } from "../../shared/workspace/useWorkspace";
import { workspaceApi } from "../../shared/api/workspaceApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { NotificationEvent } from "../../shared/notifications/NotificationProvider";

export function AppHomePage() {
  usePageMeta("Hesabım — NövbəTime", "Növbələrinizi və iş sahələrinizi idarə edin.", { index: false });

  const { user } = useAuth();
  const { activeWorkspace, workspaces, status } = useWorkspace();
  const invitationsQuery = useQuery({
    queryKey: ["user-invitations", user?.id],
    queryFn: workspaceApi.invitations,
    enabled: Boolean(user),
  });
  const managedWorkspaceCount = workspaces.filter((workspace) => workspace.type !== "CUSTOMER").length;
  const pendingInvitationCount = (invitationsQuery.data?.businessInvitations.length ?? 0)
    + (invitationsQuery.data?.roomInvitations.length ?? 0);

  return (
    <div className="app-home-grid">
      <NotificationEvent
        tone="info"
        title="Gözləyən dəvət"
        message={pendingInvitationCount > 0 ? `${pendingInvitationCount} gözləyən dəvətiniz var.` : null}
        action={pendingInvitationCount > 0 ? { label: "Dəvətlərə bax və cavablandır", to: "/onboarding#pending-invitations" } : undefined}
      />
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <p className="eyebrow">{activeWorkspace ? workspaceTypeLabel(activeWorkspace.type) : "Şəxsi hesab"}</p>
        <h1 id="welcome-title">Xoş gəldiniz, {user?.firstName}.</h1>
        {status === "loading" ? <p role="status">İş sahəniz açılır…</p> : (
          <p>
            {activeWorkspace?.type === "CUSTOMER"
              ? "Otaq tapın, canlı növbəyə qoşulun və planlı rezervasiyalarınızı bir yerdə izləyin."
              : `${activeWorkspace?.name ?? "İş sahəniz"} aktivdir. İdarəetmə funksiyaları seçdiyiniz səlahiyyətlərə uyğun açılacaq.`}
          </p>
        )}
        <div className="welcome-panel__actions">
          {activeWorkspace?.type === "CUSTOMER" ? <ButtonLink to="/rooms">Otaq tap</ButtonLink> : null}
          {activeWorkspace && activeWorkspace.type !== "CUSTOMER" ? (
            <ButtonLink to={workspaceHomePath(activeWorkspace)}>İdarəetməni aç</ButtonLink>
          ) : null}
          <ButtonLink to="/onboarding" variant="secondary">Yeni iş sahəsi əlavə et</ButtonLink>
        </div>
      </section>
      <aside className="account-panel" aria-labelledby="account-panel-title">
        <h2 id="account-panel-title">Hesab məlumatları</h2>
        <dl className="account-summary">
          <div><dt>Telefon</dt><dd>{user?.phone}</dd></div>
          <div><dt>Hesab vəziyyəti</dt><dd>{user?.status === "ACTIVE" ? "Aktiv" : user?.status}</dd></div>
          <div><dt>İdarə olunan iş sahələri</dt><dd>{managedWorkspaceCount}</dd></div>
        </dl>
      </aside>
    </div>
  );
}
