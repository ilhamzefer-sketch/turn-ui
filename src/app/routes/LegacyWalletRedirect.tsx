import { Navigate, useLocation } from "react-router-dom";

export function LegacyWalletRedirect() {
  const location = useLocation();
  return <Navigate to={`/app/wallet${location.search}`} replace />;
}
