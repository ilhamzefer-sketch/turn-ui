import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { stepSixApi } from "../../shared/api/stepSixApi";
import type { WalletTopUpRequestStatus } from "../../shared/api/contracts";

type PaymentFilter = "" | "PAID" | "PAYMENT_FAILED" | "AWAITING_RECEIPT";

const FILTERS: Array<{ value: PaymentFilter; label: string }> = [
  { value: "", label: "Hamisi" },
  { value: "PAID", label: "Odenilib" },
  { value: "PAYMENT_FAILED", label: "Ugursuz" },
  { value: "AWAITING_RECEIPT", label: "Gozleyir" },
];

const SUCCESS_STATUSES: WalletTopUpRequestStatus[] = ["PAID", "APPROVED", "VERIFIED"];
const FAILED_STATUSES: WalletTopUpRequestStatus[] = ["PAYMENT_FAILED", "REJECTED", "FRAUD_CONFIRMED", "EXPIRED"];

export function AdminPaymentQueue() {
  const [status, setStatus] = useState<PaymentFilter>("");
  const queue = useQuery({
    queryKey: ["admin-top-ups", status],
    queryFn: () => stepSixApi.adminTopUps(status),
  });

  const summary = useMemo(() => {
    const items = queue.data?.items ?? [];
    const today = new Date().toDateString();
    const paidToday = items.filter((item) =>
      isPaid(item.status) && new Date(item.clickedAt).toDateString() === today
    );
    return {
      total: items.length,
      paid: items.filter((item) => isPaid(item.status)).length,
      failed: items.filter((item) => isFailed(item.status)).length,
      waiting: items.filter((item) => isWaiting(item.status)).length,
      paidTodayAmount: paidToday.reduce((sum, item) => sum + item.amountAzn, 0),
    };
  }, [queue.data?.items]);

  return (
    <section className="insight-panel admin-section" id="admin-payments">
      <div className="admin-section__heading">
        <div>
          <p className="eyebrow">Balans odenisleri</p>
          <h2>Kart ve top-up odenisleri</h2>
          <p>Istifadecilerin Epoint ile yaratdigi ve tamamladigi coin odenislerini izleyin.</p>
        </div>
      </div>

      <div className="admin-payment-summary" aria-label="Odenis icmali">
        <strong>{summary.total}</strong><span>gosterilen</span>
        <strong>{summary.paid}</strong><span>odenilib</span>
        <strong>{summary.failed}</strong><span>ugursuz</span>
        <strong>{summary.waiting}</strong><span>gozleyir</span>
        <strong>{summary.paidTodayAmount} AZN</strong><span>bugun</span>
      </div>

      <div className="admin-payment-filters" aria-label="Odenis filterleri">
        {FILTERS.map((filter) => (
          <button
            key={filter.value || "all"}
            type="button"
            className={filter.value === status ? "is-active" : ""}
            aria-pressed={filter.value === status}
            onClick={() => setStatus(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {queue.isPending ? (
        <p role="status">Odenisler acilir...</p>
      ) : queue.isError ? (
        <p role="alert">{queue.error.message}</p>
      ) : queue.data?.items.length ? (
        <div className="admin-case-list">
          {queue.data.items.map((item) => (
            <PaymentCase
              key={item.id}
              item={item}
            />
          ))}
        </div>
      ) : (
        <p>Bu filterde odenis yoxdur.</p>
      )}
    </section>
  );
}

function PaymentCase({
  item,
}: {
  item: Awaited<ReturnType<typeof stepSixApi.adminTopUps>>["items"][number];
}) {
  return (
    <article>
      <h3>
        #{item.id} - {item.firstName} {item.lastName}
      </h3>
      <p>
        {item.phone} - {item.amountAzn} AZN - {item.coinAmount} coin - {item.packageCode}
      </p>
      <p>
        Status: <strong>{paymentStatusLabel(item.status)}</strong> - Tarix: {formatDate(item.clickedAt)}
      </p>
      {item.receiptUploadedAt ? <p>Tamamlanma tarixi: {formatDate(item.receiptUploadedAt)}</p> : null}
      {item.resolutionNote && isFailed(item.status) ? <p>Qeyd: {item.resolutionNote}</p> : null}
    </article>
  );
}

function paymentStatusLabel(status: WalletTopUpRequestStatus) {
  if (isPaid(status)) return "Odenilib";
  if (isFailed(status)) return "Ugursuz";
  return "Gozleyir";
}

function isPaid(status: WalletTopUpRequestStatus) {
  return SUCCESS_STATUSES.includes(status);
}

function isFailed(status: WalletTopUpRequestStatus) {
  return FAILED_STATUSES.includes(status);
}

function isWaiting(status: WalletTopUpRequestStatus) {
  return !isPaid(status) && !isFailed(status);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
