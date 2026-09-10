import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError } from "../../shared/api/httpClient";
import { walletApi } from "../../shared/api/walletApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { Button } from "../../shared/ui/Button";
import {
  aznAmount,
  coinAmount,
  walletTransactionDate,
  walletTransactionLabel,
} from "../../features/wallet/walletFormatters";
import type { WalletTopUpPackage, WalletTopUpPackageCode, WalletTopUpRequestStatus } from "../../shared/api/contracts";

const FALLBACK_PACKAGES: WalletTopUpPackage[] = [
  { code: "AZN_3", amountAzn: 3, coinAmount: 30 },
  { code: "AZN_5", amountAzn: 5, coinAmount: 50 },
  { code: "AZN_10", amountAzn: 10, coinAmount: 100 },
  { code: "AZN_15", amountAzn: 15, coinAmount: 150 },
  { code: "AZN_20", amountAzn: 20, coinAmount: 200 },
];

export function WalletPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPackage, setSelectedPackage] = useState<WalletTopUpPackageCode>("AZN_10");
  const paymentResult = searchParams.get("payment");
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
      if (data.paymentUrl) {
        window.location.assign(data.paymentUrl);
      }
    },
  });

  usePageMeta(
    "Balans - NovbeTime",
    "Coin balansinizi sabit paketlerle artirin.",
    { index: false },
  );

  const packages = optionsQuery.data?.packages?.length ? optionsQuery.data.packages : FALLBACK_PACKAGES;


  useEffect(() => {
    if (paymentResult !== "success" && paymentResult !== "failed") {
      return;
    }
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] }),
      queryClient.invalidateQueries({ queryKey: ["wallet-active-top-up"] }),
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] }),
    ]);
    const timeout = window.setTimeout(() => {
      setSearchParams((current) => {
        current.delete("payment");
        return current;
      }, { replace: true });
    }, 6000);
    return () => window.clearTimeout(timeout);
  }, [paymentResult, queryClient, setSearchParams]);

  if (
    balanceQuery.isPending ||
    optionsQuery.isPending ||
    activeQuery.isPending
  )
    return (
      <div className="management-state" role="status">
        Balansınız açılır...
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
  const selected = packages.find((item) => item.code === selectedPackage) ?? packages[0];

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

      {paymentResult === "success" ? (
        <div className="success-alert" role="status">
          Ödənişiniz uğurludur. Coin balansınız yeniləndi.
        </div>
      ) : null}
      {paymentResult === "failed" ? (
        <div className="wallet-field-error" role="alert">
          Ödənişiniz uğursuzdur.
        </div>
      ) : null}

      <div className="wallet-top-up-grid wallet-top-up-grid--single">
        <section className="wallet-top-up" aria-labelledby="wallet-top-up-title">
          <div>
            <p className="eyebrow">Balansı artır</p>
            <h2 id="wallet-top-up-title">Coin paketi seçin</h2>
            <p className="wallet-copy">
              Məbləğ paketə görə hesablanır. Paketi seçin və Epoint ödəniş
              səhifəsində kartla tamamlayın; uğurlu ödənişdən sonra coin
              balansınıza avtomatik əlavə olunur.
            </p>
          </div>

          <div className="wallet-package-grid">
            {packages.map((item) => {
              const isSelected = item.code === selected.code;
              return (
                <button
                  className={`wallet-package ${isSelected ? "wallet-package--selected" : ""}`.trim()}
                  disabled={create.isPending}
                  key={item.code}
                  onClick={() => setSelectedPackage(item.code)}
                  type="button"
                >
                  <span>{formatAznAmount(item.amountAzn)} ₼</span>
                  <strong>{coinAmount(item.coinAmount)}</strong>
                  <small>{formatAznAmount(item.amountAzn)} manatlıq paket</small>
                </button>
              );
            })}
          </div>

          <div className="wallet-top-up__actions">
            <Button
              className="wallet-pay-button"
              aria-label={`Epoint ilə ödəniş et ${formatAznAmount(selected.amountAzn)} ₼`}
              disabled={create.isPending}
              loading={create.isPending}
              onClick={() => create.mutate(selected.code)}
            >
              <span className="wallet-pay-button__icon" aria-hidden="true">▣</span>
              <span className="wallet-pay-button__label">Epoint ilə ödəniş et</span>
              <span className="wallet-pay-button__amount">{formatAznAmount(selected.amountAzn)} ₼</span>
            </Button>
            <span>
              Seçilən paket: {coinAmount(selected.coinAmount)} · {formatAznAmount(selected.amountAzn)} ₼
            </span>
          </div>

          <p className="wallet-rate">
            {options.coinsPerAzn} coin = 1 ₼ · Bank kartı ilə ödəniş Epoint
            vasitəsilə tamamlanır.
          </p>

          {create.error ? (
            <p className="wallet-field-error" role="alert">
              {create.error.message}
            </p>
          ) : null}

          {active ? (
            <div className="wallet-active-request">
              <strong>
                {coinAmount(active.coinAmount)} üçün {active.amountAzn} ₼ sorğu
              </strong>
              <span>Status: {statusLabel(active.status)}</span>
              <small>Ödənişə keçid vaxtı: {formatDate(active.clickedAt)}</small>
              {active.paymentUrl ? (
                <a className="button button--primary" href={active.paymentUrl}>
                  Ödənişə davam et
                </a>
              ) : null}
              <p className="wallet-payment__note">
                {active.status === "AUTO_CREDITED_PENDING_REVIEW" || active.status === "PAID"
                  ? "Coin balansınıza əlavə edildi."
                  : active.status === "PAYMENT_FAILED"
                    ? "Ödənişiniz uğursuzdur. Yeni paket seçib yenidən cəhd edin."
                    : "Ödəniş tamamlandıqdan sonra coin balansınıza avtomatik əlavə olunacaq. Link işləmirsə, yeni paket seçib yeni ödəniş yarada bilərsiniz."}
              </p>
            </div>
          ) : null}
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
            Əməliyyatlar açılır...
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
                  {transaction.direction === "CREDIT" ? "+" : "-"}
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
                    {transaction.direction === "CREDIT" ? "+" : "-"}
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

function formatAznAmount(value: number) {
  return new Intl.NumberFormat("az-AZ", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function statusLabel(status: WalletTopUpRequestStatus) {
  return (
    (
      {
        AWAITING_RECEIPT: "Ödəniş gözlənilir",
        PENDING_REVIEW: "Yoxlanılır",
        MANUAL_REVIEW: "Admin təsdiqi gözlənilir",
        AUTO_CREDITED_PENDING_REVIEW: "Coin əlavə edildi, çek yoxlanılır",
        APPROVED: "Təsdiqləndi",
        VERIFIED: "Ödəniş yoxlanıldı",
        PAID: "Ödəniş tamamlandı",
        PAYMENT_FAILED: "Ödəniş alınmadı",
        REJECTED: "Rədd edildi",
        FRAUD_CONFIRMED: "Fırıldaq təsdiqləndi",
        EXPIRED: "Vaxtı bitdi",
      } satisfies Record<WalletTopUpRequestStatus, string>
    )[status] ?? status
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
