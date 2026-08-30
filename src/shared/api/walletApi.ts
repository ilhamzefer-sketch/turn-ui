import type { WalletBalance, WalletTopUpOptions, WalletTransactionPage } from "./contracts";
import { apiRequest } from "./httpClient";

export const walletApi = {
  balance: () => apiRequest<WalletBalance>("/api/users/me/wallet"),
  topUpOptions: () => apiRequest<WalletTopUpOptions>("/api/users/me/wallet/top-up-options"),
  transactions: (page = 0, size = 20) => (
    apiRequest<WalletTransactionPage>(`/api/users/me/wallet/transactions?page=${page}&size=${size}`)
  ),
};
