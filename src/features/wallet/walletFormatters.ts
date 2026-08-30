import type { WalletTransactionType } from "../../shared/api/contracts";

const coinFormatter = new Intl.NumberFormat("az-AZ", { maximumFractionDigits: 0 });
const moneyFormatter = new Intl.NumberFormat("az-AZ", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const dateFormatter = new Intl.DateTimeFormat("az-AZ", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function coinAmount(value: number) {
  return `${coinFormatter.format(value)} coin`;
}

export function aznAmount(coins: number, coinsPerAzn: number) {
  return `${moneyFormatter.format(coins / coinsPerAzn)} ₼`;
}

export function walletTransactionLabel(type: WalletTransactionType) {
  const labels: Record<WalletTransactionType, string> = {
    ADMIN_CREDIT: "Admin tərəfindən əlavə edildi",
    TOP_UP: "Balans artırıldı",
    SUBSCRIPTION_PAYMENT: "Abunəlik ödənişi",
    REFUND: "Geri qaytarıldı",
  };
  return labels[type];
}

export function walletTransactionDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function whatsappTopUpUrl(baseUrl: string, coins: number, valueInAzn: string) {
  const separator = baseUrl.includes("?") ? "&" : "?";
  const message = `Salam. NövbəTime balansıma ${coinAmount(coins)} (${valueInAzn}) əlavə etmək istəyirəm.`;
  return `${baseUrl}${separator}text=${encodeURIComponent(message)}`;
}
