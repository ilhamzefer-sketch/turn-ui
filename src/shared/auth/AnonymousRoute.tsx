import { Navigate, Outlet } from "react-router-dom";

import { PageLoader } from "../ui/PageLoader";
import { useAuth } from "./useAuth";

export function AnonymousRoute() {
  const { status } = useAuth();

  if (status === "idle" || status === "checking") {
    return <PageLoader label="Hesabınız yoxlanılır" />;
  }
  if (status === "authenticated") {
    return <Navigate to="/app" replace />;
  }
  return <Outlet />;
}
