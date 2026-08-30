import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import type { ProviderScopeType, SubscriptionReceipt } from "../../shared/api/contracts";
import { ApiError } from "../../shared/api/httpClient";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { walletApi } from "../../shared/api/walletApi";
import { Button, ButtonLink } from "../../shared/ui/Button";
import { billingLabel, money, paymentLabel, shortDate, subscriptionLabel } from "../../features/step-six/formatters";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { NotificationEvent } from "../../shared/notifications/NotificationProvider";

const SUPPORT_URL = "https://wa.me/message/P63GI5XJ3PQLC1";

export function SubscriptionPage({ scopeType }: { scopeType: ProviderScopeType }) {
  const params = useParams();
  const queryClient = useQueryClient();
  const scopeId = Number(scopeType === "BUSINESS" ? params.businessId : params.workspaceId);
  const plans = useQuery({ queryKey: ["subscription-plans", scopeType], queryFn: () => stepSixApi.plans(scopeType) });
  const current = useQuery({ queryKey: ["subscription", scopeType, scopeId], queryFn: () => stepSixApi.subscription(scopeType, scopeId), retry: false });
  const receipts = useQuery({ queryKey: ["receipts", scopeType, scopeId], queryFn: () => stepSixApi.receipts(scopeType, scopeId) });
  const wallet = useQuery({ queryKey: ["wallet-balance"], queryFn: walletApi.balance });
  const plan = plans.data?.[0];
  const shortfall = plan && wallet.data ? Math.max(0, plan.coinPrice - wallet.data.balance) : 0;
  const purchase = useMutation({
    mutationFn: () => {
      if (!plan) throw new Error("Abunəlik paketi tapılmadı.");
      return stepSixApi.purchase(scopeType, scopeId, plan.code, createIdempotencyKey());
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["subscription", scopeType, scopeId] }),
        queryClient.invalidateQueries({ queryKey: ["receipts", scopeType, scopeId] }),
        queryClient.invalidateQueries({ queryKey: ["wallet-balance"] }),
        queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] }),
      ]);
    },
  });

  usePageMeta("Abunəlik — NövbəTime", "İş sahəsinin abunəliyini coin balansı ilə idarə edin.");
  const noSubscription = current.error instanceof ApiError && current.error.status === 404;
  const needsTopUp = purchase.error instanceof ApiError && purchase.error.status === 402;

  return <div className="insight-page">
    <header className="insight-header"><div><p className="eyebrow">İş sahəsinin abunəliyi</p><h1>Aylıq planınızı coin ilə aktiv edin</h1><p>Abunə haqqı birbaşa balansınızdan çıxılır. Bank kartı yalnız balans artırmaq üçün istifadə olunacaq.</p></div></header>
    <NotificationEvent tone="error" message={!noSubscription ? current.error?.message ?? null : null} />
    <NotificationEvent tone="error" message={purchase.error?.message ?? null} action={needsTopUp ? { label: "Balansı artır", to: "/app/wallet" } : null} />
    {purchase.data ? <PurchaseSuccess coinsSpent={purchase.data.coinsSpent} balanceAfter={purchase.data.balanceAfter} reference={purchase.data.paymentReference} /> : null}
    <section className="subscription-balance" aria-labelledby="subscription-balance-title">
      <div><p className="eyebrow">Coin balansı</p><h2 id="subscription-balance-title">{wallet.data ? `${wallet.data.balance.toLocaleString("az-AZ")} coin` : "Balans yoxlanılır…"}</h2><p>Abunə ödənişi təsdiqlənən kimi balans avtomatik yenilənir.</p></div>
      <ButtonLink variant="secondary" to="/app/wallet">Balansı artır</ButtonLink>
    </section>
    {current.data ? <section className="subscription-current"><div><span className="status-badge status-badge--success">{subscriptionLabel(current.data.status)}</span><h2>{current.data.plan.name}</h2><p>{billingLabel(current.data.billingPeriod)} plan · {current.data.roomLimit} otaq · {current.data.employeeLimit} əməkdaş limiti</p></div><dl><div><dt>Başlanğıc</dt><dd>{shortDate(current.data.startsAt)}</dd></div><div><dt>Bitmə</dt><dd>{shortDate(current.data.expiresAt)}</dd></div></dl></section> : current.isPending ? <div className="management-state" role="status">Abunəlik yoxlanılır…</div> : null}
    <section aria-labelledby="plans-title"><div className="panel-heading"><div><p className="eyebrow">Aylıq plan</p><h2 id="plans-title">İş sahənizə uyğun paket</h2></div></div>{plans.isPending ? <div role="status">Plan açılır…</div> : plan ? <article className="plan-card plan-card--coin"><div><p>{billingLabel(plan.billingPeriod)}</p><h3>{plan.name}</h3><strong>{plan.coinPrice.toLocaleString("az-AZ")} coin</strong><span>{money(plan.amount, plan.currency)} ekvivalenti</span></div><ul><li>{plan.roomLimit} otağa qədər</li><li>{plan.employeeLimit} əməkdaşa qədər</li><li>Balansdan ani və təhlükəsiz ödəniş</li></ul>{shortfall > 0 ? <div className="subscription-shortfall" role="alert"><strong>{shortfall.toLocaleString("az-AZ")} coin çatmır</strong><span>Əvvəl balansınızı artırın, sonra bu səhifəyə qayıdın.</span><ButtonLink to="/app/wallet">Balansı artır</ButtonLink></div> : <Button loading={purchase.isPending} disabled={!wallet.data} onClick={() => purchase.mutate()}>{current.data ? `${plan.coinPrice} coin ilə 1 ay uzat` : `${plan.coinPrice} coin ilə aktiv et`}</Button>}{scopeType === "BUSINESS" ? <a className="plan-card__support" href={SUPPORT_URL} target="_blank" rel="noreferrer">5-dən çox otaq lazımdır? Bizimlə əlaqə saxlayın</a> : null}</article> : <div className="management-state" role="alert">Bu iş sahəsi üçün aktiv paket tapılmadı.</div>}</section>
    <ReceiptHistory receipts={receipts.data ?? []} loading={receipts.isPending} />
  </div>;
}

