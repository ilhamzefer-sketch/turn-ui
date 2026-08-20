import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiSessionEvent } from "../api/httpClient";
import { AuthProvider } from "./AuthProvider";

const authMocks = vi.hoisted(() => ({
  restore: vi.fn(() => new Promise(() => undefined)),
  sessionListener: null as ((event: ApiSessionEvent) => void) | null,
}));

vi.mock("../api/authApi", () => ({
  authApi: {
    restore: authMocks.restore,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock("../api/httpClient", () => ({
  clearApiSession: vi.fn(),
  subscribeToApiSessionChanges: vi.fn((listener: (event: ApiSessionEvent) => void) => {
    authMocks.sessionListener = listener;
    return () => {
      authMocks.sessionListener = null;
    };
  }),
}));

describe("AuthProvider session expiry", () => {
  beforeEach(() => {
    authMocks.sessionListener = null;
    authMocks.restore.mockClear();
  });

  it("keeps active public query data when an anonymous refresh expires", async () => {
    const client = new QueryClient();
    client.setQueryData(["public-qr", "token"], { roomId: 30 });

    render(
      <QueryClientProvider client={client}>
        <AuthProvider><div>content</div></AuthProvider>
      </QueryClientProvider>,
    );

    expect(authMocks.sessionListener).not.toBeNull();
    await act(async () => authMocks.sessionListener?.("expired"));

    expect(client.getQueryData(["public-qr", "token"])).toEqual({ roomId: 30 });
  });

  it("clears cached account data after an explicit sign-out", async () => {
    const client = new QueryClient();
    client.setQueryData(["account-private"], { id: 44 });

    render(
      <QueryClientProvider client={client}>
        <AuthProvider><div>content</div></AuthProvider>
      </QueryClientProvider>,
    );

    await act(async () => authMocks.sessionListener?.("signed-out"));

    expect(client.getQueryData(["account-private"])).toBeUndefined();
  });
});
