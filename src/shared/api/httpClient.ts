const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type ApiRequestOptions = RequestInit & {
  retryAuthentication?: boolean;
};

type ErrorPayload = {
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
const SESSION_SYNC_KEY = "enovbe.session-sync";

function endpoint(path: string) {
  return `${API_BASE_URL}${path}`;
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

  const response = await fetch(endpoint("/api/auth/csrf"), {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

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
      const response = await fetch(endpoint("/api/auth/refresh"), {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-CSRF-TOKEN": token,
        },
      });

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
  const method = methodOf(options);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (MUTATING_METHODS.has(method)) {
    headers.set("X-CSRF-TOKEN", await ensureCsrfToken());
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(endpoint(path), {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  const mayRetry = options.retryAuthentication !== false && response.status === 401 && path !== "/api/auth/refresh";
  if (mayRetry) {
    await refreshAccessToken();
    return apiRequest<T>(path, { ...options, retryAuthentication: false });
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

export async function apiDownload(path: string, filename: string, retryAuthentication = true) {
  const headers = new Headers({ Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(endpoint(path), { headers, credentials: "include" });
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
    return navigator.locks.request("enovbe-refresh-session", operation);
  }
  return operation();
}
