import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  apiRequest,
  resetApiClientForTests,
  setAccessToken,
  subscribeToApiSessionChanges,
} from "./httpClient";

describe("http client", () => {
  beforeEach(() => {
    resetApiClientForTests();
    vi.restoreAllMocks();
  });

  it("fetches a CSRF token before a mutating request", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ csrfToken: "csrf-123" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await apiRequest<{ ok: boolean }>("/api/example", {
      method: "POST",
      body: JSON.stringify({ name: "Test" }),
      retryAuthentication: false,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/_backend/api/auth/csrf",
      expect.objectContaining({ credentials: "include" }),
    );
    const secondRequest = fetchMock.mock.calls[1];
    expect(secondRequest?.[0]).toBe("/_backend/api/example");
    const headers = secondRequest?.[1]?.headers as Headers;
    expect(headers.get("X-CSRF-TOKEN")).toBe("csrf-123");
  });

  it("keeps the access token in request memory", async () => {
    setAccessToken("access-123");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 200 }));

    await apiRequest<{ id: number }>("/api/users/me", { retryAuthentication: false });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/_backend/api/users/me");
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer access-123");
  });

  it("notifies the app when refresh authentication has expired", async () => {
    setAccessToken("expired-access");
    const listener = vi.fn();
    const unsubscribe = subscribeToApiSessionChanges(listener);
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Daxil olun." }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ csrfToken: "csrf-expired" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Sessiya bitib." }), { status: 401 }));

    await expect(apiRequest("/api/users/me")).rejects.toMatchObject({ status: 401 });

    expect(listener).toHaveBeenCalledWith("expired");
    unsubscribe();
  });

  it("stops a request that exceeds its configured duration", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
    }));

    const request = apiRequest("/api/slow", { retryAuthentication: false, timeoutMs: 5 });

    await expect(request).rejects.toEqual(expect.objectContaining({
      status: 408,
      message: "Sorğu vaxt limitini keçdi. Yenidən cəhd edin.",
    }));
  });
});
