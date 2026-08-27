import { NavLink, useLocation } from "react-router-dom";

import { useWorkspace } from "../../shared/workspace/useWorkspace";
import { workspaceForPath } from "./workspaceLabels";

type NavigationItem = {
  to: string;
  label: string;
  end?: boolean;
};

function navigationItems(type: "CUSTOMER" | "INDIVIDUAL" | "BUSINESS" | "ROOM", contextId: number): NavigationItem[] {
  if (type === "BUSINESS") {
    const base = `/app/businesses/${contextId}`;
    return [
      { to: base, label: "Ümumi baxış", end: true },
      { to: `${base}/branches`, label: "Filiallar" },
      { to: `${base}/rooms`, label: "Otaqlar" },
      { to: `${base}/team`, label: "Komanda" },
      { to: `${base}/analytics`, label: "Analitika" },
      { to: `${base}/subscription`, label: "Abunəlik" },
      { to: `${base}/governance`, label: "Sahiblik" },
    ];
  }

  if (type === "INDIVIDUAL") {
    return [
      { to: `/app/individual/${contextId}`, label: "Fərdi sahə", end: true },
      { to: `/app/individual/${contextId}/subscription`, label: "Abunəlik" },
    ];
  }

  if (type === "ROOM") {
    return [
      { to: `/app/rooms/${contextId}/today`, label: "Bu gün", end: true },
      { to: `/app/rooms/${contextId}/settings`, label: "Otaq ayarları", end: true },
      { to: `/app/rooms/${contextId}/analytics`, label: "Analitika" },
      { to: `/app/rooms/${contextId}/trust`, label: "Etibar" },
    ];
  }

  return [
    { to: "/app", label: "Hesabım", end: true },
    { to: "/app/bookings", label: "Növbələrim" },
    { to: "/rooms", label: "Otaq tap" },
    { to: "/app/support", label: "Dəstək" },
  ];
}

export function AppNavigation() {
  const { activeWorkspace, workspaces } = useWorkspace();
  const location = useLocation();
  const displayedWorkspace = workspaceForPath(workspaces, location.pathname) ?? activeWorkspace;
  if (!displayedWorkspace) return null;

  return (
    <nav className="app-nav" aria-label="İş sahəsinin bölmələri">
      <p>{displayedWorkspace.name}</p>
      <ul>
        {navigationItems(displayedWorkspace.type, displayedWorkspace.contextId).map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "app-nav__link app-nav__link--active" : "app-nav__link")}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
