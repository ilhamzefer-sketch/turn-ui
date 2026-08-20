import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./useAuth";
import { PageLoader } from "../ui/PageLoader";

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "idle" || status === "checking") {
    return <PageLoader label="Hesabınız yoxlanılır" />;
  }

  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
