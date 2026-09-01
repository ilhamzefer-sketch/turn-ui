import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { Button } from "../../shared/ui/Button";
import { TextAreaField } from "../../shared/ui/TextAreaField";
export function AdminPaymentQueue() {
  const queue = useQuery({
    queryKey: ["admin-top-ups", "PENDING_REVIEW"],
    queryFn: () => stepSixApi.adminTopUps("PENDING_REVIEW"),
  });
  return (
    <section className="insight-panel admin-section" id="admin-payments">
      <div className="admin-section__heading">
        <div>
          <p className="eyebrow">Balans ödənişləri</p>
          <h2>Çek yoxlama növbəsi</h2>
          <p>
            Göndərilən çekləri yoxlayın və coin-ləri yalnız təsdiqdən sonra
            balanslaşdırın.
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
  const approve = useMutation({
    mutationFn: () => stepSixApi.approveTopUp(item.id, note),
    onSuccess: onDone,
  });
  const reject = useMutation({
    mutationFn: () => stepSixApi.rejectTopUp(item.id, note),
    onSuccess: onDone,
  });
  const openReceipt = async () => {
    const blob = await stepSixApi.adminTopUpReceipt(item.id);
    window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
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
      {item.receiptAttachmentId ? (
        <Button variant="secondary" onClick={() => void openReceipt()}>
          Çeki aç
        </Button>
      ) : null}
      <TextAreaField
        label="Qərar qeydi / rədd səbəbi"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        required
      />
      {approve.error || reject.error ? (
        <p role="alert">{(approve.error ?? reject.error)?.message}</p>
      ) : null}
      <div>
        <Button loading={approve.isPending} onClick={() => approve.mutate()}>
          Təsdiqlə və coin əlavə et
        </Button>
        <Button
          variant="secondary"
          disabled={!note.trim() || reject.isPending}
          loading={reject.isPending}
          onClick={() => reject.mutate()}
        >
          Rədd et
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
