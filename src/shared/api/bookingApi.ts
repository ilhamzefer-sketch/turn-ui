import type {
  AvailableSlot,
  BookingCreateInput,
  BookingManualCreateInput,
  PlannedBooking,
} from "./contracts";
import { apiRequest } from "./httpClient";

export const bookingApi = {
  slots: (roomId: number, date: string) =>
    apiRequest<AvailableSlot[]>(`/api/public/rooms/${roomId}/available-slots?date=${encodeURIComponent(date)}`, {
      retryAuthentication: false,
    }),
  create: (input: BookingCreateInput) =>
    apiRequest<PlannedBooking>("/api/bookings", { method: "POST", body: JSON.stringify(input) }),
  get: (bookingId: number) => apiRequest<PlannedBooking>(`/api/bookings/${bookingId}`),
  history: () => apiRequest<PlannedBooking[]>("/api/users/me/bookings"),
  cancel: (bookingId: number) => apiRequest<PlannedBooking>(`/api/bookings/${bookingId}/cancel`, { method: "POST" }),
  reschedule: (bookingId: number, startAt: string) =>
    apiRequest<PlannedBooking>(`/api/bookings/${bookingId}/reschedule`, { method: "POST", body: JSON.stringify({ startAt }) }),
  roomBookings: (roomId: number, date: string) =>
    apiRequest<PlannedBooking[]>(`/api/rooms/${roomId}/bookings?date=${encodeURIComponent(date)}`),
  createManual: (roomId: number, input: BookingManualCreateInput) =>
    apiRequest<PlannedBooking>(`/api/rooms/${roomId}/bookings`, { method: "POST", body: JSON.stringify(input) }),
  complete: (roomId: number, bookingId: number) =>
    apiRequest<PlannedBooking>(`/api/rooms/${roomId}/bookings/${bookingId}/complete`, { method: "POST" }),
  noShow: (roomId: number, bookingId: number) =>
    apiRequest<PlannedBooking>(`/api/rooms/${roomId}/bookings/${bookingId}/no-show`, { method: "POST" }),
  cancelByOperator: (roomId: number, bookingId: number, reason: string) =>
    apiRequest<PlannedBooking>(`/api/rooms/${roomId}/bookings/${bookingId}/cancel`, {
      method: "POST", body: JSON.stringify({ reason, participantInformed: true }),
    }),
  rescheduleByOperator: (roomId: number, bookingId: number, startAt: string) =>
    apiRequest<PlannedBooking>(`/api/rooms/${roomId}/bookings/${bookingId}/reschedule`, {
      method: "POST", body: JSON.stringify({ startAt, participantInformed: true }),
    }),
};
