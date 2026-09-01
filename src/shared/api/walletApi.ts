import type { WalletBalance, WalletTopUpOptions, WalletTopUpPackageCode, WalletTopUpRequest, WalletTransactionPage } from "./contracts";
import { apiRequest } from "./httpClient";

export const walletApi = {
  balance: () => apiRequest<WalletBalance>("/api/users/me/wallet"),
  topUpOptions: () => apiRequest<WalletTopUpOptions>("/api/users/me/wallet/top-up-options"),
  createTopUpRequest: (packageCode: WalletTopUpPackageCode) => apiRequest<WalletTopUpRequest>("/api/users/me/wallet/top-up-requests", { method: "POST", body: JSON.stringify({ packageCode }) }),
  activeTopUpRequest: () => apiRequest<WalletTopUpRequest>("/api/users/me/wallet/top-up-requests/active"),
  uploadReceipt: (requestId: number, file: File) => { const body = new FormData(); body.append("file", file); return apiRequest<WalletTopUpRequest>(`/api/users/me/wallet/top-up-requests/${requestId}/receipt`, { method: "POST", body }); },
  transactions: (page = 0, size = 20) => (
    apiRequest<WalletTransactionPage>(`/api/users/me/wallet/transactions?page=${page}&size=${size}`)
  ),
};
