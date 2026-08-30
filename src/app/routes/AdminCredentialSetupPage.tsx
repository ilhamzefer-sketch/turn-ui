import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { stepSixApi } from "../../shared/api/stepSixApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { NotificationEvent } from "../../shared/notifications/NotificationProvider";
import { Button } from "../../shared/ui/Button";
import { TextField } from "../../shared/ui/TextField";

export function AdminCredentialSetupPage() {
  usePageMeta("İlkin admin təhlükəsizliyi — NövbəTime", "Admin giriş məlumatlarını yeniləyin.", { index: false });
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const usernameError = newUsername.toLowerCase() === "admin"
    ? "Yeni istifadəçi adı standart admin adından fərqli olmalıdır."
    : newUsername.length > 0 && !/^[A-Za-z0-9._-]{3,50}$/.test(newUsername)
      ? "3–50 simvol istifadə edin: hərf, rəqəm, nöqtə, alt xətt və ya tire."
      : undefined;
  const passwordError = newPassword.length > 0 && (newPassword.length < 8 || newPassword.length > 128)
    ? "Yeni şifrə 8–128 simvol olmalıdır."
    : undefined;
  const confirmationError = confirmation.length > 0 && confirmation !== newPassword
    ? "Şifrələr eyni deyil."
    : undefined;
  const valid = currentPassword.length > 0 && !usernameError && newUsername.length >= 3 && !passwordError
    && newPassword.length >= 8 && newPassword === confirmation;
  const change = useMutation({
    mutationFn: () => stepSixApi.adminChangeRequiredCredentials(currentPassword, newUsername.trim(), newPassword),
    onSuccess: () => navigate("/platform", { replace: true }),
  });

  return <main className="admin-login admin-credential-setup shell">
    <NotificationEvent tone="error" message={change.error?.message ?? null} />
    <p className="eyebrow">Məcburi təhlükəsizlik addımı</p>
    <h1>İlkin giriş məlumatlarını dəyişin</h1>
    <p>Panelə davam etmək üçün standart admin istifadəçi adını və müvəqqəti şifrəni öz məlumatlarınızla əvəz edin.</p>
    <div className="admin-credential-setup__notice" role="note">
      <strong>Bu addımı keçmək mümkün deyil.</strong>
      <span>Yeni məlumatlar saxlanıldıqdan sonra ilkin giriş dərhal deaktiv ediləcək.</span>
    </div>
    <form className="operation-form" onSubmit={(event) => { event.preventDefault(); if (valid) change.mutate(); }}>
      <TextField label="Müvəqqəti şifrə" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
      <TextField label="Yeni admin istifadəçi adı" autoComplete="username" value={newUsername} error={usernameError} hint="Standart admin adından fərqli olmalıdır." onChange={(event) => setNewUsername(event.target.value)} />
      <TextField label="Yeni admin şifrəsi" type="password" autoComplete="new-password" value={newPassword} error={passwordError} hint="8–128 simvol" onChange={(event) => setNewPassword(event.target.value)} />
      <TextField label="Yeni şifrəni təkrarla" type="password" autoComplete="new-password" value={confirmation} error={confirmationError} onChange={(event) => setConfirmation(event.target.value)} />
      <Button type="submit" disabled={!valid} loading={change.isPending}>Məlumatları dəyiş və panelə keç</Button>
    </form>
  </main>;
}
