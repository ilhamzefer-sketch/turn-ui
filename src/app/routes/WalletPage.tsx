import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "../../shared/api/httpClient";
import { walletApi } from "../../shared/api/walletApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { Button } from "../../shared/ui/Button";
import {
  aznAmount,
  coinAmount,
  walletTransactionDate,
  walletTransactionLabel,
  whatsappTopUpUrl,
} from "../../features/wallet/walletFormatters";
import type { WalletTopUpPackageCode } from "../../shared/api/contracts";

const PACKAGES: Array<{
  code: WalletTopUpPackageCode;
  amount: number;
  coins: number;
}> = [
  { code: "AZN_3", amount: 3, coins: 30 },
  { code: "AZN_5", amount: 5, coins: 50 },
  { code: "AZN_10", amount: 10, coins: 100 },
  { code: "AZN_15", amount: 15, coins: 150 },
  { code: "AZN_20", amount: 20, coins: 200 },
];

export function WalletPage() {
  const queryClient = useQueryClient();
  const [receipt, setReceipt] = useState<File | null>(null);
  const balanceQuery = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: walletApi.balance,
  });
  const optionsQuery = useQuery({
    queryKey: ["wallet-top-up-options"],
    queryFn: walletApi.topUpOptions,
  });
  const activeQuery = useQuery({
    queryKey: ["wallet-active-top-up"],
    queryFn: walletApi.activeTopUpRequest,
    retry: false,
  });
  const historyQuery = useQuery({
    queryKey: ["wallet-transactions", 0, 20],
    queryFn: () => walletApi.transactions(0, 20),
  });
  const create = useMutation({
    mutationFn: walletApi.createTopUpRequest,
    onSuccess: (data) => {
      queryClient.setQueryData(["wallet-active-top-up"], data);
    },
  });
  const upload = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      walletApi.uploadReceipt(id, file),
    onSuccess: (data) => {
      queryClient.setQueryData(["wallet-active-top-up"], data);
      setReceipt(null);
    },
  });
  usePageMeta(
    "Balans — NövbəTime",
    "Coin balansınızı sabit paketlərlə artırın.",
    { index: false },
  );
  if (
    balanceQuery.isPending ||
    optionsQuery.isPending ||
    activeQuery.isPending
  )
    return (
      <div className="management-state" role="status">
        Balansınız açılır…
      </div>
    );
  if (balanceQuery.isError || optionsQuery.isError)
    return (
      <div className="management-state management-state--error" role="alert">
        <strong>Balans açıla bilmədi</strong>
        <p>{balanceQuery.error?.message ?? optionsQuery.error?.message}</p>
        <Button
          onClick={() =>
            void Promise.all([balanceQuery.refetch(), optionsQuery.refetch()])
          }
        >
          Yenidən yoxla
        </Button>
      </div>
    );
  const activeMissing = activeQuery.error instanceof ApiError && activeQuery.error.status === 404;
  if (activeQuery.isError && !activeMissing)
    return (
      <div className="management-state management-state--error" role="alert">
        <strong>Ödəniş sorğusu yoxlanıla bilmədi</strong>
        <p>{activeQuery.error.message}</p>
        <Button onClick={() => void activeQuery.refetch()}>Yenidən yoxla</Button>
      </div>
    );
  const active = activeMissing ? null : activeQuery.data;
  const options = optionsQuery.data;
  return (
    <div className="wallet-page">
      <header className="wallet-heading">
        <div>
          <p className="eyebrow">Şəxsi coin hesabı</p>
          <h1>Balansınız</h1>
          <p>
            Coin-lər bütün fərdi və biznes iş sahələrinizdə istifadə olunur.
          </p>
        </div>
        <section className="wallet-balance" aria-label="Cari coin balansı">
          <span>Mövcud balans</span>
          <strong>{coinAmount(balanceQuery.data.balance)}</strong>
          <small>
            {aznAmount(balanceQuery.data.balance, options.coinsPerAzn)}{" "}
            dəyərində
          </small>
        </section>
      </header>
      <div className="wallet-top-up-grid">
        <section
          className="wallet-top-up"
          aria-labelledby="wallet-top-up-title"
        >
          <div>
            <p className="eyebrow">Balansı artır</p>
            <h2 id="wallet-top-up-title">Sabit paket seçin</h2>
            <p className="wallet-copy">
              Öz məbləğinizi yazmaq mümkün deyil. Paket seçin, Kapital ödəniş
              səhifəsinə keçin və çeki yükləyin.
            </p>
          </div>
          <div className="wallet-package-grid">
            {PACKAGES.map((item) => (
              <article
                className={`wallet-package ${active ? "wallet-package--locked" : ""}`}
                key={item.code}
              >
                <span>{item.amount} ₼</span>
                <strong>{coinAmount(item.coins)}</strong>
                <small>{item.code.replace("AZN_", "")} manatlıq paket</small>
                <Button
                  disabled={Boolean(active) || create.isPending}
                  loading={create.isPending && create.variables === item.code}
                  onClick={() => create.mutate(item.code)}
                >
                  Ödə
                </Button>
              </article>
            ))}
          </div>
          <p className="wallet-rate">
            {options.coinsPerAzn} coin = 1 ₼ · Bank kartı ilə ödəniş yaxın
            zamanda aktiv olacaq.
          </p>
        </section>
        <section
          className="wallet-payment"
          aria-labelledby="wallet-payment-title"
        >
          <div>
            <p className="eyebrow">Cari sorğu</p>
            <h2 id="wallet-payment-title">Ödəniş və çek</h2>
          </div>
          {create.error ? (
            <p className="wallet-field-error" role="alert">
              {create.error.message}
            </p>
          ) : null}
          {active ? (
            <div className="wallet-active-request">
              <strong>
                {coinAmount(active.coinAmount)} üçün {active.amountAzn} ₼
                sorğu
              </strong>
              <span>Status: {statusLabel(active.status)}</span>
              <small>Ödənişə keçid vaxtı: {formatDate(active.clickedAt)}</small>
              <small>Çek üçün son vaxt: {formatDate(active.receiptDeadlineAt)}</small>
              {active.paymentUrl ? (
                <a
                  className="button button--primary"
                  href={active.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Kapital ödəniş səhifəsini aç
                </a>
              ) : null}
              {active.receiptUploadOpen ? (
                <label className="wallet-receipt-field">
                  <span>Ödəniş çekini yükləyin</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(event) =>
                      setReceipt(event.target.files?.[0] ?? null)
                    }
                  />
                  {receipt ? (
                    <Button
                      type="button"
                      loading={upload.isPending}
                      disabled={upload.isPending}
                      onClick={() =>
                        upload.mutate({ id: active.id, file: receipt })
                      }
                    >
                      Çeki göndər
                    </Button>
                  ) : (
                    <small>JPG və ya PNG · 30 dəqiqə ərzində</small>
                  )}
                  {upload.error ? <small role="alert">{upload.error.message}</small> : null}
                </label>
              ) : (
                <p className="wallet-payment__note">
                  Yeni paket seçmək üçün bu sorğunun təsdiqlənməsini və ya rədd
                  edilməsini gözləyin.
                </p>
              )}
            </div>
          ) : (
            <p className="wallet-payment__note">
              Paket seçdikdən sonra ödəniş keçidi və çek yükləmə sahəsi burada
              görünəcək.
            </p>
          )}
          <article className="wallet-method wallet-method--disabled">
            <div className="wallet-method__heading">
              <span className="wallet-method__mark" aria-hidden="true">
                ▭
              </span>
              <div>
                <strong>Bank kartı</strong>
                <span>Yaxın zamanda aktiv olacaq</span>
              </div>
            </div>
            <Button disabled>Bank kartı ilə ödəniş et</Button>
          </article>
          <a
            className="button button--secondary wallet-whatsapp-link"
            href={whatsappTopUpUrl(options.whatsappUrl, 100, 10)}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp ilə müraciət et
          </a>
        </section>
      </div>
      <section
        className="wallet-history"
        aria-labelledby="wallet-history-title"
      >
        <div className="wallet-history__heading">
          <div>
            <p className="eyebrow">Hesab hərəkətləri</p>
            <h2 id="wallet-history-title">Son əməliyyatlar</h2>
          </div>
          <span>Ən yeni əməliyyatlar əvvəl göstərilir</span>
        </div>
        {historyQuery.isPending ? (
          <div className="wallet-history__state" role="status">
            Əməliyyatlar açılır…
          </div>
        ) : null}
        {historyQuery.isError ? (
          <div
            className="wallet-history__state wallet-history__state--error"
            role="alert"
          >
            Əməliyyat tarixçəsi açıla bilmədi.
          </div>
        ) : null}
        {historyQuery.data?.items.length === 0 ? (
          <div className="wallet-history__state">
            Hələ balans əməliyyatınız yoxdur.
          </div>
        ) : null}
        {historyQuery.data?.items.length ? (
          <ol className="wallet-transaction-list">
            {historyQuery.data.items.map((transaction) => (
              <li key={transaction.id}>
                <div
                  className={`wallet-transaction__mark wallet-transaction__mark--${transaction.direction.toLowerCase()}`}
                  aria-hidden="true"
                >
                  {transaction.direction === "CREDIT" ? "+" : "−"}
                </div>
                <div className="wallet-transaction__detail">
                  <strong>{walletTransactionLabel(transaction.type)}</strong>
                  <span>
                    {transaction.description ??
                      walletTransactionDate(transaction.createdAt)}
                  </span>
                  {transaction.description ? (
                    <small>
                      {walletTransactionDate(transaction.createdAt)}
                    </small>
                  ) : null}
                </div>
                <div className="wallet-transaction__amount">
                  <strong>
                    {transaction.direction === "CREDIT" ? "+" : "−"}
                    {coinAmount(transaction.amount)}
                  </strong>
                  <span>Balans: {coinAmount(transaction.balanceAfter)}</span>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </section>
    </div>
  );
}
function statusLabel(status: string) {
  return (
    (
      {
        AWAITING_RECEIPT: "Çek gözlənilir",
        PENDING_REVIEW: "Yoxlanılır",
        APPROVED: "Təsdiqləndi",
        REJECTED: "Rədd edildi",
        EXPIRED: "Vaxtı bitdi",
      } as Record<string, string>
    )[status] ?? status
  );
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
