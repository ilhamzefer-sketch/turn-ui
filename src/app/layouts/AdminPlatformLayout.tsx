import { useMutation, useQuery } from "@tanstack/react-query";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";

import { authApi } from "../../shared/api/authApi";
import { ApiError } from "../../shared/api/httpClient";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { Button } from "../../shared/ui/Button";
import type { AdminPlatformOverview } from "../../shared/api/contracts";

const navigation = [
  { to: "/platform", label: "İcmal", end: true },
  { to: "/platform/users", label: "İstifadəçilər", end: false },
  { to: "/platform/businesses", label: "Bizneslər", end: false },
  { to: "/platform/admins", label: "Adminlər", end: false },
  { to: "/platform/payments", label: "Ödənişlər", end: false },
  { to: "/platform/requests", label: "Müraciətlər", end: false },
  { to: "/platform/support", label: "Yoxlama növbəsi", end: false },
] as const;

export function AdminPlatformLayout() {
  usePageMeta("Platform idarəetməsi — NövbəTime", "NövbəTime platforma əməliyyatları.", { index: false });
  const navigate = useNavigate();
  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: stepSixApi.adminOverview, retry: false });
  const logout = useMutation({ mutationFn: authApi.logout, onSettled: () => navigate("/platform/login", { replace: true }) });

  if (overview.isPending) return <main className="admin-platform shell" role="status">Platform məlumatları açılır…</main>;
  if (overview.error instanceof ApiError && overview.error.status === 428) return <Navigate to="/platform/ilk-giris" replace />;
  if (overview.isError) {
    return (
      <main className="admin-platform shell">
        <h1>Admin sessiyası tələb olunur</h1>
        <p>{overview.error.message}</p>
        <NavLink className="button" to="/platform/login">Admin girişinə keç</NavLink>
      </main>
    );
  }

  return (
    <main className="admin-platform shell">
      <header className="insight-header admin-platform__header">
        <div>
          <p className="eyebrow">Platforma admini</p>
          <h1>Platforma nəzarət mərkəzi</h1>
          <p>Hər modulu ayrıca səhifədə idarə edin və əməliyyatları auditli şəkildə tamamlayın.</p>
        </div>
        <Button variant="secondary" loading={logout.isPending} onClick={() => logout.mutate()}>Admin hesabından çıx</Button>
      </header>
      <nav className="admin-section-nav" aria-label="Admin panel bölmələri">
        {navigation.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end ?? false} className={({ isActive }) => isActive ? "is-active" : undefined}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <Outlet context={overview.data satisfies AdminPlatformOverview} />
    </main>
  );
}
