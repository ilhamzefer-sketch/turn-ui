import { useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import type {
  WalletTopUpOptions,
  WalletTopUpPackage,
  WalletTopUpPackageCode,
  WalletTopUpRequest,
} from "../../shared/api/contracts";
import { Button } from "../../shared/ui/Button";
import { coinAmount } from "./walletFormatters";
import { topUpGuidance, topUpStatusLabel } from "./topUpPresentation";

export function WalletTopUpPanel({
  options,
  packages,
  active,
  create,
  upload,
}: {
  options: WalletTopUpOptions;
  packages: WalletTopUpPackage[];
  active: WalletTopUpRequest | null;
  create: UseMutationResult<WalletTopUpRequest, Error, WalletTopUpPackageCode>;
  upload: UseMutationResult<WalletTopUpRequest, Error, { requestId: number; file: File }>;
}) {
  const [selectedCode, setSelectedCode] = useState<WalletTopUpPackageCode>("AZN_10");
  const [receipt, setReceipt] = useState<File | null>(null);
  const selected = packages.find((item) => item.code === selectedCode) ?? packages[0];
  const canCreate = options.bankCardEnabled || options.manualTopUpEnabled;
  const manualMode = !options.bankCardEnabled && options.manualTopUpEnabled;

  return (
    <section className="wallet-top-up" aria-labelledby="wallet-top-up-title">
      <div>
        <p className="eyebrow">Balansı artır</p>
        <h2 id="wallet-top-up-title">Coin paketi seçin</h2>
        <p className="wallet-copy">
          {options.bankCardEnabled
            ? "Paketi seçin və Epoint səhifəsində kartla ödəyin. Coin yalnız server ödənişi təsdiqlədikdən sonra əlavə olunur."
            : options.manualTopUpEnabled
              ? "Paketi seçin, bank ödənişini tamamlayın və çeki bu səhifədən göndərin."
              : "Yeni balans ödənişləri hazırda əlçatan deyil. Mövcud sorğularınızı aşağıda izləyə bilərsiniz."}
        </p>
      </div>

      <div className="wallet-package-grid" role="radiogroup" aria-label="Coin paketi">
        {packages.map((item) => {
          const selectedPackage = item.code === selected.code;
          return (
            <button
              aria-label={`${formatAznAmount(item.amountAzn)} ₼ · ${coinAmount(item.coinAmount)}`}
              aria-checked={selectedPackage}
              className={`wallet-package ${selectedPackage ? "wallet-package--selected" : ""}`.trim()}
              disabled={!canCreate || create.isPending}
              key={item.code}
              onClick={() => setSelectedCode(item.code)}
              onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                const index = packages.findIndex((entry) => entry.code === item.code);
                const nextIndex = event.key === "Home" ? 0
                  : event.key === "End" ? packages.length - 1
                    : (index + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) + packages.length) % packages.length;
                setSelectedCode(packages[nextIndex].code);
                const radios = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
                radios?.[nextIndex]?.focus();
              }}
              role="radio"
              tabIndex={selectedPackage ? 0 : -1}
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
          aria-label={`${manualMode ? "Bank ödənişi üçün sorğu yarat" : "Epoint ilə ödəniş et"} ${formatAznAmount(selected.amountAzn)} ₼`}
          disabled={!canCreate || create.isPending}
          loading={create.isPending}
          onClick={() => create.mutate(selected.code)}
        >
          <span className="wallet-pay-button__icon" aria-hidden="true">▣</span>
          <span className="wallet-pay-button__label">
            {manualMode ? "Bank ödənişi üçün sorğu yarat" : "Epoint ilə ödəniş et"}
          </span>
          <span className="wallet-pay-button__amount">{formatAznAmount(selected.amountAzn)} ₼</span>
        </Button>
        <span>Seçilən paket: {coinAmount(selected.coinAmount)} · {formatAznAmount(selected.amountAzn)} ₼</span>
      </div>

      <p className="wallet-rate">
        {options.coinsPerAzn} coin = 1 ₼
        {options.bankCardEnabled ? " · Kart ödənişi Epoint vasitəsilə tamamlanır." : ""}
      </p>
      {create.error ? <p className="wallet-field-error" role="alert">{create.error.message}</p> : null}
      {!canCreate ? <p className="wallet-availability" role="status">Ödəniş xidməti müvəqqəti əlçatan deyil.</p> : null}

      {active ? (
        <div className="wallet-active-request" aria-live="polite">
          <div className="wallet-active-request__heading">
            <div>
              <strong>{coinAmount(active.coinAmount)} üçün {formatAznAmount(active.amountAzn)} ₼</strong>
              <small>Sorğu #{active.id} · {formatDate(active.clickedAt)}</small>
            </div>
            <span className={`wallet-status wallet-status--${statusTone(active)}`}>{topUpStatusLabel(active.status)}</span>
          </div>
          <p className="wallet-payment__note">{topUpGuidance(active)}</p>
          {active.paymentUrl ? (
            <a className="button button--primary" href={active.paymentUrl}>
              {active.paymentProvider === "manual" ? "Bank ödənişinə keç" : "Ödənişə davam et"}
            </a>
          ) : null}
          {active.paymentProvider === "manual" && active.receiptUploadOpen ? (
            <div className="wallet-receipt-upload">
              <label htmlFor={`wallet-receipt-${active.id}`}>Ödəniş çeki</label>
              <input
                id={`wallet-receipt-${active.id}`}
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
              />
              <small>PNG, JPG və ya PDF faylı seçin.</small>
              <Button
                disabled={!receipt || upload.isPending}
                loading={upload.isPending}
                onClick={() => receipt && upload.mutate({ requestId: active.id, file: receipt })}
              >
                Çeki göndər
              </Button>
            </div>
          ) : null}
          {upload.error ? <p className="wallet-field-error" role="alert">{upload.error.message}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

function statusTone(request: WalletTopUpRequest) {
  if (["PAID", "APPROVED", "VERIFIED", "AUTO_CREDITED_PENDING_REVIEW"].includes(request.status)) return "success";
  if (["PAYMENT_FAILED", "REJECTED", "FRAUD_CONFIRMED", "EXPIRED", "SUPERSEDED"].includes(request.status)) return "danger";
  return "pending";
}

function formatAznAmount(value: number) {
  return new Intl.NumberFormat("az-AZ", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
