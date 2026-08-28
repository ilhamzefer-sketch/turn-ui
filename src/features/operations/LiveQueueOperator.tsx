import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import type { LiveQueueEntry, LiveQueueSession } from "../../shared/api/contracts";
import { queueApi } from "../../shared/api/queueApi";
import { NotificationEvent } from "../../shared/notifications/NotificationProvider";
import { Button, ButtonLink } from "../../shared/ui/Button";
import { PhoneField } from "../../shared/ui/PhoneField";
import { SelectField } from "../../shared/ui/SelectField";
import { TextAreaField } from "../../shared/ui/TextAreaField";
import { TextField } from "../../shared/ui/TextField";
import { isLocalPhone, toLocalPhoneInput } from "../../shared/validation/phoneFormat";
import { StatusBadge } from "../management/ManagementUi";
import { apiMessage } from "../management/managementUtils";
import { roomErrorNavigation } from "../management/room/roomErrorNavigation";
import { acceptanceLabel, localDateTimeLabel, queueStatusLabel, sourceLabel } from "./operationFormatters";
import { manualEntrySchema, type ManualEntryFormValues } from "./schemas";

const emptyManual: ManualEntryFormValues = { displayName: "", phone: "", source: "OWNER_WALK_IN", internalNote: "" };
const liveQueueRefreshIntervalMs = 2_000;
const closedLiveQueueRefreshIntervalMs = 60_000;

type LiveQueueOperatorProps = {
  roomId: number;
  businessId?: number | null;
  individualWorkspaceId?: number | null;
  refreshIntervalMs?: number;
};

