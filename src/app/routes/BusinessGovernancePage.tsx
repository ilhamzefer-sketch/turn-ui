import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { managementApi } from "../../shared/api/managementApi";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { Button } from "../../shared/ui/Button";
import { SelectField } from "../../shared/ui/SelectField";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { NotificationEvent } from "../../shared/notifications/NotificationProvider";

export function BusinessGovernancePage() {
  const businessId = Number(useParams().businessId);
  const members = useQuery({ queryKey: ["business-members", businessId], queryFn: () => managementApi.members(businessId) });
  const invitations = useQuery({ queryKey: ["ownership-invitations"], queryFn: stepSixApi.transferInvitations });
  const [adminId, setAdminId] = useState("");
  const create = useMutation({ mutationFn: () => stepSixApi.createTransfer(businessId, Number(adminId)), onSuccess: () => setAdminId("") });
  const respond = useMutation({ mutationFn: ({ id, accept }: { id: number; accept: boolean }) => stepSixApi.respondTransfer(id, accept), onSuccess: () => invitations.refetch() });
  usePageMeta("Sahiblik və icazələr — NövbəTime", "Biznesin əsas sahiblik hüququnun auditli ötürülməsi.");
  const admins = members.data?.filter((member) => member.role === "ADMIN" && member.status === "ACTIVE") ?? [];
  return <div className="insight-page"><header className="insight-header"><div><p className="eyebrow">Biznes idarəçiliyi</p><h1>Sahibliyi təhlükəsiz ötürün</h1><p>Ötürmə yalnız seçilən aktiv administrator qəbul etdikdən sonra tamamlanır. Əvvəlki sahib administrator kimi qalır.</p></div></header>
    <NotificationEvent tone="success" message={create.data ? `Ötürmə dəvəti #${create.data.id} göndərildi.` : null} />
    <NotificationEvent tone="error" message={create.error?.message ?? null} />
    <section className="insight-panel"><h2>Yeni əsas sahib seçin</h2><div className="inline-form"><SelectField label="Aktiv administrator" value={adminId} onChange={(e) => setAdminId(e.target.value)}><option value="">Administrator seçin</option>{admins.map((admin) => <option key={admin.userId} value={admin.userId}>{admin.firstName} {admin.lastName} · {admin.phone}</option>)}</SelectField><Button disabled={!adminId} loading={create.isPending} onClick={() => create.mutate()}>Ötürmə dəvəti göndər</Button></div>{!admins.length && !members.isPending ? <p>Ötürmə üçün əvvəlcə aktiv administrator əlavə edin.</p> : null}</section>
    <section className="insight-panel"><h2>Gələn sahiblik dəvətləri</h2>{invitations.data?.filter((item) => item.status === "PENDING_ACCEPTANCE").map((item) => <article className="governance-invite" key={item.id}><div><strong>Biznes #{item.businessId}</strong><span>Dəvət #{item.id}</span></div><div><Button loading={respond.isPending} onClick={() => respond.mutate({ id: item.id, accept: true })}>Qəbul et</Button><Button variant="secondary" onClick={() => respond.mutate({ id: item.id, accept: false })}>Rədd et</Button></div></article>)}{!invitations.data?.some((item) => item.status === "PENDING_ACCEPTANCE") ? <p>Gözləyən sahiblik dəvəti yoxdur.</p> : null}</section>
  </div>;
}
