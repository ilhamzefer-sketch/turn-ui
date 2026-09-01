const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const SAME_ORIGIN_API_GATEWAY = "/_backend";
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const DEFAULT_REQUEST_TIMEOUT_MS = 20_000;
const DOWNLOAD_REQUEST_TIMEOUT_MS = 60_000;

type ApiRequestOptions = RequestInit & {
  retryAuthentication?: boolean;
  timeoutMs?: number;
};

type ErrorPayload = {
  code?: string;
  message?: string;
  error?: string;
};

export type ApiSessionEvent = "expired" | "signed-in" | "signed-out";

type ApiSessionListener = (event: ApiSessionEvent) => void;

export class ApiError extends Error {
  readonly status: number;
  readonly payload: ErrorPayload | null;

  constructor(status: number, message: string, payload: ErrorPayload | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

let accessToken: string | null = null;
let csrfToken: string | null = null;
let refreshPromise: Promise<string> | null = null;
const sessionListeners = new Set<ApiSessionListener>();
const SESSION_SYNC_KEY = "novbetime.session-sync";
const REFRESH_LEASE_KEY = "novbetime.refresh-lease";
const REFRESH_LEASE_MS = 8_000;

function endpoint(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : `${SAME_ORIGIN_API_GATEWAY}${path}`;
}

function methodOf(options: RequestInit) {
  return (options.method ?? "GET").toUpperCase();
}

async function readError(response: Response) {
  try {
    return (await response.json()) as ErrorPayload;
  } catch {
    return null;
  }
}

async function ensureCsrfToken() {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetchWithTimeout(endpoint("/api/auth/csrf"), {
    credentials: "include",
    headers: { Accept: "application/json" },
  }, DEFAULT_REQUEST_TIMEOUT_MS);
  captureCsrfToken(response);

  if (!response.ok) {
    const payload = await readError(response);
    throw new ApiError(response.status, payload?.message ?? "Təhlükəsizlik sessiyası yaradıla bilmədi.", payload);
  }

  const payload = (await response.json()) as { csrfToken: string };
  csrfToken = payload.csrfToken;
  return payload.csrfToken;
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = withRefreshLock(async () => {
      const token = await ensureCsrfToken();
      const response = await fetchWithTimeout(endpoint("/api/auth/refresh"), {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-CSRF-TOKEN": token,
        },
      }, DEFAULT_REQUEST_TIMEOUT_MS);
      captureCsrfToken(response);

      if (!response.ok) {
        accessToken = null;
        if (response.status === 401) {
          notifySessionListeners("expired");
          announceApiSessionChange("signed-out");
        }
        const payload = await readError(response);
        throw new ApiError(response.status, payload?.message ?? "Sessiya yenilənə bilmədi.", payload);
      }

      const payload = (await response.json()) as { accessToken: string };
      accessToken = payload.accessToken;
      return payload.accessToken;
    }).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { retryAuthentication, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, ...requestOptions } = options;
  const method = methodOf(requestOptions);
  const headers = new Headers(requestOptions.headers);
  headers.set("Accept", "application/json");

  if (requestOptions.body && !(requestOptions.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (MUTATING_METHODS.has(method)) {
    headers.set("X-CSRF-TOKEN", await ensureCsrfToken());
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetchWithTimeout(endpoint(path), {
    ...requestOptions,
    method,
    headers,
    credentials: "include",
  }, timeoutMs);
  captureCsrfToken(response);

  const mayRetry = retryAuthentication !== false && response.status === 401 && path !== "/api/auth/refresh";
  if (mayRetry) {
    await refreshAccessToken();
    return apiRequest<T>(path, { ...requestOptions, timeoutMs, retryAuthentication: false });
  }

  if (!response.ok) {
    const payload = await readError(response);
    throw new ApiError(response.status, payload?.message ?? payload?.error ?? "Sorğu yerinə yetirilmədi.", payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiBlob(path: string, retryAuthentication = true) {
  const headers = new Headers({ Accept: "*/*" });
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetchWithTimeout(endpoint(path), { headers, credentials: "include" }, DOWNLOAD_REQUEST_TIMEOUT_MS);
  captureCsrfToken(response);
  if (response.status === 401 && retryAuthentication) {
    await refreshAccessToken();
    return apiBlob(path, false);
  }
  if (!response.ok) {
    const payload = await readError(response);
    throw new ApiError(response.status, payload?.message ?? "Fayl açıla bilmədi.", payload);
  }
  return response.blob();
}

export async function apiDownload(path: string, filename: string, retryAuthentication = true) {
  const headers = new Headers({ Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetchWithTimeout(
    endpoint(path),
    { headers, credentials: "include" },
    DOWNLOAD_REQUEST_TIMEOUT_MS,
  );
  captureCsrfToken(response);
  if (response.status === 401 && retryAuthentication) {
    await refreshAccessToken();
    return apiDownload(path, filename, false);
  }
  if (!response.ok) {
    const payload = await readError(response);
    throw new ApiError(response.status, payload?.message ?? "Hesabat endirilə bilmədi.", payload);
  }
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function clearApiSession() {
  accessToken = null;
}

export function announceApiSessionChange(event: Exclude<ApiSessionEvent, "expired">) {
  try {
    localStorage.setItem(SESSION_SYNC_KEY, JSON.stringify({ event, changedAt: Date.now(), nonce: Math.random() }));
  } catch {
    return;
  }
}

export function subscribeToApiSessionChanges(listener: ApiSessionListener) {
  sessionListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== SESSION_SYNC_KEY || !event.newValue) {
      return;
    }
    try {
      const payload = JSON.parse(event.newValue) as { event?: ApiSessionEvent };
      if (payload.event === "signed-in" || payload.event === "signed-out") {
        listener(payload.event);
      }
    } catch {
      return;
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    sessionListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export async function restoreAccessToken() {
  return refreshAccessToken();
}

export function resetApiClientForTests() {
  accessToken = null;
  csrfToken = null;
  refreshPromise = null;
}

function notifySessionListeners(event: ApiSessionEvent) {
  sessionListeners.forEach((listener) => listener(event));
}

async function withRefreshLock<T>(operation: () => Promise<T>) {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("novbetime-refresh-session", operation);
  }
  return withStorageLease(operation);
}

async function withStorageLease<T>(operation: () => Promise<T>) {
  if (!supportsStorageLease()) return operation();
  const owner = `${Date.now()}-${Math.random()}`;
  const deadline = Date.now() + REFRESH_LEASE_MS;
  while (Date.now() < deadline) {
    const now = Date.now();
    const lease = readRefreshLease();
    if (!lease || lease.expiresAt <= now) {
      localStorage.setItem(REFRESH_LEASE_KEY, JSON.stringify({ owner, expiresAt: now + REFRESH_LEASE_MS }));
      if (readRefreshLease()?.owner === owner) {
        try {
          return await operation();
        } finally {
          if (readRefreshLease()?.owner === owner) localStorage.removeItem(REFRESH_LEASE_KEY);
        }
      }
    }
    await delay(75);
  }
  return operation();
}

function supportsStorageLease() {
  return typeof localStorage !== "undefined"
    && typeof localStorage.getItem === "function"
    && typeof localStorage.setItem === "function"
    && typeof localStorage.removeItem === "function";
}

function readRefreshLease() {
  try {
    const raw = localStorage.getItem(REFRESH_LEASE_KEY);
    return raw ? JSON.parse(raw) as { owner: string; expiresAt: number } : null;
  } catch {
    return null;
  }
}

function captureCsrfToken(response: Response) {
  const rotatedToken = response.headers.get("X-CSRF-TOKEN");
  if (rotatedToken) csrfToken = rotatedToken;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = init.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal;
  try {
    return await fetch(input, { ...init, signal });
  } catch (error) {
    if (timeoutSignal.aborted && !init.signal?.aborted) {
      throw new ApiError(408, "Sorğu vaxt limitini keçdi. Yenidən cəhd edin.", {
        code: "REQUEST_TIMEOUT",
        message: "Sorğu vaxt limitini keçdi. Yenidən cəhd edin.",
      });
    }
    throw error;
  }
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}
