import type { PublicRoomSearchParams } from "../../shared/api/publicApi";
import type { ReservationMode } from "../../shared/api/contracts";

function positiveInteger(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function pageNumber(value: string | null) {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function mode(value: string | null): ReservationMode | undefined {
  return value === "LIVE_QUEUE" || value === "PLANNED_BOOKING" ? value : undefined;
}

function bounded(value: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 120) : undefined;
}

export function readDiscoveryParams(searchParams: URLSearchParams): PublicRoomSearchParams {
  return {
    q: bounded(searchParams.get("q")),
    categoryId: positiveInteger(searchParams.get("categoryId")),
    city: bounded(searchParams.get("city")),
    district: bounded(searchParams.get("district")),
    mode: mode(searchParams.get("mode")),
    page: pageNumber(searchParams.get("page")),
    size: 12,
  };
}

export function withPage(searchParams: URLSearchParams, page: number) {
  const next = new URLSearchParams(searchParams);
  if (page > 0) next.set("page", String(page));
  else next.delete("page");
  return `?${next.toString()}`;
}
