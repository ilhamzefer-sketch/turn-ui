import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { stepSixApi } from "../../shared/api/stepSixApi";
import { Button } from "../../shared/ui/Button";
import { TextField } from "../../shared/ui/TextField";

export function AdminAccountManagement() {
  const admins = useQuery({ queryKey: ["admin-accounts"], queryFn: stepSixApi.adminAccounts });
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const create = useMutation({
    mutationFn: () => stepSixApi.adminCreateAccount(username.trim(), displayName.trim(), password),
    onSuccess: async () => { setUsername(""); setDisplayName(""); setPassword(""); setConfirmation(""); await admins.refetch(); },
  });
  const passwordError = confirmation && password !== confirmation ? "Şifrələr eyni deyil." : undefined;
  const valid = /^[A-Za-z0-9._-]{3,50}$/.test(username.trim()) && displayName.trim().length > 0 && password.length >= 8 && password === confirmation;
  return <section className="insight-panel admin-section" id="admin-accounts"><div className="admin-section__heading"><div><p className="eyebrow">Giriş icazələri</p><h2>Platforma adminləri</h2><p>Hər administrator üçün ayrıca hesab yaradın. Şifrə cavabda və siyahıda heç vaxt göstərilmir.</p></div>{admins.data ? <strong>{admins.data.length} admin</strong> : null}</div>{admins.isPending ? <p role="status">Adminlər açılır…</p> : admins.isError ? <p role="alert">{admins.error.message}</p> : <div className="admin-account-list">{admins.data.map((admin) => <article key={admin.id}><div><strong>{admin.displayName}</strong><span>@{admin.username}</span></div><span>{admin.active ? "Aktiv" : "Deaktiv"}</span></article>)}</div>}<form className="admin-create-form" onSubmit={(event) => { event.preventDefault(); if (valid) create.mutate(); }}><h3>Yeni admin yarat</h3><TextField label="Adminin adı" value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" /><TextField label="İstifadəçi adı" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="off" hint="Yalnız hərf, rəqəm, nöqtə, alt xətt və tire." /><TextField label="Müvəqqəti şifrə" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" hint="Ən azı 8 simvol və geniş istifadə olunan şifrə olmamalıdır." /><TextField label="Şifrəni təkrarla" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" error={passwordError} />{create.error ? <p className="admin-form-message" role="alert">{create.error.message}</p> : null}{create.isSuccess ? <p className="admin-form-message admin-form-message--success" role="status">Yeni admin hesabı yaradıldı.</p> : null}<Button type="submit" loading={create.isPending} disabled={!valid}>Admin hesabı yarat</Button></form></section>;
}
