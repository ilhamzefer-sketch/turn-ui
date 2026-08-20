import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import type { ProviderScopeType } from "../../shared/api/contracts";
import { ApiError } from "../../shared/api/httpClient";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { Button } from "../../shared/ui/Button";
import { billingLabel, money, paymentLabel, shortDate, subscriptionLabel } from "../../features/step-six/formatters";
import { usePageMeta } from "../../shared/meta/usePageMeta";

export function SubscriptionPage({ scopeType }: { scopeType: ProviderScopeType }) {
  const params = useParams();
  const scopeId = Number(scopeType === "BUSINESS" ? params.businessId : params.workspaceId);
  const plans = useQuery({ queryKey: ["subscription-plans"], queryFn: stepSixApi.plans });
  const current = useQuery({ queryKey: ["subscription", scopeType, scopeId], queryFn: () => stepSixApi.subscription(scopeType, scopeId), retry: false });
  const receipts = useQuery({ queryKey: ["receipts", scopeType, scopeId], queryFn: () => stepSixApi.receipts(scopeType, scopeId) });
  const checkout = useMutation({ mutationFn: (planCode: string) => stepSixApi.checkout(scopeType, scopeId, planCode), onSuccess: (session) => { if (session.checkoutUrl) window.location.assign(session.checkoutUrl); else void current.refetch(); } });
  usePageMeta("Abunəlik — E-Növbə", "İş sahəsinin abunəliyini və ödəniş tarixçəsini idarə edin.");
  const noSubscription = current.error instanceof ApiError && current.error.status === 404;
  return <div className="insight-page">
    <header className="insight-header"><div><p className="eyebrow">İş sahəsinin abunəliyi</p><h1>Sadə və şəffaf plan</h1><p>Ödəniş otaq əməliyyatlarını aktiv saxlayır. Kart məlumatları E-Növbədə saxlanılmır.</p></div></header>
    {current.data ? <section className="subscription-current"><div><span className="status-badge status-badge--success">{subscriptionLabel(current.data.status)}</span><h2>{current.data.plan.name}</h2><p>{billingLabel(current.data.billingPeriod)} plan · {current.data.roomLimit} otaq · {current.data.employeeLimit} əməkdaş limiti</p></div><dl><div><dt>Başlanğıc</dt><dd>{shortDate(current.data.startsAt)}</dd></div><div><dt>Bitmə</dt><dd>{shortDate(current.data.expiresAt)}</dd></div></dl></section> : current.isPending ? <div className="management-state" role="status">Abunəlik yoxlanılır…</div> : !noSubscription ? <div className="form-alert" role="alert">{current.error?.message}</div> : null}
    <section aria-labelledby="plans-title"><div className="panel-heading"><div><p className="eyebrow">Plan seçimi</p><h2 id="plans-title">Uyğun müddəti seçin</h2></div></div>{plans.isPending ? <div role="status">Planlar açılır…</div> : <div className="plan-grid">{plans.data?.map((plan) => <article key={plan.id} className="plan-card"><p>{billingLabel(plan.billingPeriod)}</p><h3>{plan.name}</h3><strong>{money(plan.amount, plan.currency)}</strong><ul><li>{plan.roomLimit} otağa qədər</li><li>{plan.employeeLimit} əməkdaşa qədər</li></ul><Button loading={checkout.isPending} onClick={() => checkout.mutate(plan.code)}>{current.data?.plan.code === plan.code ? "Planı yenilə" : "Bu planı seç"}</Button></article>)}</div>}{checkout.error ? <div className="form-alert" role="alert">{checkout.error.message}</div> : null}</section>
    <section className="insight-panel"><p className="eyebrow">Ödəniş tarixçəsi</p><h2>Qəbzlər</h2>{receipts.data?.length ? <div className="receipt-list">{receipts.data.map((receipt) => <article key={receipt.paymentId}><div><strong>{receipt.planCode}</strong><span>{shortDate(receipt.createdAt)} · {receipt.paymentReference}</span></div><div><b>{money(receipt.amount, receipt.currency)}</b><span>{paymentLabel(receipt.status)}</span></div></article>)}</div> : <p>Hələ tamamlanmış ödəniş yoxdur.</p>}</section>
  </div>;
}
