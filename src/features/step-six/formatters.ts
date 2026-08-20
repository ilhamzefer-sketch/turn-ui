import type { BillingPeriod, PaymentStatus, SubscriptionStatus } from "../../shared/api/contracts";

export const dateInput = (date = new Date()) => date.toISOString().slice(0, 10);
export function daysAgo(days: number) { const value = new Date(); value.setDate(value.getDate() - days); return dateInput(value); }
export function money(amount: number, currency: string) { return new Intl.NumberFormat("az-AZ", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount); }
export function billingLabel(value: BillingPeriod) { return value === "MONTHLY" ? "Aylıq" : "İllik"; }
export function subscriptionLabel(value: SubscriptionStatus) { return ({ PENDING_PAYMENT: "Ödəniş gözləyir", ACTIVE: "Aktiv", GRACE_PERIOD: "Güzəşt müddəti", SUSPENDED: "Dayandırılıb", CANCELLED: "Ləğv edilib" } as const)[value]; }
export function paymentLabel(value: PaymentStatus) { return ({ PENDING: "Gözləyir", COMPLETED: "Tamamlanıb", FAILED: "Uğursuz", CANCELLED: "Ləğv edilib" } as const)[value]; }
export function shortDate(value: string | null) { return value ? new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium" }).format(new Date(value)) : "—"; }
