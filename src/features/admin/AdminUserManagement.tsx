import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { FormEvent } from "react";

import type { AdminUser } from "../../shared/api/contracts";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { Button } from "../../shared/ui/Button";
import { TextAreaField } from "../../shared/ui/TextAreaField";
import { TextField } from "../../shared/ui/TextField";
import { AdminPagination } from "./AdminPagination";
import { AdminUserPasswordForm } from "./AdminUserPasswordForm";

export function AdminUserManagement() {
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [page, setPage] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const users = useQuery({ queryKey: ["admin-users", name, phone, page], queryFn: () => stepSixApi.adminUsers(name, phone, page) });
  const selectedUser = users.data?.items.find((user) => user.id === selectedUserId) ?? null;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setName(draftName.trim());
    setPhone(draftPhone.trim());
    setPage(0);
    setSelectedUserId(null);
  }

  return <section className="insight-panel admin-section" id="admin-users">
    <div className="admin-section__heading"><div><p className="eyebrow">İstifadəçi modulu</p><h2>{selectedUser ? "İstifadəçi məlumatları" : "İstifadəçilər"}</h2><p>{selectedUser ? "Balansı və hesab təhlükəsizliyini bu səhifədən idarə edin." : "Ad, soyad və ya telefon nömrəsi ilə axtarın. Ətraflı məlumat üçün istifadəçini seçin."}</p></div>{users.data ? <strong>{users.data.totalElements} hesab</strong> : null}</div>
    {selectedUser ? <UserDetail user={selectedUser} onBack={() => setSelectedUserId(null)} /> : <>
      <form className="admin-search admin-search--users" role="search" onSubmit={submitSearch}>
        <TextField label="Ad və soyad" value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Məsələn, Ceyhun Ceyhunov" />
        <TextField label="Telefon nömrəsi" value={draftPhone} onChange={(event) => setDraftPhone(event.target.value)} placeholder="Məsələn, +994 50 123 45 67" inputMode="tel" />
        <Button type="submit">Axtar</Button>
      </form>
      {users.isPending ? <p role="status">İstifadəçilər açılır…</p> : users.isError ? <p role="alert">{users.error.message}</p> : users.data.items.length ? <div className="admin-user-list" aria-label="İstifadəçi siyahısı">{users.data.items.map((user) => <UserListItem key={user.id} user={user} onSelect={() => setSelectedUserId(user.id)} />)}</div> : <p>Axtarışa uyğun istifadəçi tapılmadı.</p>}
      <AdminPagination page={page} totalPages={users.data?.totalPages ?? 0} onChange={(nextPage) => { setPage(nextPage); setSelectedUserId(null); }} />
    </>}
  </section>;
}

function UserListItem({ user, onSelect }: { user: AdminUser; onSelect: () => void }) {
  return <button type="button" className="admin-user-list__item" onClick={onSelect}>
    <span className="admin-user-list__identity"><strong>{user.firstName} {user.lastName}</strong><span>{user.phone}</span></span>
    <span className="admin-user-list__action" aria-hidden="true">Ətraflı bax <b>→</b></span>
  </button>;
}

function UserDetail({ user, onBack }: { user: AdminUser; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const credit = useMutation({
    mutationFn: () => stepSixApi.adminCreditCoins(user.id, Number(amount), reason.trim(), idempotencyKey()),
    onSuccess: async () => {
      setAmount(""); setReason(""); setConfirming(false);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin-users"] }), queryClient.invalidateQueries({ queryKey: ["admin-overview"] })]);
    },
  });
  const valid = Number.isInteger(Number(amount)) && Number(amount) > 0 && Number(amount) <= 1_000_000 && reason.trim().length >= 3;
  return <div className="admin-user-detail"><div className="admin-user-detail__toolbar"><Button variant="secondary" onClick={onBack}>← İstifadəçi siyahısı</Button><span className="admin-user-detail__id">İstifadəçi #{user.id}</span></div><article className="admin-record"><div className="admin-record__summary"><div><h3>{user.firstName} {user.lastName}</h3><p>{user.phone}</p></div><div className="admin-balance"><span>Coin balansı</span><strong>{user.coinBalance.toLocaleString("az-AZ")}</strong></div></div><dl className="admin-record__meta"><div><dt>Vəziyyət</dt><dd>{user.status === "ACTIVE" ? "Aktiv" : user.status}</dd></div><div><dt>Qeydiyyat</dt><dd>{new Date(user.createdAt).toLocaleDateString("az-AZ")}</dd></div></dl><form className="admin-action-form" onSubmit={(event) => { event.preventDefault(); if (valid) setConfirming(true); }}><TextField label="Əlavə ediləcək coin" type="number" min="1" max="1000000" inputMode="numeric" value={amount} onChange={(event) => { setAmount(event.target.value); setConfirming(false); }} /><TextAreaField label="Əlavə səbəbi" value={reason} onChange={(event) => { setReason(event.target.value); setConfirming(false); }} />{credit.error ? <p className="admin-form-message" role="alert">{credit.error.message}</p> : null}{credit.isSuccess ? <p className="admin-form-message admin-form-message--success" role="status">Coin əlavə edildi. Yeni balans: {credit.data.balanceAfter} coin.</p> : null}{confirming ? <div className="admin-confirm" role="alert"><p><strong>{Number(amount).toLocaleString("az-AZ")} coin</strong> {user.firstName} {user.lastName} hesabına əlavə ediləcək.</p><div><Button loading={credit.isPending} onClick={() => credit.mutate()}>Əlavəni təsdiqlə</Button><Button variant="quiet" onClick={() => setConfirming(false)}>Ləğv et</Button></div></div> : <Button type="submit" disabled={!valid}>Coin əlavə et</Button>}</form><AdminUserPasswordForm user={user} /></article></div>;
}

function idempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