function PurchaseSuccess({ coinsSpent, balanceAfter, reference }: { coinsSpent: number; balanceAfter: number; reference: string }) {
  return <section className="payment-state payment-state--completed" aria-live="polite" role="status"><div><span className="payment-state__icon" aria-hidden="true">✓</span><div><p className="eyebrow">Coin ödənişi</p><h2>Abunəlik aktivləşdirildi</h2><p>{coinsSpent} coin balansdan çıxıldı. Yeni balansınız {balanceAfter} coindir.</p></div></div><dl><div><dt>Məbləğ</dt><dd>{coinsSpent} coin</dd></div><div><dt>İstinad</dt><dd>{reference}</dd></div><div><dt>Status</dt><dd>Tamamlanıb</dd></div></dl></section>;
}

function ReceiptHistory({ receipts, loading }: { receipts: SubscriptionReceipt[]; loading: boolean }) {
  return <section className="insight-panel"><p className="eyebrow">Ödəniş tarixçəsi</p><h2>Qəbzlər</h2>{loading ? <div role="status">Qəbzlər açılır…</div> : receipts.length ? <div className="receipt-list">{receipts.map((receipt) => <article key={receipt.paymentReference}><div><strong>{receipt.planCode}</strong><span>{shortDate(receipt.createdAt)} · {receipt.paymentReference}</span></div><div><b>{receipt.currency === "COIN" ? `${receipt.amount} coin` : money(receipt.amount, receipt.currency)}</b><span>{paymentLabel(receipt.status)}</span></div></article>)}</div> : <p>Hələ tamamlanmış ödəniş yoxdur.</p>}</section>;
}

function createIdempotencyKey() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `subscription-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