export function LiveQueueOperator({
  roomId,
  businessId = null,
  individualWorkspaceId = null,
  refreshIntervalMs = liveQueueRefreshIntervalMs,
}: LiveQueueOperatorProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<ManualEntryFormValues>({ resolver: zodResolver(manualEntrySchema), defaultValues: emptyManual });
  const query = useQuery({
    queryKey: ["operator-live-queue", roomId],
    queryFn: () => queueApi.current(roomId),
    retry: false,
    refetchInterval: (liveQueueQuery) => {
      if (liveQueueQuery.state.status === "error") return false;
      const session = liveQueueQuery.state.data;
      return session?.status === "OPEN" && session.acceptingNewEntries
        ? refreshIntervalMs
        : closedLiveQueueRefreshIntervalMs;
    },
    refetchIntervalInBackground: true,
    refetchOnReconnect: "always",
    refetchOnWindowFocus: "always",
  });
  const updateSession = (session: LiveQueueSession, success: string) => {
    queryClient.setQueryData(["operator-live-queue", roomId], session);
    setMessage(success);
  };
  const sessionAction = useMutation({
    mutationFn: (action: "open" | "close" | "automatic" | "reset" | "call" | "complete") => {
      if (action === "open") return queueApi.open(roomId);
      if (action === "close") return queueApi.close(roomId);
      if (action === "automatic") return queueApi.automatic(roomId);
      if (action === "reset") return queueApi.reset(roomId);
      if (action === "call") return queueApi.callNext(roomId);
      return queueApi.completeCurrent(roomId);
    },
    onSuccess: (session, action) => updateSession(session, action === "complete" ? "Cari iştirak tamamlandı və növbə irəlilədi." : action === "call" ? "Növbəti iştirakçı çağırıldı." : "Canlı növbə yeniləndi."),
  });
  const entryAction = useMutation({
    mutationFn: ({ entryId, action }: { entryId: number; action: "skip" | "restore" | "send-to-end" | "remove" }) => queueApi.entryAction(roomId, entryId, action),
    onSuccess: (session) => updateSession(session, "İştirakçının vəziyyəti yeniləndi."),
  });
  const addManual = useMutation({
    mutationFn: (values: ManualEntryFormValues) => queueApi.addManual(roomId, { ...values, internalNote: values.internalNote.trim() || null }),
    onSuccess: async () => { form.reset(emptyManual); setMessage("Manual iştirakçı növbənin sonuna əlavə edildi."); await queryClient.invalidateQueries({ queryKey: ["operator-live-queue", roomId] }); },
  });
  const error = sessionAction.error ?? entryAction.error ?? addManual.error;

  if (query.isPending) return <div className="management-state" role="status">Canlı növbə açılır…</div>;
  if (query.isError || !query.data) {
    const resolvedError = liveQueueOperatorError(query.error);
    const message = resolvedError.message;
    const recoveryAction = roomErrorNavigation(resolvedError, {
      roomId,
      businessId,
      individualWorkspaceId,
      setupMode: false,
    });
    return <><NotificationEvent tone="error" message={message} action={recoveryAction} /><section className="management-state operation-recovery" role="alert"><strong>{recoveryAction ? "Otağın qurulmasını tamamlayın" : "Canlı növbə açıla bilmədi"}</strong><p>{message}</p><div className="operation-recovery__actions">{recoveryAction ? <ButtonLink to={recoveryAction.to}>{recoveryAction.label}</ButtonLink> : null}<Button variant="secondary" onClick={() => query.refetch()}>Yenidən yoxla</Button></div></section></>;
  }

  const session = query.data;
  const current = session.entries.find((entry) => entry.status === "CURRENT");
  const waiting = session.entries.filter((entry) => entry.status === "WAITING");
  const skipped = session.entries.filter((entry) => entry.status === "SKIPPED");
  return <div className="live-operator">
    <p className="live-sync-status"><span aria-hidden="true" />{session.acceptingNewEntries ? "Canlı siyahı avtomatik yenilənir" : "Qəbul bağlıdır · vəziyyət seyrək yenilənir"}</p>
    <NotificationEvent tone="success" message={message} />
    <NotificationEvent tone="error" message={error ? apiMessage(error, "Əməliyyat tamamlanmadı.") : null} />
    <section className="live-control-bar" aria-label="Canlı növbə idarəetməsi"><div><span className={session.acceptingNewEntries ? "is-open" : "is-closed"} aria-hidden="true" /><div><strong>{liveQueueAvailabilityMessage(session)}</strong><p>{acceptanceLabel(session.acceptanceOverride)} · {session.waitingCount} nəfər gözləyir</p>{session.acceptanceOverride === "AUTO" && !session.acceptingNewEntries && session.nextOpeningAt ? <p>Növbəti açılış: {localDateTimeLabel(session.nextOpeningAt)}</p> : null}</div></div><div className="live-control-bar__actions">{session.acceptingNewEntries ? <Button variant="secondary" onClick={() => sessionAction.mutate("close")}>Qəbulu müvəqqəti bağla</Button> : <Button onClick={() => sessionAction.mutate("open")}>İndi qəbul aç</Button>}{session.acceptanceOverride !== "AUTO" ? <Button variant="quiet" onClick={() => sessionAction.mutate("automatic")}>İş qrafikinə qayıt</Button> : null}<Button variant="quiet" onClick={() => { if (window.confirm("Cari sessiya bağlanacaq və aktiv iştirakçılar sıfırlanacaq. Davam edilsin?")) sessionAction.mutate("reset"); }}>Növbəni sıfırla</Button></div></section>
    <section className="current-participant" aria-labelledby="current-participant-title"><div><p className="eyebrow">Hazırda qəbul olunur</p><h2 id="current-participant-title">{current ? current.displayName : "İştirakçı çağırılmayıb"}</h2>{current ? <p>{current.publicReference} · {current.phone}</p> : <p>Gözləyən ilk iştirakçını çağırın.</p>}</div>{current ? <Button loading={sessionAction.isPending} onClick={() => sessionAction.mutate("complete")}>Tamamla və növbətini çağır</Button> : <Button disabled={!waiting.length} loading={sessionAction.isPending} onClick={() => sessionAction.mutate("call")}>Növbəti iştirakçını çağır</Button>}</section>
    <div className="operator-grid">
      <section className="management-panel" aria-labelledby="waiting-title"><div className="management-panel__header"><div><p className="eyebrow">Ardıcıllıq</p><h2 id="waiting-title">Gözləyənlər</h2></div><span>{waiting.length}</span></div>{waiting.length ? <div className="operator-entry-list">{waiting.map((entry) => <QueueEntryRow key={entry.id} entry={entry} busy={entryAction.isPending} onAction={(action) => entryAction.mutate({ entryId: entry.id, action })} onUpdated={() => query.refetch()} roomId={roomId} />)}</div> : <p>Hazırda gözləyən iştirakçı yoxdur.</p>}</section>
      <section className="management-panel manual-entry-panel" aria-labelledby="manual-entry-title"><p className="eyebrow">Otaq sahibi tərəfindən</p><h2 id="manual-entry-title">Manual iştirakçı əlavə et</h2><p>Telefonla əlaqə saxlayan və ya yerində gələn şəxsi hesab yaratmadan əlavə edin.</p><form className="operation-form" onSubmit={form.handleSubmit((values) => addManual.mutate(values))} noValidate><TextField label="Ad və soyad" error={form.formState.errors.displayName?.message} {...form.register("displayName")} /><PhoneField label="Telefon" error={form.formState.errors.phone?.message} {...form.register("phone")} /><SelectField label="Əlaqə mənbəyi" error={form.formState.errors.source?.message} {...form.register("source")}><option value="OWNER_WALK_IN">Yerində müraciət</option><option value="OWNER_PHONE">Telefonla əlaqə</option><option value="OWNER_OTHER">Digər əlaqə</option></SelectField><TextAreaField label="Daxili qeyd (istəyə bağlı)" error={form.formState.errors.internalNote?.message} {...form.register("internalNote")} /><Button type="submit" loading={addManual.isPending}>Növbəyə əlavə et</Button></form></section>
    </div>
    {skipped.length ? <section className="management-panel" aria-labelledby="skipped-title"><div className="management-panel__header"><div><p className="eyebrow">Müvəqqəti kənarda</p><h2 id="skipped-title">Skip edilənlər</h2></div><span>{skipped.length}</span></div><div className="operator-entry-list">{skipped.map((entry) => <QueueEntryRow key={entry.id} entry={entry} busy={entryAction.isPending} onAction={(action) => entryAction.mutate({ entryId: entry.id, action })} onUpdated={() => query.refetch()} roomId={roomId} />)}</div></section> : null}
  </div>;
}

