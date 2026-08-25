import { useState } from "react";
import { Link, Outlet } from "react-router-dom";

import { Brand } from "../../shared/ui/Brand";
import { Button, ButtonLink } from "../../shared/ui/Button";
import { useAuth } from "../../shared/auth/useAuth";

export function PublicLayout() {
  const { status, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isAuthenticated = status === "authenticated";
  const isChecking = status === "idle" || status === "checking";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="site-frame">
      <a className="skip-link" href="#main-content">
        Əsas məzmuna keç
      </a>
      <header className="site-header">
        <div className="shell site-header__inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Əsas naviqasiya">
            <Link to="/rooms">Otaq tap</Link>
            <Link to="/app/bookings">Növbələrim</Link>
            <a href="/#how-it-works">Necə işləyir</a>
            <a href="/#for-business">Biznes üçün</a>
            <a href="/#suitable-businesses">Kimlər üçün</a>
            {isAuthenticated ? <Link to="/app">Hesabım</Link> : null}
            {!isAuthenticated && !isChecking ? <Link to="/login">Daxil ol</Link> : null}
            {isChecking ? <span className="auth-link-placeholder" aria-hidden="true" /> : null}
          </nav>
          <div className="desktop-actions">
            {isAuthenticated ? (
              <Button variant="quiet" loading={isLoggingOut} onClick={() => void handleLogout()}>Çıxış et</Button>
            ) : null}
            {!isAuthenticated && !isChecking ? (
              <ButtonLink to="/register" variant="primary">Pulsuz hesab yarat</ButtonLink>
            ) : null}
            {isChecking ? <span className="auth-button-placeholder" aria-hidden="true" /> : null}
          </div>
          <details className="mobile-menu">
            <summary aria-label="Menyunu aç">
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </summary>
            <nav aria-label="Mobil naviqasiya">
              <Link to="/rooms">Otaq tap</Link>
              <Link to="/app/bookings">Növbələrim</Link>
              <a href="/#how-it-works">Necə işləyir</a>
              <a href="/#for-business">Biznes üçün</a>
              <a href="/#suitable-businesses">Kimlər üçün</a>
              {isAuthenticated ? <Link to="/app">Hesabım</Link> : null}
              {isAuthenticated ? (
                <Button variant="quiet" loading={isLoggingOut} onClick={() => void handleLogout()}>Çıxış et</Button>
              ) : null}
              {!isAuthenticated && !isChecking ? <Link to="/login">Daxil ol</Link> : null}
              {!isAuthenticated && !isChecking ? <ButtonLink to="/register">Pulsuz hesab yarat</ButtonLink> : null}
              {isChecking ? <span className="mobile-auth-status">Hesab yoxlanılır…</span> : null}
            </nav>
          </details>
        </div>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="shell site-footer__inner">
          <Brand />
          <p>Canlı növbə və planlı rezervasiya üçün vahid platforma.</p>
          <p>© 2026 NövbəTime</p>
        </div>
      </footer>
    </div>
  );
}
