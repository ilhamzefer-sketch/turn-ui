import type {
  LiveQueueEntry,
  LiveQueueEntryUpdateInput,
  LiveQueueHistoryItem,
  LiveQueueJoinInput,
  LiveQueueJoinResponse,
  LiveQueueManualEntryInput,
  LiveQueueParticipantStatus,
  LiveQueuePublic,
  LiveQueueSession,
} from "./contracts";
import { apiRequest } from "./httpClient";

export const queueApi = {
  publicRoom: (roomId: number) =>
    apiRequest<LiveQueuePublic>(`/api/public/rooms/${roomId}/live-queue`, { retryAuthentication: false }),
  publicQr: (token: string) =>
    apiRequest<LiveQueuePublic>(`/api/public/qr/${encodeURIComponent(token)}/live-queue`, { retryAuthentication: false }),
  joinGuest: (roomId: number, input: LiveQueueJoinInput) =>
    apiRequest<LiveQueueJoinResponse>(`/api/public/rooms/${roomId}/live-queue/join`, {
      method: "POST", body: JSON.stringify(input), retryAuthentication: false,
    }),
  joinGuestByQr: (token: string, input: LiveQueueJoinInput) =>
    apiRequest<LiveQueueJoinResponse>(`/api/public/qr/${encodeURIComponent(token)}/live-queue/join`, {
      method: "POST", body: JSON.stringify(input), retryAuthentication: false,
    }),
  participant: (reference: string) =>
    apiRequest<LiveQueueParticipantStatus>(`/api/public/live-queue/entries/${encodeURIComponent(reference)}`, {
      retryAuthentication: false,
    }),
  joinAccount: (roomId: number) =>
    apiRequest<LiveQueueJoinResponse>(`/api/rooms/${roomId}/live-queue/join`, { method: "POST" }),
  current: (roomId: number) => apiRequest<LiveQueueSession>(`/api/rooms/${roomId}/live-queue`),
  open: (roomId: number) => apiRequest<LiveQueueSession>(`/api/rooms/${roomId}/live-queue/open`, { method: "POST" }),
  close: (roomId: number) => apiRequest<LiveQueueSession>(`/api/rooms/${roomId}/live-queue/close`, { method: "POST" }),
  automatic: (roomId: number) => apiRequest<LiveQueueSession>(`/api/rooms/${roomId}/live-queue/automatic`, { method: "POST" }),
  reset: (roomId: number) => apiRequest<LiveQueueSession>(`/api/rooms/${roomId}/live-queue/reset`, { method: "POST" }),
  addManual: (roomId: number, input: LiveQueueManualEntryInput) =>
    apiRequest<LiveQueueEntry>(`/api/rooms/${roomId}/live-queue/entries`, { method: "POST", body: JSON.stringify(input) }),
  updateManual: (roomId: number, entryId: number, input: LiveQueueEntryUpdateInput) =>
    apiRequest<LiveQueueEntry>(`/api/rooms/${roomId}/live-queue/entries/${entryId}`, { method: "PUT", body: JSON.stringify(input) }),
  callNext: (roomId: number) => apiRequest<LiveQueueSession>(`/api/rooms/${roomId}/live-queue/call-next`, { method: "POST" }),
  completeCurrent: (roomId: number) => apiRequest<LiveQueueSession>(`/api/rooms/${roomId}/live-queue/complete-current`, { method: "POST" }),
  entryAction: (roomId: number, entryId: number, action: "skip" | "restore" | "send-to-end" | "remove") =>
    apiRequest<LiveQueueSession>(`/api/rooms/${roomId}/live-queue/entries/${entryId}/${action}`, { method: "POST" }),
  history: () => apiRequest<LiveQueueHistoryItem[]>("/api/users/me/live-queue-history"),
};
