import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigationType } from "react-router-dom";

import { Brand } from "../../shared/ui/Brand";
import { Button, ButtonLink } from "../../shared/ui/Button";
import { useAuth } from "../../shared/auth/useAuth";
import { useWorkspace } from "../../shared/workspace/useWorkspace";
import { workspaceHomePath } from "../../features/workspaces/workspaceLabels";

export function PublicLayout() {
  const { status, logout } = useAuth();
  const { activeWorkspace, workspaces } = useWorkspace();
  const location = useLocation();
  const navigationType = useNavigationType();
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isAuthenticated = status === "authenticated";
  const isLandingPage = location.pathname === "/";
  const managementWorkspace = activeWorkspace && activeWorkspace.type !== "CUSTOMER"
    ? activeWorkspace
    : workspaces.find((workspace) => workspace.type !== "CUSTOMER");
  const navigationLinks = (
    <>
      <Link to="/rooms">Otaq tap</Link>
      {isAuthenticated ? <>
        <Link to="/app/bookings">Növbələrim</Link>
        {managementWorkspace ? <Link to={workspaceHomePath(managementWorkspace)}>İdarəetmə</Link> : null}
        <Link to="/app">Hesabım</Link>
      </> : <>
        <a href="/#how-it-works">Necə işləyir</a>
        <a href="/#for-business">Biznes üçün</a>
        <a href="/#suitable-businesses">Kimlər üçün</a>
        <Link to="/login">Daxil ol</Link>
      </>}
    </>
  );

  useEffect(() => {
    if (mobileMenuRef.current) mobileMenuRef.current.open = false;
    if (location.hash) {
      const frame = window.requestAnimationFrame(() => {
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "instant", block: "start" });
      });
      return () => window.cancelAnimationFrame(frame);
    }
    if (navigationType !== "POP") window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.key, location.hash, navigationType]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className={`site-frame site-frame--public${isLandingPage ? " site-frame--landing" : ""}`}>
      <a className="skip-link" href="#main-content">
        Əsas məzmuna keç
      </a>
      {isLandingPage && !isAuthenticated ? <div className="site-announcement"><p><strong>Növbəniz telefonunuzda.</strong> Vaxtınız çatanda gəlin.</p><a href="#how-it-works">Necə işləyir <span aria-hidden="true">↗</span></a></div> : null}
      <header className="site-header">
        <div className="shell site-header__inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Əsas naviqasiya">
            {navigationLinks}
          </nav>
          <div className="desktop-actions">
            {isAuthenticated ? (
              <Button variant="quiet" loading={isLoggingOut} onClick={() => void handleLogout()}>Çıxış et</Button>
            ) : null}
            {!isAuthenticated ? (
              <ButtonLink to="/register" variant="primary">Hesab yarat</ButtonLink>
            ) : null}
          </div>
          <details className="mobile-menu" ref={mobileMenuRef}>
            <summary aria-label="Menyunu aç">
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </summary>
            <nav aria-label="Mobil naviqasiya" onClick={(event) => {
              if ((event.target as HTMLElement).closest("a") && mobileMenuRef.current) mobileMenuRef.current.open = false;
            }}>
              {navigationLinks}
              {isAuthenticated ? (
                <Button variant="quiet" loading={isLoggingOut} onClick={() => void handleLogout()}>Çıxış et</Button>
              ) : null}
              {!isAuthenticated ? <ButtonLink to="/register">Hesab yarat</ButtonLink> : null}
            </nav>
          </details>
        </div>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="shell site-footer__inner">
          <div className="site-footer__identity">
            <Brand />
            <p>Növbələriniz qaydasında.<br />Vaxtınız özünüzə qalsın.</p>
          </div>
          <nav className="site-footer__links" aria-label="Alt naviqasiya">
            <div><span>Platforma</span><Link to="/rooms">Otaqları kəşf edin</Link><Link to="/app/bookings">Növbələriniz</Link></div>
            <div><span>NövbəTime</span><a href="/#how-it-works">İş prinsipi</a><a href="/#for-business">Bizneslər üçün</a><a href="/#landing-faq">Suallar və cavablar</a></div>
            <div><span>Xidmət sahələri</span><a href="/#suitable-businesses">Klinika və tibbi qəbul</a><a href="/#suitable-businesses">Gözəllik və şəxsi qulluq</a><a href="/#suitable-businesses">Xidmət mərkəzləri</a><a href="/#suitable-businesses">Fərdi mütəxəssislər</a></div>
          </nav>
          <div className="site-footer__bottom"><p>© 2026 NövbəTime</p><p>Növbə və rezervasiya platforması</p></div>
        </div>
      </footer>
    </div>
  );
}
