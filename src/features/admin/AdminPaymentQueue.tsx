import { useMutation, useQuery, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { useState } from "react";
import { stepSixApi } from "../../shared/api/stepSixApi";
import type { AdminTopUpRequest, WalletTopUpRequestStatus } from "../../shared/api/contracts";
import { Button } from "../../shared/ui/Button";
import { isFailedTopUp, isPaidTopUp, topUpStatusLabel } from "../wallet/topUpPresentation";

type PaymentFilter = "" | "PAID_GROUP" | "FAILED_GROUP" | "WAITING_GROUP";
type ReviewCommand = { id: number; action: "approve" | "reject" | "fraud"; note: string };

const FILTERS: Array<{ value: PaymentFilter; label: string }> = [
  { value: "", label: "Hamısı" },
  { value: "PAID_GROUP", label: "Ödənilib" },
  { value: "FAILED_GROUP", label: "Bağlanıb" },
  { value: "WAITING_GROUP", label: "Gözləyir" },
];

export function AdminPaymentQueue() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<PaymentFilter>("");
  const [page, setPage] = useState(0);
  const queue = useQuery({
    queryKey: ["admin-top-ups", status, page],
    queryFn: () => stepSixApi.adminTopUps(status, page),
  });
  const review = useMutation({
    mutationFn: ({ id, action, note }: ReviewCommand) => {
      if (action === "approve") return stepSixApi.approveTopUp(id, note);
      if (action === "reject") return stepSixApi.rejectTopUp(id, note);
      return stepSixApi.confirmTopUpFraud(id, note);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-top-ups"] }),
  });

  const selectFilter = (value: PaymentFilter) => {
    setStatus(value);
    setPage(0);
  };

  return (
    <section className="insight-panel admin-section" id="admin-payments">
      <div className="admin-section__heading">
        <div>
          <p className="eyebrow">Balans ödənişləri</p>
          <h2>Kart və balans ödənişləri</h2>
          <p>Epoint ödənişlərini və yoxlama tələb edən köhnə bank çeklərini izləyin.</p>
        </div>
      </div>

      {queue.data ? <PaymentSummary summary={queue.data.summary} /> : null}

      <div className="admin-payment-filters" aria-label="Ödəniş filtrləri">
        {FILTERS.map((filter) => (
          <button
            key={filter.value || "all"}
            type="button"
            className={filter.value === status ? "is-active" : ""}
            aria-pressed={filter.value === status}
            onClick={() => selectFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {queue.isPending ? (
        <p role="status">Ödənişlər açılır...</p>
      ) : queue.isError ? (
        <div className="admin-form-message admin-form-message--error" role="alert">
          <span>{queue.error.message}</span>
          <Button variant="secondary" onClick={() => void queue.refetch()}>Yenidən yoxla</Button>
        </div>
      ) : queue.data.items.length ? (
        <>
          <p className="admin-payment-page-count">Bu səhifədə {queue.data.items.length} ödəniş göstərilir.</p>
          <div className="admin-case-list admin-payment-list">
            {queue.data.items.map((item) => <PaymentCase key={item.id} item={item} review={review} />)}
          </div>
          <nav className="admin-pagination" aria-label="Ödəniş səhifələri">
            <Button variant="secondary" disabled={page === 0 || queue.isFetching} onClick={() => setPage((value) => value - 1)}>
              Əvvəlki səhifə
            </Button>
            <span>{page + 1}-ci səhifə</span>
            <Button variant="secondary" disabled={!queue.data.hasNext || queue.isFetching} onClick={() => setPage((value) => value + 1)}>
              Növbəti səhifə
            </Button>
          </nav>
        </>
      ) : (
        <p>Bu filtrdə ödəniş yoxdur.</p>
      )}
    </section>
  );
}

function PaymentSummary({ summary }: { summary: Awaited<ReturnType<typeof stepSixApi.adminTopUps>>["summary"] }) {
  return (
    <div className="admin-payment-summary" aria-label="Bütün ödənişlərin icmalı">
      <div><strong>{summary.total}</strong><span>ümumi</span></div>
      <div><strong>{summary.paid}</strong><span>ödənilib</span></div>
      <div><strong>{summary.failed}</strong><span>bağlanıb</span></div>
      <div><strong>{summary.waiting}</strong><span>gözləyir</span></div>
      <div>
        <strong>{formatMoney(summary.paidTodayAmount)}</strong>
        <span>{formatBusinessDate(summary.businessDate)} ödənilib · Bakı vaxtı</span>
      </div>
    </div>
  );
}

function PaymentCase({ item, review }: { item: AdminTopUpRequest; review: UseMutationResult<AdminTopUpRequest, Error, ReviewCommand> }) {
  return (
    <article className="admin-payment-card">
      <div className="admin-payment-card__heading">
        <div><p className="eyebrow">Sorğu #{item.id}</p><h3>{item.firstName} {item.lastName}</h3><span>{item.phone}</span></div>
        <span className={`wallet-status wallet-status--${statusTone(item.status)}`}>{topUpStatusLabel(item.status)}</span>
      </div>
      <dl className="admin-payment-card__meta">
        <div><dt>Məbləğ</dt><dd>{formatMoney(item.amountAzn)}</dd></div>
        <div><dt>Coin</dt><dd>{item.coinAmount} coin</dd></div>
        <div><dt>Üsul</dt><dd>{item.paymentProvider === "epoint" ? "Epoint" : "Bank çeki"}</dd></div>
        <div><dt>Yaradılıb</dt><dd>{formatDate(item.clickedAt)}</dd></div>
        {item.receiptUploadedAt ? <div><dt>Tamamlanıb</dt><dd>{formatDate(item.reviewedAt ?? item.receiptUploadedAt)}</dd></div> : null}
        {item.externalOrderId ? <div><dt>Sifariş</dt><dd>{item.externalOrderId}</dd></div> : null}
      </dl>
      {item.resolutionNote ? <p className="admin-payment-note"><strong>Qeyd:</strong> {item.resolutionNote}</p> : null}
      {requiresReview(item.status) ? <ReviewControls item={item} review={review} /> : null}
    </article>
  );
}

function ReviewControls({ item, review }: { item: AdminTopUpRequest; review: UseMutationResult<AdminTopUpRequest, Error, ReviewCommand> }) {
  const [intent, setIntent] = useState<ReviewCommand["action"] | null>(null);
  const [note, setNote] = useState("");
  const receipt = useMutation({ mutationFn: () => openReceipt(item.id) });
  const automaticCredit = item.status === "AUTO_CREDITED_PENDING_REVIEW";
  const destructive = intent === "reject" || intent === "fraud";
  const submit = () => {
    if (!intent || (destructive && !note.trim())) return;
    review.mutate({ id: item.id, action: intent, note: note.trim() }, { onSuccess: () => setIntent(null) });
  };

  return (
    <div className="admin-payment-review">
      {item.receiptAttachmentId ? (
        <Button variant="secondary" disabled={receipt.isPending} loading={receipt.isPending} onClick={() => receipt.mutate()}>Çeki aç</Button>
      ) : null}
      {receipt.isError ? <p className="admin-form-message admin-form-message--error" role="alert">Çek açıla bilmədi: {receipt.error.message}</p> : null}
      <div className="admin-payment-review__choices">
        <Button variant="secondary" onClick={() => setIntent("approve")}>
          {automaticCredit ? "Çeki təsdiqlə" : "Ödənişi təsdiqlə"}
        </Button>
        <Button variant="secondary" onClick={() => setIntent(automaticCredit ? "fraud" : "reject")}>
          {automaticCredit ? "Fırıldaq kimi yoxla" : "Çeki rədd et"}
        </Button>
      </div>
      {intent ? (
        <div className="admin-confirm admin-payment-confirm" role="alert">
          <div>
            <strong>{confirmationTitle(intent, automaticCredit)}</strong>
            <p>{confirmationCopy(intent, item.coinAmount)}</p>
          </div>
          <label className="field">
            <span>{destructive ? "Səbəb" : "Qeyd (istəyə bağlı)"}</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
          </label>
          <div>
            <Button variant="secondary" onClick={() => setIntent(null)}>Ləğv et</Button>
            <Button disabled={review.isPending || (destructive && !note.trim())} loading={review.isPending} onClick={submit}>
              Qərarı təsdiqlə
            </Button>
          </div>
        </div>
      ) : null}
      {review.isError && review.variables?.id === item.id ? <p className="admin-form-message admin-form-message--error" role="alert">{review.error.message}</p> : null}
    </div>
  );
}

async function openReceipt(id: number) {
  const tab = window.open("about:blank", "_blank");
  if (!tab) throw new Error("Brauzer çek üçün yeni pəncərəni blokladı.");
  tab.opener = null;
  try {
    const blob = await stepSixApi.adminTopUpReceipt(id);
    const url = URL.createObjectURL(blob);
    tab.location.replace(url);
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    tab.close();
    throw error;
  }
}

function requiresReview(status: WalletTopUpRequestStatus) {
  return ["PENDING_REVIEW", "MANUAL_REVIEW", "AUTO_CREDITED_PENDING_REVIEW"].includes(status);
}

function statusTone(status: WalletTopUpRequestStatus) {
  if (isPaidTopUp(status) || status === "AUTO_CREDITED_PENDING_REVIEW") return "success";
  if (isFailedTopUp(status)) return "danger";
  return "pending";
}

function confirmationTitle(action: ReviewCommand["action"], automaticCredit: boolean) {
  if (action === "fraud") return "Fırıldaq təsdiqi";
  if (action === "reject") return "Çekin rədd edilməsi";
  return automaticCredit ? "Avtomatik əlavənin yoxlanması" : "Coin əlavəsinin təsdiqi";
}

function confirmationCopy(action: ReviewCommand["action"], coins: number) {
  if (action === "fraud") return `${coins} coin balansdan geri çıxarıla və istifadəçinin risk göstəricisi artırıla bilər.`;
  if (action === "reject") return "Bu qərardan sonra sorğu rədd edilmiş kimi bağlanacaq.";
  return `${coins} coin üçün ödəniş çekini təsdiqlədiyinizi yoxlayın.`;
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ₼`;
}

function formatBusinessDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", { day: "numeric", month: "long" }).format(new Date(`${value}T12:00:00+04:00`));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
