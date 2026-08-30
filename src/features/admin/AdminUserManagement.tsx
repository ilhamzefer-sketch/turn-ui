import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { AdminUser } from "../../shared/api/contracts";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { Button } from "../../shared/ui/Button";
import { TextAreaField } from "../../shared/ui/TextAreaField";
import { TextField } from "../../shared/ui/TextField";
import { AdminPagination } from "./AdminPagination";
import { AdminUserPasswordForm } from "./AdminUserPasswordForm";

export function AdminUserManagement() {
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const users = useQuery({ queryKey: ["admin-users", search, page], queryFn: () => stepSixApi.adminUsers(search, page) });
  return <section className="insight-panel admin-section" id="admin-users"><div className="admin-section__heading"><div><p className="eyebrow">Balans idarəetməsi</p><h2>İstifadəçilər</h2><p>İstifadəçini telefon və ya ad ilə tapın, sonra səbəb göstərərək coin əlavə edin.</p></div>{users.data ? <strong>{users.data.totalElements} hesab</strong> : null}</div><form className="admin-search" role="search" onSubmit={(event) => { event.preventDefault(); setSearch(draftSearch.trim()); setPage(0); }}><TextField label="İstifadəçi axtarışı" value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Telefon, ad və ya soyad" /><Button type="submit">Axtar</Button></form>{users.isPending ? <p role="status">İstifadəçilər açılır…</p> : users.isError ? <p role="alert">{users.error.message}</p> : users.data.items.length ? <div className="admin-record-list">{users.data.items.map((user) => <UserCard key={user.id} user={user} />)}</div> : <p>Axtarışa uyğun istifadəçi tapılmadı.</p>}<AdminPagination page={page} totalPages={users.data?.totalPages ?? 0} onChange={setPage} /></section>;
}

function UserCard({ user }: { user: AdminUser }) {
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
  return <article className="admin-record"><div className="admin-record__summary"><div><h3>{user.firstName} {user.lastName}</h3><p>{user.phone} · İstifadəçi #{user.id}</p></div><div className="admin-balance"><span>Coin balansı</span><strong>{user.coinBalance.toLocaleString("az-AZ")}</strong></div></div><dl className="admin-record__meta"><div><dt>Status</dt><dd>{user.status === "ACTIVE" ? "Aktiv" : user.status}</dd></div><div><dt>Qeydiyyat</dt><dd>{new Date(user.createdAt).toLocaleDateString("az-AZ")}</dd></div></dl><form className="admin-action-form" onSubmit={(event) => { event.preventDefault(); if (valid) setConfirming(true); }}><TextField label="Əlavə ediləcək coin" type="number" min="1" max="1000000" inputMode="numeric" value={amount} onChange={(event) => { setAmount(event.target.value); setConfirming(false); }} /><TextAreaField label="Əlavə səbəbi" value={reason} onChange={(event) => { setReason(event.target.value); setConfirming(false); }} />{credit.error ? <p className="admin-form-message" role="alert">{credit.error.message}</p> : null}{credit.isSuccess ? <p className="admin-form-message admin-form-message--success" role="status">Coin əlavə edildi. Yeni balans: {credit.data.balanceAfter} coin.</p> : null}{confirming ? <div className="admin-confirm" role="alert"><p><strong>{Number(amount).toLocaleString("az-AZ")} coin</strong> {user.firstName} {user.lastName} hesabına əlavə ediləcək.</p><div><Button loading={credit.isPending} onClick={() => credit.mutate()}>Əlavəni təsdiqlə</Button><Button variant="quiet" onClick={() => setConfirming(false)}>Ləğv et</Button></div></div> : <Button type="submit" disabled={!valid}>Coin əlavə et</Button>}</form><AdminUserPasswordForm user={user} /></article>;
}

function idempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
