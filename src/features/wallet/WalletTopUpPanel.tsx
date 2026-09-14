import { useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { WalletTopUpOptions, WalletTopUpRequest } from "../../shared/api/contracts";
import { Button } from "../../shared/ui/Button";
import { coinAmount } from "./walletFormatters";
import { topUpGuidance, topUpStatusLabel } from "./topUpPresentation";

export function WalletTopUpPanel({ options, active, create, upload }: {
  options: WalletTopUpOptions;
  active: WalletTopUpRequest | null;
  create: UseMutationResult<WalletTopUpRequest, Error, number>;
  upload: UseMutationResult<WalletTopUpRequest, Error, { requestId: number; file: File }>;
}) {
  const [amountText, setAmountText] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const amount = parseAmount(amountText);
  const amountError = validateAmount(amountText, amount, options);
  const coins = amount === null || amountError ? null : Math.round(amount * options.coinsPerAzn);
  const canCreate = options.customAmountEnabled;

  const submit = () => {
    setAmountTouched(true);
    if (amount === null || amountError || !canCreate) return;
    create.mutate(amount);
  };

  return (
    <section className="wallet-top-up" aria-labelledby="wallet-top-up-title">
      <div>
        <p className="eyebrow">Balansı artır</p>
        <h2 id="wallet-top-up-title">Məbləği daxil edin</h2>
        <p className="wallet-copy">Ödəmək istədiyiniz məbləği yazın. Coin yalnız ödəniş server tərəfindən təsdiqləndikdən sonra əlavə olunur.</p>
      </div>

      <div className="wallet-top-up__form">
        <label className={`wallet-amount-field ${amountTouched && amountError ? "wallet-amount-field--error" : ""}`.trim()} htmlFor="wallet-top-up-amount">
          <span>Ödəniş məbləği</span>
          <div className="wallet-amount-field__control">
            <input
              aria-label="Ödəniş məbləği"
              aria-describedby="wallet-top-up-amount-help wallet-top-up-amount-error"
              aria-invalid={amountTouched && Boolean(amountError)}
              autoComplete="off"
              disabled={!canCreate || create.isPending}
              id="wallet-top-up-amount"
              inputMode="decimal"
              min={options.minimumAmountAzn}
              max={options.maximumAmountAzn}
              onBlur={() => setAmountTouched(true)}
              onChange={(event) => {
                const nextValue = sanitizeAmountInput(event.target.value, options.maximumAmountAzn);
                if (nextValue !== null) setAmountText(nextValue);
              }}
              placeholder="Məsələn, 7.30"
              step={options.amountStepAzn}
              type="text"
              value={amountText}
            />
            <span aria-hidden="true">₼</span>
          </div>
        </label>
        <p className="wallet-rate" id="wallet-top-up-amount-help">Minimum {formatAznAmount(options.minimumAmountAzn)} ₼ · maksimum {formatAznAmount(options.maximumAmountAzn)} ₼ · {formatAznAmount(options.amountStepAzn)} ₼ addımlarla</p>
        {amountTouched && amountError ? <p className="wallet-field-error" id="wallet-top-up-amount-error" role="alert">{amountError}</p> : null}
      </div>

      <div className="wallet-conversion" aria-live="polite">
        <span>Alacağınız coin</span>
        <strong>{coins === null ? "—" : coinAmount(coins)}</strong>
        <small>{coins === null ? "Məbləği daxil etdikdən sonra coin miqdarını görəcəksiniz." : `${formatAznAmount(amount as number)} ₼ məbləği ${coinAmount(coins)} edir.`}</small>
      </div>

      <div className="wallet-top-up__actions">
        <Button aria-label={coins === null ? "Ödəniş et" : `${formatAznAmount(amount as number)} ₼ üçün ödəniş et`} className="wallet-pay-button" disabled={!canCreate || amount === null || Boolean(amountError)} loading={create.isPending} onClick={submit}>
          <span className="wallet-pay-button__icon" aria-hidden="true">▣</span>
          <span className="wallet-pay-button__label">Ödəniş et</span>
          {amount !== null && !amountError ? <span className="wallet-pay-button__amount">{formatAznAmount(amount)} ₼</span> : null}
        </Button>
      </div>

      {create.error ? <p className="wallet-field-error" role="alert">{create.error.message}</p> : null}
      {!canCreate ? <p className="wallet-availability" role="status">Ödəniş xidməti müvəqqəti əlçatan deyil.</p> : null}
      {active ? <ActiveRequest active={active} receipt={receipt} setReceipt={setReceipt} upload={upload} /> : null}
    </section>
  );
}

function ActiveRequest({ active, receipt, setReceipt, upload }: {
  active: WalletTopUpRequest;
  receipt: File | null;
  setReceipt: (file: File | null) => void;
  upload: UseMutationResult<WalletTopUpRequest, Error, { requestId: number; file: File }>;
}) {
  return (
    <div className="wallet-active-request" aria-live="polite">
      <div className="wallet-active-request__heading">
        <div><strong>{coinAmount(active.coinAmount)} üçün {formatAznAmount(active.amountAzn)} ₼</strong><small>Sorğu #{active.id} · {formatDate(active.clickedAt)}</small></div>
        <span className={`wallet-status wallet-status--${statusTone(active)}`}>{topUpStatusLabel(active.status)}</span>
      </div>
      <p className="wallet-payment__note">{topUpGuidance(active)}</p>
      {active.paymentUrl ? <a className="button button--primary" href={active.paymentUrl}>Ödənişə davam et</a> : null}
      {active.paymentProvider === "manual" && active.receiptUploadOpen ? (
        <div className="wallet-receipt-upload">
          <label htmlFor={`wallet-receipt-${active.id}`}>Ödəniş çeki</label>
          <input id={`wallet-receipt-${active.id}`} type="file" accept="image/png,image/jpeg,application/pdf" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} />
          <small>PNG, JPG və ya PDF faylı seçin.</small>
          <Button disabled={!receipt || upload.isPending} loading={upload.isPending} onClick={() => receipt && upload.mutate({ requestId: active.id, file: receipt })}>Çeki göndər</Button>
        </div>
      ) : null}
      {upload.error ? <p className="wallet-field-error" role="alert">{upload.error.message}</p> : null}
    </div>
  );
}