function liveQueueOperatorError(error: Error | null): Error {
  if (!error) return new Error("Canlı növbənin vəziyyəti müəyyən edilə bilmədi.");
  if (error.message.includes("Açıq canlı növbə sessiyası yoxdur")) {
    return new Error("Canlı növbə sessiyası tapılmadı. Sistem onu avtomatik bərpa edə bilmədi. Yenidən yoxlayın.");
  }
  return error;
}

function liveQueueAvailabilityMessage(session: LiveQueueSession): string {
  if (session.acceptingNewEntries) return "Yeni iştirakçılar qəbul olunur";
  if (session.acceptanceOverride === "FORCE_CLOSED") return "Otaq sahibi qəbulu müvəqqəti dayandırıb";
  if (session.acceptanceOverride === "AUTO" && session.nextOpeningAt) return "Hazırda iş qrafiki xaricindəsiniz";
  if (session.acceptanceOverride === "AUTO") return "İş qrafikinə görə qəbul bağlıdır";
  return "Otaq ayarlarında yeni iştirakçı qəbulu dayandırılıb";
}

function QueueEntryRow({ entry, busy, onAction, onUpdated, roomId }: { entry: LiveQueueEntry; busy: boolean; onAction: (action: "skip" | "restore" | "send-to-end" | "remove") => void; onUpdated: () => void; roomId: number }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(entry.displayName);
  const [phone, setPhone] = useState(toLocalPhoneInput(entry.phone));
  const [note, setNote] = useState(entry.internalNote ?? "");
  const update = useMutation({ mutationFn: () => queueApi.updateManual(roomId, entry.id, { displayName: name, phone, internalNote: note.trim() || null }), onSuccess: () => { setEditing(false); onUpdated(); } });
  return <article className="operator-entry"><NotificationEvent tone="error" message={update.error?.message ?? null} /><div className="operator-entry__position">{entry.queuePosition}</div><div className="operator-entry__identity"><div><h3>{entry.displayName}</h3><StatusBadge tone={entry.status === "SKIPPED" ? "warning" : "neutral"}>{queueStatusLabel(entry.status)}</StatusBadge></div><p className="operator-entry__meta"><span>{entry.publicReference}</span><span>{entry.phone}</span><span>{sourceLabel(entry.source)}</span></p>{entry.internalNote ? <small>{entry.internalNote}</small> : null}</div><div className="operator-entry__actions">{entry.status === "SKIPPED" ? <Button variant="secondary" disabled={busy} onClick={() => onAction("restore")}>Bərpa et</Button> : <Button variant="secondary" disabled={busy} onClick={() => onAction("skip")}>Skip et</Button>}<Button variant="quiet" disabled={busy} onClick={() => onAction("send-to-end")}>Sona göndər</Button>{entry.createdByUserId ? <Button variant="quiet" onClick={() => setEditing(!editing)}>Düzəliş et</Button> : null}<Button variant="quiet" disabled={busy} onClick={() => { if (window.confirm(`${entry.displayName} aktiv növbədən çıxarılsın?`)) onAction("remove"); }}>Sil</Button></div>{editing ? <div className="operator-entry__edit"><TextField label="Ad və soyad" value={name} onChange={(event) => setName(event.target.value)} /><PhoneField label="Telefon" value={phone} onChange={(event) => setPhone(event.target.value)} /><TextAreaField label="Daxili qeyd" value={note} onChange={(event) => setNote(event.target.value)} /><Button disabled={!isLocalPhone(phone)} loading={update.isPending} onClick={() => update.mutate()}>Dəyişiklikləri saxla</Button></div> : null}</article>;
}
