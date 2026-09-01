import type {
  AccountDeletionRequest, AdminAccount, AdminBusiness, AdminBusinessPage, AdminPlatformOverview, AdminUserPage,
  OperationalAnalytics, OwnershipDispute, OwnershipTransfer,
  PhoneChangeRequest, ProviderScopeType, ProviderSubscription, RoomCustomerBlock, ServiceRating,
  SubscriptionCoinPurchase, SubscriptionPlan, SubscriptionReceipt, WalletTransaction, AdminTopUpRequestPage, AdminSupportRequestPage, AdminSupportRequest, AdminTopUpRequest,
} from "./contracts";
import { apiBlob, apiDownload, apiRequest, setAccessToken } from "./httpClient";

const range = (from: string, to: string) => `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
const scope = (scopeType: ProviderScopeType, scopeId: number) => `scopeType=${scopeType}&scopeId=${scopeId}`;

export const stepSixApi = {
  adminLogin: async (username: string, password: string) => { const result = await apiRequest<{ username: string; role: string; message: string; mustChangeCredentials: boolean; accessToken: string }>("/api/admin/login", { method: "POST", body: JSON.stringify({ username, password }), retryAuthentication: false }); setAccessToken(result.accessToken); return result; },
  adminChangeRequiredCredentials: async (currentPassword: string, newUsername: string, newPassword: string) => { const result = await apiRequest<{ username: string; role: string; message: string; mustChangeCredentials: boolean; accessToken: string }>("/api/admin/credentials", { method: "PUT", body: JSON.stringify({ currentPassword, newUsername, newPassword }) }); setAccessToken(result.accessToken); return result; },
  businessAnalytics: (id: number, from: string, to: string) => apiRequest<OperationalAnalytics>(`/api/businesses/${id}/analytics?${range(from, to)}`),
  roomAnalytics: (id: number, from: string, to: string) => apiRequest<OperationalAnalytics>(`/api/rooms/${id}/analytics?${range(from, to)}`),
  downloadBusinessAnalytics: (id: number, from: string, to: string) => apiDownload(`/api/businesses/${id}/analytics.xlsx?${range(from, to)}`, `business-${id}-operations.xlsx`),
  downloadRoomAnalytics: (id: number, from: string, to: string) => apiDownload(`/api/rooms/${id}/analytics.xlsx?${range(from, to)}`, `room-${id}-operations.xlsx`),
  plans: (type: ProviderScopeType) => apiRequest<SubscriptionPlan[]>(`/api/subscriptions/plans?scopeType=${type}`),
  subscription: (type: ProviderScopeType, id: number) => apiRequest<ProviderSubscription>(`/api/subscriptions/current?${scope(type, id)}`),
  receipts: (type: ProviderScopeType, id: number) => apiRequest<SubscriptionReceipt[]>(`/api/subscriptions/receipts?${scope(type, id)}`),
  purchase: (scopeType: ProviderScopeType, scopeId: number, planCode: string, idempotencyKey: string) => apiRequest<SubscriptionCoinPurchase>("/api/subscriptions/purchase", { method: "POST", body: JSON.stringify({ scopeType, scopeId, planCode, idempotencyKey }) }),
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
  adminUsers: (search = "", page = 0) => apiRequest<AdminUserPage>(`/api/admin/users?search=${encodeURIComponent(search)}&page=${page}&size=20`),
  adminCreditCoins: (userId: number, amount: number, reason: string, idempotencyKey: string) => apiRequest<WalletTransaction>(`/api/admin/users/${userId}/coins`, { method: "POST", body: JSON.stringify({ amount, reason, idempotencyKey }) }),
  adminChangeUserPassword: (userId: number, newPassword: string, reason: string) => apiRequest<void>(`/api/admin/users/${userId}/password`, { method: "PUT", body: JSON.stringify({ newPassword, reason }) }),
  adminBusinesses: (search = "", page = 0) => apiRequest<AdminBusinessPage>(`/api/admin/businesses?search=${encodeURIComponent(search)}&page=${page}&size=20`),
  adminIncreaseRoomLimit: (businessId: number, roomLimit: number, reason: string) => apiRequest<AdminBusiness>(`/api/admin/businesses/${businessId}/room-limit`, { method: "PUT", body: JSON.stringify({ roomLimit, reason }) }),
  adminAccounts: () => apiRequest<AdminAccount[]>("/api/admin/admins"),
  adminCreateAccount: (username: string, displayName: string, password: string) => apiRequest<AdminAccount>("/api/admin/admins", { method: "POST", body: JSON.stringify({ username, displayName, password }) }),
  adminDisputes: () => apiRequest<OwnershipDispute[]>("/api/admin/support/ownership-disputes"),
  adminPhoneChanges: () => apiRequest<PhoneChangeRequest[]>("/api/admin/support/phone-change-requests"),
  adminDeletions: () => apiRequest<AccountDeletionRequest[]>("/api/admin/support/account-deletion-requests"),
  adminTopUps: (status = "PENDING_REVIEW", page = 0) => apiRequest<AdminTopUpRequestPage>(`/api/admin/payments/top-ups?status=${status}&page=${page}&size=20`),
  adminTopUpReceipt: (id: number) => apiBlob(`/api/admin/payments/top-ups/${id}/receipt`),
  approveTopUp: (id: number, note = "") => apiRequest<AdminTopUpRequest>(`/api/admin/payments/top-ups/${id}/approve`, { method: "POST", body: JSON.stringify({ note }) }),
  rejectTopUp: (id: number, reason: string) => apiRequest<AdminTopUpRequest>(`/api/admin/payments/top-ups/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
  adminSupportRequests: (requestType = "", status = "", page = 0) => {
    const params = new URLSearchParams({ page: String(page), size: "20" });
    if (requestType) params.set("requestType", requestType);
    if (status) params.set("status", status);
    return apiRequest<AdminSupportRequestPage>(`/api/admin/support-requests?${params}`);
  },
  adminSupportAttachment: (id: number) => apiBlob(`/api/admin/support-requests/${id}/attachment`),
  reviewSupportRequest: (id: number, status: "IN_REVIEW" | "RESOLVED" | "REJECTED", response: string) => apiRequest<AdminSupportRequest>(`/api/admin/support-requests/${id}/review`, { method: "POST", body: JSON.stringify({ status, response }) }),
  resolveDispute: (id: number, action: "NO_ACTION" | "SUSPEND" | "RESET_PASSWORD" | "RESTORE_ACCESS", resolutionNote: string, reject = false) => apiRequest<OwnershipDispute>(`/api/admin/support/ownership-disputes/${id}/resolve`, { method: "POST", body: JSON.stringify({ action, resolutionNote, reject }) }),
  resolvePhoneChange: (id: number, approve: boolean, resolutionNote: string) => apiRequest<PhoneChangeRequest>(`/api/admin/support/phone-change-requests/${id}/resolve`, { method: "POST", body: JSON.stringify({ approve, resolutionNote }) }),
  resolveDeletion: (id: number, approve: boolean, resolutionNote: string) => apiRequest<AccountDeletionRequest>(`/api/admin/support/account-deletion-requests/${id}/resolve`, { method: "POST", body: JSON.stringify({ approve, resolutionNote }) }),
};
