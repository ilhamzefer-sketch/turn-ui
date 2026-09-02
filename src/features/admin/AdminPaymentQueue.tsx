import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { Button } from "../../shared/ui/Button";
import { TextAreaField } from "../../shared/ui/TextAreaField";
export function AdminPaymentQueue() {
  const queue = useQuery({
    queryKey: ["admin-top-ups", "REVIEW_REQUIRED"],
    queryFn: () => stepSixApi.adminTopUps("REVIEW_REQUIRED"),
  });
  return (
    <section className="insight-panel admin-section" id="admin-payments">
      <div className="admin-section__heading">
        <div>
          <p className="eyebrow">Balans ödənişləri</p>
          <h2>Çek yoxlama növbəsi</h2>
          <p>
            Avtomatik yatırılmış coin-ləri yoxlayın; risk həddində olan
            istifadəçilərin coin-lərini isə yalnız təsdiqdən sonra əlavə edin.
          </p>
        </div>
      </div>
      {queue.isPending ? (
        <p role="status">Ödənişlər açılır…</p>
      ) : queue.isError ? (
        <p role="alert">{queue.error.message}</p>
      ) : queue.data?.items.length ? (
        <div className="admin-case-list">
          {queue.data.items.map((item) => (
            <PaymentCase
              key={item.id}
              item={item}
              onDone={() => queue.refetch()}
            />
          ))}
        </div>
      ) : (
        <p>Gözləyən çek yoxdur.</p>
      )}
    </section>
  );
}
function PaymentCase({
  item,
  onDone,
}: {
  item: Awaited<ReturnType<typeof stepSixApi.adminTopUps>>["items"][number];
  onDone: () => void;
}) {
  const [note, setNote] = useState("");
  const [confirmingFraud, setConfirmingFraud] = useState(false);
  const automaticallyCredited = item.status === "AUTO_CREDITED_PENDING_REVIEW";
  const approve = useMutation({
    mutationFn: () => stepSixApi.approveTopUp(item.id, note),
    onSuccess: onDone,
  });
  const reject = useMutation({
    mutationFn: () => stepSixApi.rejectTopUp(item.id, note),
    onSuccess: onDone,
  });
  const fraud = useMutation({
    mutationFn: () => stepSixApi.confirmTopUpFraud(item.id, note.trim()),
    onSuccess: onDone,
  });
  const openReceipt = async () => {
    const blob = await stepSixApi.adminTopUpReceipt(item.id);
    const url = URL.createObjectURL(blob);
    if (item.receiptMediaType === "application/pdf") {
      const link = document.createElement("a");
      link.href = url;
      link.download = `odenis-ceki-${item.id}.pdf`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };
  return (
    <article>
      <h3>
        #{item.id} · {item.firstName} {item.lastName}
      </h3>
      <p>
        {item.phone} · {item.amountAzn} ₼ · {item.coinAmount} coin ·{" "}
        {item.packageCode}
      </p>
      <p>
        Ödənişə keçid: {formatDate(item.clickedAt)} · Çek:{" "}
        {item.receiptUploadedAt ? formatDate(item.receiptUploadedAt) : "—"}
      </p>
      <p>
        <strong>
          {automaticallyCredited
            ? "Coin avtomatik əlavə edilib, ödənişi yoxlayın."
            : "Coin yalnız admin təsdiqindən sonra əlavə ediləcək."}
        </strong>
      </p>
      <p>Təsdiqlənmiş fırıldaq sayı: <strong>{item.confirmedFraudCount}</strong></p>
      {item.receiptAttachmentId ? (
        <Button variant="secondary" onClick={() => void openReceipt()}>
          {item.receiptMediaType === "application/pdf" ? "PDF çeki endir" : "Çeki aç"}
        </Button>
      ) : null}
      <TextAreaField
        label={automaticallyCredited ? "Yoxlama qeydi" : "Qərar qeydi / rədd səbəbi"}
        value={note}
        onChange={(e) => { setNote(e.target.value); setConfirmingFraud(false); }}
        required={!automaticallyCredited}
      />
      {approve.error || reject.error || fraud.error ? (
        <p role="alert">{(approve.error ?? reject.error ?? fraud.error)?.message}</p>
      ) : null}
      {confirmingFraud ? (
        <div className="admin-confirm" role="alert">
          <p>
            {automaticallyCredited
              ? "Coin geri çəkiləcək və həmin balansla alınmış təsirlənmiş abunəliklər ləğv ediləcək."
              : "Bu çek fırıldaq kimi qeydə alınacaq və istifadəçinin sayğacı artırılacaq."}
          </p>
          <div>
            <Button loading={fraud.isPending} onClick={() => fraud.mutate()}>
              Fırıldaq təsdiqini tamamla
            </Button>
            <Button variant="quiet" onClick={() => setConfirmingFraud(false)}>Ləğv et</Button>
          </div>
        </div>
      ) : null}
      <div>
        <Button loading={approve.isPending} onClick={() => approve.mutate()}>
          {automaticallyCredited ? "Ödənişi təsdiqlə" : "Təsdiqlə və coin əlavə et"}
        </Button>
        {!automaticallyCredited ? (
          <Button
            variant="secondary"
            disabled={!note.trim() || reject.isPending}
            loading={reject.isPending}
            onClick={() => reject.mutate()}
          >
            Rədd et
          </Button>
        ) : null}
        <Button
          variant="secondary"
          disabled={!note.trim() || fraud.isPending}
          onClick={() => setConfirmingFraud(true)}
        >
          Fırıldaq kimi qeyd et
        </Button>
      </div>
    </article>
  );
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
