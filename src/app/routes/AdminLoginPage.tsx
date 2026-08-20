import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { stepSixApi } from "../../shared/api/stepSixApi";
import { Button } from "../../shared/ui/Button";
import { TextField } from "../../shared/ui/TextField";

export function AdminLoginPage() {
  const navigate = useNavigate(); const [username, setUsername] = useState(""); const [password, setPassword] = useState("");
  const login = useMutation({ mutationFn: () => stepSixApi.adminLogin(username, password), onSuccess: () => navigate("/platform", { replace: true }) });
  if (login.isSuccess) return <Navigate to="/platform" replace />;
  return <main className="admin-login shell"><p className="eyebrow">Platform əməliyyatları</p><h1>Admin girişi</h1><p>Bu giriş biznes və müştəri hesablarından ayrıdır.</p><form className="operation-form" onSubmit={(e) => { e.preventDefault(); login.mutate(); }}><TextField label="Admin istifadəçi adı" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} /><TextField label="Şifrə" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /><Button type="submit" loading={login.isPending}>Platformaya daxil ol</Button>{login.error ? <div className="form-alert" role="alert">{login.error.message}</div> : null}</form></main>;
}
