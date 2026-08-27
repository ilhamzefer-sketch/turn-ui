import { Link, Outlet } from "react-router-dom";

import { Brand } from "../../shared/ui/Brand";
import { Button } from "../../shared/ui/Button";
import { useAuth } from "../../shared/auth/useAuth";
import { AppNavigation } from "../../features/workspaces/AppNavigation";
import { WorkspaceSwitcher } from "../../features/workspaces/WorkspaceSwitcher";
import { useWorkspace } from "../../shared/workspace/useWorkspace";

export function AppLayout() {
  const { logout } = useAuth();
  const { status: workspaceStatus } = useWorkspace();
  const workspaceReady = workspaceStatus === "ready";

  return (
    <div className="app-frame">
      <a className="skip-link" href="#app-content">
        Əsas məzmuna keç
      </a>
      <header className="app-header">
        <div className="shell app-header__inner">
          <Brand />
          <div className="app-header__tools">
            <WorkspaceSwitcher />
            <Link className="app-header__add" to="/onboarding">Yeni iş sahəsi</Link>
            <Link className="app-header__add" to="/app/security">Təhlükəsizlik</Link>
            <Button variant="quiet" onClick={() => void logout()}>Çıxış et</Button>
          </div>
        </div>
      </header>
      <div className="app-shell shell">
        {workspaceReady ? <aside className="app-sidebar"><AppNavigation /></aside> : null}
        <main className="app-content" id="app-content">
          {workspaceReady ? <Outlet /> : workspaceStatus === "error" ? (
            <div className="management-state" role="alert">İş sahələri açıla bilmədi. Səhifəni yeniləyib bir daha yoxlayın.</div>
          ) : (
            <div className="management-state" role="status" aria-live="polite">İş sahəniz hazırlanır…</div>
          )}
        </main>
      </div>
    </div>
  );
}
