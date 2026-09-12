import type { WalletTopUpRequest, WalletTopUpRequestStatus } from "../../shared/api/contracts";

const PAID = new Set<WalletTopUpRequestStatus>(["PAID", "APPROVED", "VERIFIED"]);
const FAILED = new Set<WalletTopUpRequestStatus>([
  "PAYMENT_FAILED",
  "SUPERSEDED",
  "REJECTED",
  "FRAUD_CONFIRMED",
  "EXPIRED",
]);

export function isPaidTopUp(status: WalletTopUpRequestStatus) {
  return PAID.has(status);
}

export function isFailedTopUp(status: WalletTopUpRequestStatus) {
  return FAILED.has(status);
}

export function isTerminalTopUp(status: WalletTopUpRequestStatus) {
  return isPaidTopUp(status) || isFailedTopUp(status);
}

export function topUpStatusLabel(status: WalletTopUpRequestStatus) {
  return ({
    AWAITING_RECEIPT: "Ödəniş gözlənilir",
    PENDING_REVIEW: "Çek yoxlanılır",
    MANUAL_REVIEW: "Admin təsdiqi gözlənilir",
    AUTO_CREDITED_PENDING_REVIEW: "Coin əlavə edildi, çek yoxlanılır",
    APPROVED: "Təsdiqləndi",
    VERIFIED: "Ödəniş yoxlanıldı",
    PAID: "Ödəniş tamamlandı",
    PAYMENT_FAILED: "Ödəniş alınmadı",
    SUPERSEDED: "Yeni sorğu ilə əvəz edildi",
    REJECTED: "Çek rədd edildi",
    FRAUD_CONFIRMED: "Fırıldaq təsdiqləndi",
    EXPIRED: "Sorğunun vaxtı bitdi",
  } satisfies Record<WalletTopUpRequestStatus, string>)[status];
}

export function topUpGuidance(request: WalletTopUpRequest) {
  if (request.status === "PAID" || request.status === "APPROVED" || request.status === "VERIFIED") {
    return "Ödəniş server tərəfindən təsdiqləndi və coin balansınıza əlavə edildi.";
  }
  if (request.status === "AUTO_CREDITED_PENDING_REVIEW") {
    return "Coin balansınıza əlavə edildi. Admin çekinizi ayrıca yoxlayacaq.";
  }
  if (request.status === "PENDING_REVIEW" || request.status === "MANUAL_REVIEW") {
    return "Çekiniz qəbul edildi. Yoxlama tamamlanana qədər bu sorğunu açıq saxlayırıq.";
  }
  if (request.status === "PAYMENT_FAILED") {
    return "Epoint ödənişi uğursuz kimi bildirdi. Yeni ödəniş yarada bilərsiniz.";
  }
  if (request.status === "SUPERSEDED") {
    return "Bu sorğu daha yeni ödəniş sorğusu ilə əvəz edilib.";
  }
  if (request.status === "REJECTED" || request.status === "FRAUD_CONFIRMED") {
    return "Bu çek təsdiqlənmədi. Dəstək lazım olsa, bizimlə əlaqə saxlayın.";
  }
  if (request.status === "EXPIRED") {
    return "Bu sorğunun vaxtı bitib. Yeni ödəniş yarada bilərsiniz.";
  }
  if (request.checkoutState === "PREPARING") {
    return "Təhlükəsiz ödəniş keçidi hazırlanır. Səhifəni bağlamadan bir az gözləyin.";
  }
  if (request.checkoutState === "UNKNOWN") {
    return "Ödəniş keçidinin nəticəsi hələ məlum deyil. Təkrar ödəniş yaratmırıq; nəticəni yoxlayırıq.";
  }
  return request.paymentProvider === "manual"
    ? "Bank ödənişini tamamladıqdan sonra çeki aşağıdan göndərin."
    : "Ödəniş tamamlandıqdan sonra nəticə server tərəfindən yoxlanacaq.";
}
