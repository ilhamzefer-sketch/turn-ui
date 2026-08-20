import type {
  AvailableSlot,
  PublicCategory,
  PublicRoomProfile,
  PublicQrResolution,
  PublicRoomSearchPage,
  ReservationMode,
} from "./contracts";
import { apiRequest } from "./httpClient";

export type PublicRoomSearchParams = {
  q?: string;
  categoryId?: number;
  city?: string;
  district?: string;
  mode?: ReservationMode;
  page?: number;
  size?: number;
};

function searchParams(input: PublicRoomSearchParams) {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export const publicApi = {
  categories: () => apiRequest<PublicCategory[]>("/api/public/categories", { retryAuthentication: false }),
  rooms: (input: PublicRoomSearchParams = {}) => {
    const query = searchParams(input);
    return apiRequest<PublicRoomSearchPage>(`/api/public/rooms${query ? `?${query}` : ""}`, {
      retryAuthentication: false,
    });
  },
  room: (roomId: number) =>
    apiRequest<PublicRoomProfile>(`/api/public/rooms/${roomId}`, { retryAuthentication: false }),
  resolveQr: (token: string) =>
    apiRequest<PublicQrResolution>(`/api/public/qr/${encodeURIComponent(token)}`, { retryAuthentication: false }),
  availableSlots: (roomId: number, date: string) =>
    apiRequest<AvailableSlot[]>(`/api/public/rooms/${roomId}/available-slots?date=${encodeURIComponent(date)}`, {
      retryAuthentication: false,
    }),
};
