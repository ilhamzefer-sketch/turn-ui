import type { OwnershipDispute, OwnershipDisputeInput, UserSupportRequest, UserSupportRequestPage, UserSupportRequestType } from "./contracts";
import { apiRequest } from "./httpClient";

export const supportApi = {
  createOwnershipDispute: (input: OwnershipDisputeInput) =>
    apiRequest<OwnershipDispute>("/api/support/ownership-disputes", {
      method: "POST",
      body: JSON.stringify(input),
      retryAuthentication: false,
    }),
  createRequest: (requestType: UserSupportRequestType, message: string) => apiRequest<UserSupportRequest>("/api/users/me/support-requests", { method: "POST", body: JSON.stringify({ requestType, message }) }),
  requests: (page = 0, size = 20) => apiRequest<UserSupportRequestPage>(`/api/users/me/support-requests?page=${page}&size=${size}`),
  uploadAttachment: (requestId: number, file: File) => { const body = new FormData(); body.append("file", file); return apiRequest<UserSupportRequest>(`/api/users/me/support-requests/${requestId}/attachment`, { method: "POST", body }); },
};
