import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import type { AdminUser } from "../../shared/api/contracts";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { Button } from "../../shared/ui/Button";
import { TextAreaField } from "../../shared/ui/TextAreaField";
import { TextField } from "../../shared/ui/TextField";

export function AdminUserPasswordForm({ user }: { user: AdminUser }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const passwordError = password.length > 0 && (password.length < 8 || password.length > 128)
    ? "Şifrə 8–128 simvol olmalıdır."
    : undefined;
  const confirmationError = confirmation.length > 0 && password !== confirmation
    ? "Şifrələr eyni deyil."
    : undefined;
  const valid = !passwordError && !confirmationError
    && password.length >= 8 && password.length <= 128
    && password === confirmation && reason.trim().length >= 3;
  const changePassword = useMutation({
    mutationFn: () => stepSixApi.adminChangeUserPassword(user.id, password, reason.trim()),
    onSuccess: () => {
      setPassword("");
      setConfirmation("");
      setReason("");
      setConfirming(false);
    },
  });

  function resetConfirmation() {
    setConfirming(false);
    changePassword.reset();
  }

  return <details className="admin-password-reset">
    <summary>İstifadəçi şifrəsini dəyiş</summary>
    <div className="admin-password-reset__body">
      <p className="admin-password-reset__notice">Köhnə şifrə göstərilmir. Yeni şifrə təhlükəsiz hash kimi saxlanacaq və istifadəçinin bütün açıq sessiyaları bağlanacaq.</p>
      <form className="admin-password-form" onSubmit={(event) => { event.preventDefault(); if (valid) setConfirming(true); }}>
        <TextField label="Yeni istifadəçi şifrəsi" type="password" autoComplete="new-password" value={password} error={passwordError} hint="8–128 simvol" onChange={(event) => { setPassword(event.target.value); resetConfirmation(); }} />
        <TextField label="Yeni şifrəni təkrarla" type="password" autoComplete="new-password" value={confirmation} error={confirmationError} onChange={(event) => { setConfirmation(event.target.value); resetConfirmation(); }} />
        <TextAreaField label="Şifrə dəyişikliyinin səbəbi" value={reason} onChange={(event) => { setReason(event.target.value); resetConfirmation(); }} />
        {changePassword.error ? <p className="admin-form-message" role="alert">{changePassword.error.message}</p> : null}
        {changePassword.isSuccess ? <p className="admin-form-message admin-form-message--success" role="status">Şifrə dəyişdirildi və köhnə sessiyalar bağlandı.</p> : null}
        {confirming ? <div className="admin-confirm" role="alert"><p><strong>{user.firstName} {user.lastName}</strong> üçün şifrə dəyişdiriləcək və bütün açıq sessiyalar bağlanacaq.</p><div><Button loading={changePassword.isPending} onClick={() => changePassword.mutate()}>Şifrə dəyişikliyini təsdiqlə</Button><Button variant="quiet" onClick={() => setConfirming(false)}>Ləğv et</Button></div></div> : <Button type="submit" disabled={!valid}>Şifrəni dəyiş</Button>}
      </form>
    </div>
  </details>;
}
