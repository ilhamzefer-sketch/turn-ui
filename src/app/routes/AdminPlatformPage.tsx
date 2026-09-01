import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { AdminAccountManagement } from "../../features/admin/AdminAccountManagement";
import { AdminBusinessManagement } from "../../features/admin/AdminBusinessManagement";
import { AdminUserManagement } from "../../features/admin/AdminUserManagement";
import { AdminPaymentQueue } from "../../features/admin/AdminPaymentQueue";
import { AdminUserSupportQueue } from "../../features/admin/AdminUserSupportQueue";
import { authApi } from "../../shared/api/authApi";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { ApiError } from "../../shared/api/httpClient";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { Button } from "../../shared/ui/Button";
import { SelectField } from "../../shared/ui/SelectField";
import { TextAreaField } from "../../shared/ui/TextAreaField";

export function AdminPlatformPage() {
  usePageMeta(
    "Platform idarəetməsi — NövbəTime",
    "NövbəTime platforma əməliyyatları.",
    { index: false },
  );
  const navigate = useNavigate();
  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: stepSixApi.adminOverview,
    retry: false,
  });
  const logout = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => navigate("/platform/login", { replace: true }),
  });
  if (overview.isPending)
    return (
      <main className="admin-platform shell" role="status">
        Platform məlumatları açılır…
      </main>
    );
  if (overview.error instanceof ApiError && overview.error.status === 428)
    return <Navigate to="/platform/ilk-giris" replace />;
  if (overview.isError)
    return (
      <main className="admin-platform shell">
        <h1>Admin sessiyası tələb olunur</h1>
        <p>{overview.error.message}</p>
        <Link className="button" to="/platform/login">
          Admin girişinə keç
        </Link>
      </main>
    );
  const data = overview.data;
  return (
    <main className="admin-platform shell">
      <header className="insight-header admin-platform__header">
        <div>
          <p className="eyebrow">Platform admin</p>
          <h1>Platforma nəzarət mərkəzi</h1>
          <p>
            İstifadəçi balanslarını, biznes limitlərini, administratorları və
            support müraciətlərini auditli şəkildə idarə edin.
          </p>
        </div>
        <Button
          variant="secondary"
          loading={logout.isPending}
          onClick={() => logout.mutate()}
        >
          Admin hesabından çıx
        </Button>
      </header>
      <nav className="admin-section-nav" aria-label="Admin panel bölmələri">
        <a href="#admin-users">İstifadəçilər</a>
        <a href="#admin-businesses">Bizneslər</a>
        <a href="#admin-accounts">Adminlər</a>
        <a href="#admin-payments">Ödənişlər</a>
        <a href="#admin-user-support">Müraciətlər</a>
        <a href="#admin-support">Support</a>
      </nav>
      <section className="metric-grid" aria-label="Platforma göstəriciləri">
        <AdminMetric label="İstifadəçilər" value={data.users} />
        <AdminMetric label="Bizneslər" value={data.businesses} />
        <AdminMetric label="Otaqlar" value={data.rooms} />
        <AdminMetric label="Aktiv abunəlik" value={data.activeSubscriptions} />
      </section>
      <div className="insight-grid">
        <section className="insight-panel">
          <h2>Hesab vəziyyəti</h2>
          <dl className="detail-list">
            <div>
              <dt>Aktiv istifadəçi</dt>
              <dd>{data.activeUsers}</dd>
            </div>
            <div>
              <dt>Dayandırılan</dt>
              <dd>{data.suspendedUsers}</dd>
            </div>
            <div>
              <dt>Güzəşt abunəliyi</dt>
              <dd>{data.graceSubscriptions}</dd>
            </div>
            <div>
              <dt>Dayandırılan abunəlik</dt>
              <dd>{data.suspendedSubscriptions}</dd>
            </div>
          </dl>
        </section>
        <section className="insight-panel">
          <h2>Açıq müraciətlər</h2>
          <dl className="detail-list">
            <div>
              <dt>Sahiblik mübahisəsi</dt>
              <dd>{data.openOwnershipDisputes}</dd>
            </div>
            <div>
              <dt>Telefon dəyişikliyi</dt>
              <dd>{data.openPhoneChanges}</dd>
            </div>
            <div>
              <dt>Hesab silinməsi</dt>
              <dd>{data.openDeletionRequests}</dd>
            </div>
            <div>
              <dt>Tamamlanan ödəniş</dt>
              <dd>{data.completedSubscriptionPayments}</dd>
            </div>
          </dl>
        </section>
      </div>
      <AdminUserManagement />
      <AdminBusinessManagement />
      <AdminAccountManagement />
      {typeof stepSixApi.adminTopUps === "function" ? (
        <AdminPaymentQueue />
      ) : null}
      {typeof stepSixApi.adminSupportRequests === "function" ? (
        <AdminUserSupportQueue />
      ) : null}
      <AdminSupportQueue />
    </main>
  );
}

