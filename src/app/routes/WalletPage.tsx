import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { WalletTopUpOptions } from "../../shared/api/contracts";
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

export function WalletPage() {
  const [requestedCoins, setRequestedCoins] = useState("100");
  const balanceQuery = useQuery({ queryKey: ["wallet-balance"], queryFn: walletApi.balance });
  const optionsQuery = useQuery({ queryKey: ["wallet-top-up-options"], queryFn: walletApi.topUpOptions });
  const historyQuery = useQuery({
    queryKey: ["wallet-transactions", 0, 20],
    queryFn: () => walletApi.transactions(0, 20),
  });
  usePageMeta("Balans — NövbəTime", "Coin balansınızı artırın və əməliyyat tarixçənizi izləyin.", { index: false });

  if (balanceQuery.isPending || optionsQuery.isPending) {
    return <div className="management-state" role="status">Balansınız açılır…</div>;
  }

  if (balanceQuery.isError || optionsQuery.isError) {
    return (
      <div className="management-state management-state--error" role="alert">
        <strong>Balans açıla bilmədi</strong>
        <p>{balanceQuery.error?.message ?? optionsQuery.error?.message}</p>
        <Button onClick={() => void Promise.all([balanceQuery.refetch(), optionsQuery.refetch()])}>Yenidən yoxla</Button>
      </div>
    );
  }

  const options = optionsQuery.data;
  const parsedCoins = Number(requestedCoins);
  const amountError = validateAmount(requestedCoins, parsedCoins, options);
  const requestedValue = amountError ? null : aznAmount(parsedCoins, options.coinsPerAzn);
  const whatsappUrl = requestedValue
    ? whatsappTopUpUrl(options.whatsappUrl, parsedCoins, requestedValue)
    : undefined;

  return (
    <div className="wallet-page">
      <header className="wallet-heading">
        <div>
          <p className="eyebrow">Şəxsi coin hesabı</p>
          <h1>Balansınız</h1>
          <p>Coin-lərinizi bütün fərdi və biznes iş sahələrinizdə istifadə edəcəksiniz.</p>
        </div>
        <section className="wallet-balance" aria-label="Cari coin balansı">
          <span>Mövcud balans</span>
          <strong>{coinAmount(balanceQuery.data.balance)}</strong>
          <small>{aznAmount(balanceQuery.data.balance, options.coinsPerAzn)} dəyərində</small>
        </section>
      </header>

      <div className="wallet-top-up-grid">
        <section className="wallet-top-up" aria-labelledby="wallet-top-up-title">
          <div>
            <p className="eyebrow">Balansı artır</p>
            <h2 id="wallet-top-up-title">Neçə coin əlavə edirsiniz?</h2>
            <p className="wallet-copy">Məbləği yazın, manat qarşılığını dərhal görün.</p>
          </div>
          <label className={`wallet-amount-field ${amountError ? "wallet-amount-field--error" : ""}`}>
            <span>Coin miqdarı</span>
            <input
              type="number"
              inputMode="numeric"
              min={options.minimumCoins}
              max={options.maximumCoins}
              step="1"
              value={requestedCoins}
              aria-describedby={amountError ? "coin-rate coin-amount-error" : "coin-rate"}
              aria-invalid={Boolean(amountError)}
              onChange={(event) => setRequestedCoins(event.target.value)}
            />
          </label>
          <p id="coin-rate" className="wallet-rate">{options.coinsPerAzn} coin = 1 ₼</p>
          {amountError ? <p id="coin-amount-error" className="wallet-field-error" role="alert">{amountError}</p> : null}
          <div className="wallet-conversion" aria-live="polite">
            <span>Ödəniləcək məbləğ</span>
            <strong>{requestedValue ?? "—"}</strong>
            <small>{requestedValue ? `${coinAmount(parsedCoins)} balansınıza əlavə ediləcək` : "Düzgün coin miqdarı daxil edin"}</small>
          </div>
        </section>

        <section className="wallet-payment" aria-labelledby="wallet-payment-title">
          <div>
            <p className="eyebrow">Ödəniş üsulu</p>
            <h2 id="wallet-payment-title">Necə davam etmək istəyirsiniz?</h2>
          </div>
          <article className="wallet-method wallet-method--disabled">
            <div className="wallet-method__heading">
              <span className="wallet-method__mark" aria-hidden="true">▭</span>
              <div><strong>Bank kartı</strong><span>Onlayn və avtomatik</span></div>
            </div>
            <span className="wallet-method__badge">Yaxın zamanda aktiv olacaq</span>
            <Button disabled>Bank kartı ilə ödəniş et</Button>
          </article>
          <article className="wallet-method wallet-method--active">
            <div className="wallet-method__heading">
              <span className="wallet-method__mark" aria-hidden="true">W</span>
              <div><strong>WhatsApp</strong><span>Operatorla birbaşa əlaqə</span></div>
            </div>
            <p>Müraciətdə seçdiyiniz coin və manat məbləği avtomatik yazılacaq.</p>
            <a
              className="button button--primary wallet-whatsapp-link"
              href={whatsappUrl}
              aria-disabled={!whatsappUrl}
              tabIndex={whatsappUrl ? undefined : -1}
              target="_blank"
              rel="noreferrer"
            >WhatsApp-da müraciət et</a>
          </article>
          <p className="wallet-payment__note">WhatsApp müraciəti balansı avtomatik artırmır. Ödəniş təsdiqləndikdən sonra coin hesabınıza əlavə olunacaq.</p>
        </section>
      </div>

      <section className="wallet-history" aria-labelledby="wallet-history-title">
        <div className="wallet-history__heading">
          <div><p className="eyebrow">Hesab hərəkətləri</p><h2 id="wallet-history-title">Son əməliyyatlar</h2></div>
          <span>Ən yeni əməliyyatlar əvvəl göstərilir</span>
        </div>
        {historyQuery.isPending ? <div className="wallet-history__state" role="status">Əməliyyatlar açılır…</div> : null}
        {historyQuery.isError ? <div className="wallet-history__state wallet-history__state--error" role="alert">Əməliyyat tarixçəsi açıla bilmədi.</div> : null}
        {historyQuery.data?.items.length === 0 ? <div className="wallet-history__state">Hələ balans əməliyyatınız yoxdur.</div> : null}
        {historyQuery.data?.items.length ? (
          <ol className="wallet-transaction-list">
            {historyQuery.data.items.map((transaction) => (
              <li key={transaction.id}>
                <div className={`wallet-transaction__mark wallet-transaction__mark--${transaction.direction.toLowerCase()}`} aria-hidden="true">
                  {transaction.direction === "CREDIT" ? "+" : "−"}
                </div>
                <div className="wallet-transaction__detail">
                  <strong>{walletTransactionLabel(transaction.type)}</strong>
                  <span>{transaction.description ?? walletTransactionDate(transaction.createdAt)}</span>
                  {transaction.description ? <small>{walletTransactionDate(transaction.createdAt)}</small> : null}
                </div>
                <div className="wallet-transaction__amount">
                  <strong>{transaction.direction === "CREDIT" ? "+" : "−"}{coinAmount(transaction.amount)}</strong>
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

function validateAmount(value: string, amount: number, options: WalletTopUpOptions) {
  if (!value || !Number.isSafeInteger(amount)) return "Coin miqdarını tam ədəd kimi daxil edin.";
  if (amount < options.minimumCoins) return `Ən az ${coinAmount(options.minimumCoins)} seçin.`;
  if (amount > options.maximumCoins) return `Ən çox ${coinAmount(options.maximumCoins)} seçə bilərsiniz.`;
  return null;
}
