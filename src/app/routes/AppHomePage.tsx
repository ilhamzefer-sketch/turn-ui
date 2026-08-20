import { useAuth } from "../../shared/auth/useAuth";
import { workspaceTypeLabel } from "../../features/workspaces/workspaceLabels";
import { workspaceHomePath } from "../../features/workspaces/workspaceLabels";
import { ButtonLink } from "../../shared/ui/Button";
import { useWorkspace } from "../../shared/workspace/useWorkspace";

export function AppHomePage() {
  const { user } = useAuth();
  const { activeWorkspace, workspaces, status } = useWorkspace();

  return (
    <div className="app-home-grid">
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
          <div><dt>İş sahələri</dt><dd>{workspaces.length}</dd></div>
        </dl>
      </aside>
    </div>
  );
}
