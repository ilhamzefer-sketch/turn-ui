import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { AdminBusiness } from "../../shared/api/contracts";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { Button } from "../../shared/ui/Button";
import { TextAreaField } from "../../shared/ui/TextAreaField";
import { TextField } from "../../shared/ui/TextField";
import { AdminPagination } from "./AdminPagination";

export function AdminBusinessManagement() {
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const businesses = useQuery({ queryKey: ["admin-businesses", search, page], queryFn: () => stepSixApi.adminBusinesses(search, page) });
  return <section className="insight-panel admin-section" id="admin-businesses"><div className="admin-section__heading"><div><p className="eyebrow">Biznes imkanları</p><h2>Biznes otaq limitləri</h2><p>Yalnız təsdiqlənmiş müraciətlər üzrə mövcud limiti artırın. Dəyişiklik abunə yenilənəndə saxlanılır.</p></div>{businesses.data ? <strong>{businesses.data.totalElements} biznes</strong> : null}</div><form className="admin-search" role="search" onSubmit={(event) => { event.preventDefault(); setSearch(draftSearch.trim()); setPage(0); }}><TextField label="Biznes axtarışı" value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Biznes və ya sahib adı" /><Button type="submit">Axtar</Button></form>{businesses.isPending ? <p role="status">Bizneslər açılır…</p> : businesses.isError ? <p role="alert">{businesses.error.message}</p> : businesses.data.items.length ? <div className="admin-record-list">{businesses.data.items.map((business) => <BusinessCard key={business.id} business={business} />)}</div> : <p>Axtarışa uyğun biznes tapılmadı.</p>}<AdminPagination page={page} totalPages={businesses.data?.totalPages ?? 0} onChange={setPage} /></section>;
}

function BusinessCard({ business }: { business: AdminBusiness }) {
  const queryClient = useQueryClient();
  const [roomLimit, setRoomLimit] = useState(String((business.roomLimit ?? 4) + 1));
  const [reason, setReason] = useState("");
  const update = useMutation({
    mutationFn: () => stepSixApi.adminIncreaseRoomLimit(business.id, Number(roomLimit), reason.trim()),
    onSuccess: async (updated) => { setReason(""); setRoomLimit(String((updated.roomLimit ?? business.roomLimit ?? 4) + 1)); await queryClient.invalidateQueries({ queryKey: ["admin-businesses"] }); },
  });
  const valid = business.roomLimit !== null && Number.isInteger(Number(roomLimit)) && Number(roomLimit) > business.roomLimit && Number(roomLimit) <= 1000 && reason.trim().length >= 3;
  return <article className="admin-record"><div className="admin-record__summary"><div><h3>{business.name}</h3><p>{business.ownerName} · {business.ownerPhone}</p></div><div className="admin-balance"><span>Otaqlar</span><strong>{business.roomCount} / {business.roomLimit ?? "—"}</strong></div></div><dl className="admin-record__meta"><div><dt>Biznes statusu</dt><dd>{business.status}</dd></div><div><dt>Abunəlik</dt><dd>{business.subscriptionStatus ?? "Abunəlik yoxdur"}</dd></div></dl>{business.roomLimit === null ? <p className="admin-form-message" role="status">Bu biznes üçün abunəlik qeydi yaranandan sonra limit dəyişdirilə bilər.</p> : <form className="admin-action-form" onSubmit={(event) => { event.preventDefault(); if (valid) update.mutate(); }}><TextField label="Yeni otaq limiti" type="number" min={business.roomLimit + 1} max="1000" inputMode="numeric" value={roomLimit} onChange={(event) => setRoomLimit(event.target.value)} /><TextAreaField label="Limit artımının səbəbi" value={reason} onChange={(event) => setReason(event.target.value)} />{update.error ? <p className="admin-form-message" role="alert">{update.error.message}</p> : null}{update.isSuccess ? <p className="admin-form-message admin-form-message--success" role="status">Otaq limiti {update.data.roomLimit}-ə qaldırıldı.</p> : null}<Button type="submit" loading={update.isPending} disabled={!valid}>Otaq limitini artır</Button></form>}</article>;
}
