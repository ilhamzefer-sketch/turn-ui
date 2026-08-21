import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { guestQueueSchema, type GuestQueueFormValues } from "../../features/operations/schemas";
import { localDateTimeLabel } from "../../features/operations/operationFormatters";
import { queueApi } from "../../shared/api/queueApi";
import { useAuth } from "../../shared/auth/useAuth";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { Button } from "../../shared/ui/Button";
import { TextField } from "../../shared/ui/TextField";

export function RoomLiveQueuePage() {
  const roomId = Number(useParams().roomId);
  const [searchParams] = useSearchParams();
  const qrToken = searchParams.get("qr") ?? "";
  const navigate = useNavigate();
  const { status: authStatus, user, restore } = useAuth();
  const queueQuery = useQuery({
    queryKey: ["public-live-queue", roomId, qrToken],
    queryFn: () => qrToken ? queueApi.publicQr(qrToken) : queueApi.publicRoom(roomId),
    enabled: Number.isInteger(roomId) && roomId > 0,
    refetchInterval: 10_000,
  });
  const form = useForm<GuestQueueFormValues>({ resolver: zodResolver(guestQueueSchema) });

  useEffect(() => {
    if (authStatus === "idle") void restore();
  }, [authStatus, restore]);

  const joined = (reference: string) => navigate(`/queue/${encodeURIComponent(reference)}`);
  const guestJoin = useMutation({
    mutationFn: (values: GuestQueueFormValues) => qrToken
      ? queueApi.joinGuestByQr(qrToken, values)
      : queueApi.joinGuest(roomId, values),
    onSuccess: (result) => joined(result.publicReference),
  });
  const accountJoin = useMutation({
    mutationFn: () => queueApi.joinAccount(roomId),
    onSuccess: (result) => joined(result.publicReference),
  });
  const queue = queueQuery.data;
  usePageMeta(queue ? `${queue.roomName} canlı növbəsi — NövbəTime` : "Canlı növbə — NövbəTime", "Canlı növbənin vəziyyətini görün və qoşulun.");

  if (queueQuery.isPending) return <div className="operation-public-state shell" role="status">Canlı növbə açılır…</div>;
  if (queueQuery.isError || !queue) return <OperationPublicError title="Canlı növbə açılmadı" />;

  const joinError = guestJoin.error ?? accountJoin.error;
  return (
    <main className="operation-public shell">
      <nav className="breadcrumbs" aria-label="Səhifə yolu"><Link to={`/rooms/${roomId}`}>{queue.roomName}</Link><span>/</span><span aria-current="page">Canlı növbə</span></nav>
      <header className="operation-public__hero">
        <div>
          <p className="eyebrow">Canlı növbə</p>
          <h1>{queue.roomName}</h1>
          <p>Vaxt seçmədən növbəyə qoşulun. Sizə yalnız anonim növbə kodunuz göstəriləcək.</p>
        </div>
        <div className={queue.acceptingNewEntries ? "queue-open-state is-open" : "queue-open-state is-closed"}>
          <span aria-hidden="true" />
          <strong>{queue.acceptingNewEntries ? "Qəbul açıqdır" : "Qəbul bağlıdır"}</strong>
        </div>
      </header>

      <section className="queue-public-summary" aria-label="Cari növbə məlumatları">
        <dl>
          <div><dt>Gözləyənlər</dt><dd>{queue.waitingCount}</dd></div>
          <div><dt>Təxmini gözləmə</dt><dd>{queue.approximateWaitingMinutes} dəq.</dd></div>
          <div><dt>Hazırda qəbul olunur</dt><dd>{queue.currentPublicReference ?? "Hələ başlanmayıb"}</dd></div>
        </dl>
        {!queue.acceptingNewEntries && queue.nextOpeningAt ? <p>Növbəti açılış: {localDateTimeLabel(queue.nextOpeningAt)}</p> : null}
      </section>

      <div className="operation-public__grid">
        <section className="join-card" aria-labelledby="join-title">
          <p className="eyebrow">Növbəyə qoşul</p>
          <h2 id="join-title">Əlaqə məlumatınız</h2>
          <p>Ad və nömrə yalnız otağın səlahiyyətli əməkdaşlarına görünür.</p>
          {joinError ? <div className="form-alert" role="alert">{joinError.message}</div> : null}
          {authStatus === "authenticated" && user ? (
            <div className="account-join">
              <div><strong>{user.firstName} {user.lastName}</strong><span>{user.phone}</span></div>
              <Button disabled={!queue.acceptingNewEntries} loading={accountJoin.isPending} onClick={() => accountJoin.mutate()}>Hesabımla növbəyə qoşul</Button>
              <p className="form-note">Başqa nömrə ilə qoşulmaq üçün aşağıdakı qonaq formasından istifadə edin.</p>
            </div>
          ) : null}
          <form className="operation-form" onSubmit={form.handleSubmit((values) => guestJoin.mutate(values))} noValidate>
            <TextField label="Ad və soyad" autoComplete="name" error={form.formState.errors.displayName?.message} {...form.register("displayName")} />
            <TextField label="Telefon nömrəsi" type="tel" inputMode="tel" autoComplete="tel" placeholder="050 123 45 67" error={form.formState.errors.phone?.message} {...form.register("phone")} />
            <Button type="submit" disabled={!queue.acceptingNewEntries} loading={guestJoin.isPending}>Qonaq kimi növbəyə qoşul</Button>
          </form>
        </section>

        <aside className="queue-privacy-card">
          <h2>Növbədə nə görünür?</h2>
          <ul>
            <li>İctimai ekranda yalnız anonim kodlar görünür.</li>
            <li>Status səhifənizdə qabağınızdakı say və təxmini vaxt göstərilir.</li>
            <li>Eyni nömrə ilə təkrar qoşulanda mövcud növbəniz açılır.</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}

function OperationPublicError({ title }: { title: string }) {
  return <main className="operation-public-state shell" role="alert"><p className="eyebrow">Canlı növbə</p><h1>{title}</h1><p>Otaq bağlı, yayımdan çıxarılmış və ya link etibarsız ola bilər.</p><Link className="button button--secondary" to="/rooms">Otaqlara bax</Link></main>;
}
