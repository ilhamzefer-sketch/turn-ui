import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "./useAuth";

export function AnonymousRoute() {
  const { status } = useAuth();

  if (status === "authenticated") {
    return <Navigate to="/app" replace />;
  }
  return <Outlet />;
}
