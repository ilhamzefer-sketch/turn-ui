import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { stepSixApi } from "../../shared/api/stepSixApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { NotificationEvent } from "../../shared/notifications/NotificationProvider";
import { Button } from "../../shared/ui/Button";
import { TextField } from "../../shared/ui/TextField";

export function AdminLoginPage() {
  usePageMeta("Admin girişi — NövbəTime", "NövbəTime platforma idarəetməsi.", { index: false });
  const navigate = useNavigate(); const [username, setUsername] = useState(""); const [password, setPassword] = useState("");
  const login = useMutation({ mutationFn: () => stepSixApi.adminLogin(username, password), onSuccess: () => navigate("/platform", { replace: true }) });
  if (login.isSuccess) return <Navigate to="/platform" replace />;
  return <main className="admin-login shell"><NotificationEvent tone="error" message={login.error?.message ?? null} /><p className="eyebrow">Platform əməliyyatları</p><h1>Admin girişi</h1><p>Bu giriş biznes və müştəri hesablarından ayrıdır.</p><form className="operation-form" onSubmit={(e) => { e.preventDefault(); login.mutate(); }}><TextField label="Admin istifadəçi adı" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} /><TextField label="Şifrə" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /><Button type="submit" loading={login.isPending}>Platformaya daxil ol</Button></form></main>;
}