function AdminMetric({ label, value }: { label: string; value: number }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AdminSupportQueue() {
  const disputes = useQuery({
    queryKey: ["admin-disputes"],
    queryFn: stepSixApi.adminDisputes,
  });
  const phone = useQuery({
    queryKey: ["admin-phone-changes"],
    queryFn: stepSixApi.adminPhoneChanges,
  });
  const deletions = useQuery({
    queryKey: ["admin-deletions"],
    queryFn: stepSixApi.adminDeletions,
  });
  const openDisputes =
    disputes.data?.filter(
      (item) => item.status === "OPEN" || item.status === "IN_REVIEW",
    ) ?? [];
  const openPhone =
    phone.data?.filter(
      (item) => item.status === "OPEN" || item.status === "IN_REVIEW",
    ) ?? [];
  const openDeletions =
    deletions.data?.filter(
      (item) => item.status === "OPEN" || item.status === "IN_REVIEW",
    ) ?? [];
  const loading = disputes.isPending || phone.isPending || deletions.isPending;
  const error = disputes.error ?? phone.error ?? deletions.error;
  return (
    <section className="insight-panel admin-section" id="admin-support">
      <div className="admin-section__heading">
        <div>
          <p className="eyebrow">Manual yoxlama</p>
          <h2>Support növbəsi</h2>
          <p>
            Sahiblik, telefon dəyişikliyi və hesab silinməsi qərarlarını səbəbi
            ilə birlikdə tamamlayın.
          </p>
        </div>
      </div>
      {loading ? (
        <p role="status">Support müraciətləri açılır…</p>
      ) : error ? (
        <p role="alert">{error.message}</p>
      ) : (
        <div className="admin-case-list">
          {openDisputes.map((item) => (
            <DisputeCase
              key={item.id}
              item={item}
              onDone={() => disputes.refetch()}
            />
          ))}
          {openPhone.map((item) => (
            <SimpleCase
              key={`p-${item.id}`}
              title={`Telefon dəyişikliyi #${item.id}`}
              detail={`${item.currentPhone} → ${item.requestedPhone} · ${item.reason}`}
              onResolve={(approve, note) =>
                stepSixApi.resolvePhoneChange(item.id, approve, note)
              }
              onDone={() => phone.refetch()}
            />
          ))}
          {openDeletions.map((item) => (
            <SimpleCase
              key={`d-${item.id}`}
              title={`Hesab silinməsi #${item.id}`}
              detail={`İstifadəçi #${item.userId}`}
              onResolve={(approve, note) =>
                stepSixApi.resolveDeletion(item.id, approve, note)
              }
              onDone={() => deletions.refetch()}
            />
          ))}
          {!openDisputes.length &&
          !openPhone.length &&
          !openDeletions.length ? (
            <p>Açıq support müraciəti yoxdur.</p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function DisputeCase({
  item,
  onDone,
}: {
  item: Awaited<ReturnType<typeof stepSixApi.adminDisputes>>[number];
  onDone: () => void;
}) {
  const [action, setAction] = useState<
    "NO_ACTION" | "SUSPEND" | "RESET_PASSWORD" | "RESTORE_ACCESS"
  >("NO_ACTION");
  const [note, setNote] = useState("");
  const mutation = useMutation({
    mutationFn: () => stepSixApi.resolveDispute(item.id, action, note),
    onSuccess: onDone,
  });
  return (
    <article>
      <h3>Sahiblik mübahisəsi #{item.id}</h3>
      <p>
        {item.disputedPhone} · {item.claimantName} · {item.claimantContactPhone}
      </p>
      <p>{item.description}</p>
      <SelectField
        label="Qərar"
        value={action}
        onChange={(event) => setAction(event.target.value as typeof action)}
      >
        <option value="NO_ACTION">Əməliyyat yoxdur</option>
        <option value="SUSPEND">Hesabı dayandır</option>
        <option value="RESET_PASSWORD">Şifrəni sıfırla</option>
        <option value="RESTORE_ACCESS">Girişi bərpa et</option>
      </SelectField>
      <TextAreaField
        label="Qərarın izahı"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      {mutation.error ? <p role="alert">{mutation.error.message}</p> : null}
      <Button
        disabled={!note.trim()}
        loading={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        Qərarı saxla
      </Button>
    </article>
  );
}

function SimpleCase({
  title,
  detail,
  onResolve,
  onDone,
}: {
  title: string;
  detail: string;
  onResolve: (approve: boolean, note: string) => Promise<unknown>;
  onDone: () => void;
}) {
  const [note, setNote] = useState("");
  const mutation = useMutation({
    mutationFn: (approve: boolean) => onResolve(approve, note),
    onSuccess: onDone,
  });
  return (
    <article>
      <h3>{title}</h3>
      <p>{detail}</p>
      <TextAreaField
        label="Qərarın izahı"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      {mutation.error ? <p role="alert">{mutation.error.message}</p> : null}
      <div>
        <Button
          disabled={!note.trim()}
          loading={mutation.isPending}
          onClick={() => mutation.mutate(true)}
        >
          Təsdiqlə
        </Button>
        <Button
          variant="secondary"
          disabled={!note.trim()}
          onClick={() => mutation.mutate(false)}
        >
          Rədd et
        </Button>
      </div>
    </article>
  );
}