function parseAmount(value: string) {
  const normalized = value.trim().replace(",", ".");
  return /^\d+(?:\.\d{1,2})?$/.test(normalized) ? Number(normalized) : null;
}

function sanitizeAmountInput(value: string, maximumAmountAzn: number): string | null {
  const normalized = value.replace(",", ".");
  if (!/^\d*(?:\.\d{0,2})?$/.test(normalized)) return null;
  if (!normalized) return "";
  if (normalized.startsWith(".")) return `0${normalized}`;
  if (Number(normalized) > maximumAmountAzn) return formatAznAmount(maximumAmountAzn);
  return normalized.replace(/^0+(?=\d)/, "");
}

function validateAmount(value: string, amount: number | null, options: WalletTopUpOptions) {
  if (!value.trim()) return "Ödəniş məbləğini daxil edin.";
  if (amount === null || !Number.isFinite(amount)) return "Məbləği ən çox iki onluq rəqəmlə yazın.";
  if (amount < options.minimumAmountAzn) return `Minimum məbləğ ${formatAznAmount(options.minimumAmountAzn)} ₼-dir.`;
  if (amount > options.maximumAmountAzn) return `Maksimum məbləğ ${formatAznAmount(options.maximumAmountAzn)} ₼-dir.`;
  const units = Math.round(amount / options.amountStepAzn);
  return Math.abs(amount - units * options.amountStepAzn) > 0.000001 ? `Məbləği ${formatAznAmount(options.amountStepAzn)} ₼ addımlarla daxil edin.` : null;
}

function statusTone(request: WalletTopUpRequest) {
  if (["PAID", "APPROVED", "VERIFIED", "AUTO_CREDITED_PENDING_REVIEW"].includes(request.status)) return "success";
  if (["PAYMENT_FAILED", "REJECTED", "FRAUD_CONFIRMED", "EXPIRED", "SUPERSEDED"].includes(request.status)) return "danger";
  return "pending";
}

function formatAznAmount(value: number) {
  return new Intl.NumberFormat("az-AZ", { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
