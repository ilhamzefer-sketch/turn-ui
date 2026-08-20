import type {
  AccountDeletionRequest, AdminPlatformOverview, OperationalAnalytics, OwnershipDispute, OwnershipTransfer,
  PhoneChangeRequest, ProviderScopeType, ProviderSubscription, RoomCustomerBlock, ServiceRating,
  SubscriptionPaymentSession, SubscriptionPlan, SubscriptionReceipt,
} from "./contracts";
import { apiDownload, apiRequest, setAccessToken } from "./httpClient";

const range = (from: string, to: string) => `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
const scope = (scopeType: ProviderScopeType, scopeId: number) => `scopeType=${scopeType}&scopeId=${scopeId}`;

export const stepSixApi = {
  adminLogin: async (username: string, password: string) => { const result = await apiRequest<{ username: string; role: string; message: string; accessToken: string }>("/api/admin/login", { method: "POST", body: JSON.stringify({ username, password }), retryAuthentication: false }); setAccessToken(result.accessToken); return result; },
  businessAnalytics: (id: number, from: string, to: string) => apiRequest<OperationalAnalytics>(`/api/businesses/${id}/analytics?${range(from, to)}`),
  roomAnalytics: (id: number, from: string, to: string) => apiRequest<OperationalAnalytics>(`/api/rooms/${id}/analytics?${range(from, to)}`),
  downloadBusinessAnalytics: (id: number, from: string, to: string) => apiDownload(`/api/businesses/${id}/analytics.xlsx?${range(from, to)}`, `business-${id}-operations.xlsx`),
  downloadRoomAnalytics: (id: number, from: string, to: string) => apiDownload(`/api/rooms/${id}/analytics.xlsx?${range(from, to)}`, `room-${id}-operations.xlsx`),
  plans: () => apiRequest<SubscriptionPlan[]>("/api/subscriptions/plans"),
  subscription: (type: ProviderScopeType, id: number) => apiRequest<ProviderSubscription>(`/api/subscriptions/current?${scope(type, id)}`),
  receipts: (type: ProviderScopeType, id: number) => apiRequest<SubscriptionReceipt[]>(`/api/subscriptions/receipts?${scope(type, id)}`),
  checkout: (scopeType: ProviderScopeType, scopeId: number, planCode: string) => apiRequest<SubscriptionPaymentSession>("/api/subscriptions/checkout", { method: "POST", body: JSON.stringify({ scopeType, scopeId, planCode, cardHolder: null, cardNumber: null }) }),
  confirmPayment: (id: number, token: string | null) => apiRequest<SubscriptionPaymentSession>(`/api/subscriptions/payments/${id}/confirm`, { method: "POST", headers: token ? { "X-Payment-Session-Token": token } : undefined }),
  phoneChange: (requestedPhone: string, reason: string) => apiRequest<PhoneChangeRequest>("/api/support/phone-change-requests", { method: "POST", body: JSON.stringify({ requestedPhone, reason }) }),
  deleteAccount: () => apiRequest<AccountDeletionRequest>("/api/support/account-deletion-requests", { method: "POST" }),
  transferInvitations: () => apiRequest<OwnershipTransfer[]>("/api/users/me/ownership-transfer-invitations"),
  createTransfer: (businessId: number, toAdminUserId: number) => apiRequest<OwnershipTransfer>(`/api/businesses/${businessId}/ownership-transfers`, { method: "POST", body: JSON.stringify({ toAdminUserId }) }),
  respondTransfer: (id: number, accept: boolean) => apiRequest<OwnershipTransfer>(`/api/ownership-transfers/${id}/respond?accept=${accept}`, { method: "POST" }),
  blocks: (roomId: number) => apiRequest<RoomCustomerBlock[]>(`/api/rooms/${roomId}/customer-blocks`),
  block: (roomId: number, customerUserId: number, reason: string) => apiRequest<RoomCustomerBlock>(`/api/rooms/${roomId}/customer-blocks`, { method: "POST", body: JSON.stringify({ customerUserId, reason }) }),
  revokeBlock: (roomId: number, userId: number) => apiRequest<RoomCustomerBlock>(`/api/rooms/${roomId}/customer-blocks/${userId}/revoke`, { method: "POST" }),
  rateBooking: (id: number, score: number, comment: string | null) => apiRequest<ServiceRating>(`/api/users/me/ratings/planned-bookings/${id}`, { method: "PUT", body: JSON.stringify({ score, comment }) }),
  rateLive: (id: number, score: number, comment: string | null) => apiRequest<ServiceRating>(`/api/users/me/ratings/live-queue/${id}`, { method: "PUT", body: JSON.stringify({ score, comment }) }),
  roomRatings: (roomId: number) => apiRequest<ServiceRating[]>(`/api/rooms/${roomId}/ratings`),
  adminOverview: () => apiRequest<AdminPlatformOverview>("/api/admin/overview"),
  adminDisputes: () => apiRequest<OwnershipDispute[]>("/api/admin/support/ownership-disputes"),
  adminPhoneChanges: () => apiRequest<PhoneChangeRequest[]>("/api/admin/support/phone-change-requests"),
  adminDeletions: () => apiRequest<AccountDeletionRequest[]>("/api/admin/support/account-deletion-requests"),
  resolveDispute: (id: number, action: "NO_ACTION" | "SUSPEND" | "RESET_PASSWORD" | "RESTORE_ACCESS", resolutionNote: string, reject = false) => apiRequest<OwnershipDispute>(`/api/admin/support/ownership-disputes/${id}/resolve`, { method: "POST", body: JSON.stringify({ action, resolutionNote, reject }) }),
  resolvePhoneChange: (id: number, approve: boolean, resolutionNote: string) => apiRequest<PhoneChangeRequest>(`/api/admin/support/phone-change-requests/${id}/resolve`, { method: "POST", body: JSON.stringify({ approve, resolutionNote }) }),
  resolveDeletion: (id: number, approve: boolean, resolutionNote: string) => apiRequest<AccountDeletionRequest>(`/api/admin/support/account-deletion-requests/${id}/resolve`, { method: "POST", body: JSON.stringify({ approve, resolutionNote }) }),
};
