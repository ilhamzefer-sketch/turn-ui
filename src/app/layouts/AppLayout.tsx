import { Link, Outlet } from "react-router-dom";

import { Brand } from "../../shared/ui/Brand";
import { Button } from "../../shared/ui/Button";
import { useAuth } from "../../shared/auth/useAuth";
import { AppNavigation } from "../../features/workspaces/AppNavigation";
import { WorkspaceSwitcher } from "../../features/workspaces/WorkspaceSwitcher";

export function AppLayout() {
  const { logout } = useAuth();

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
            <Button variant="quiet" onClick={() => void logout()}>Çıxış et</Button>
          </div>
        </div>
      </header>
      <div className="app-shell shell">
        <aside className="app-sidebar">
          <AppNavigation />
        </aside>
        <main className="app-content" id="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
