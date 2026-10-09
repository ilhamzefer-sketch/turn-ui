import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiSessionEvent } from "../api/httpClient";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./useAuth";
import type { CurrentUser } from "../api/contracts";

const authMocks = vi.hoisted(() => ({
  restore: vi.fn(() => new Promise(() => undefined)),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  sessionListener: null as ((event: ApiSessionEvent) => void) | null,
}));

vi.mock("../api/authApi", () => ({
  authApi: {
    restore: authMocks.restore,
    login: authMocks.login,
    register: authMocks.register,
    logout: authMocks.logout,
  },
}));

const signedInUser: CurrentUser = {
  id: 44, firstName: "Leyla", lastName: "Məmmədova", phone: "+994501234567",
  status: "ACTIVE", createdAt: "2026-10-09T10:00:00",
};

function AuthActions() {
  const auth = useAuth();
  return <>
    <p data-testid="auth-state">{auth.status}:{auth.user?.firstName}</p>
    <button onClick={() => void auth.login({ phone: signedInUser.phone, password: "test-password" }).catch(() => undefined)}>Login</button>
    <button onClick={() => void auth.register({ firstName: "Leyla", lastName: "Məmmədova", phone: signedInUser.phone, password: "test-password" })}>Register</button>
    <button onClick={() => void auth.logout()}>Logout</button>
  </>;
}

function renderAuthActions() {
  render(<QueryClientProvider client={new QueryClient()}><AuthProvider><AuthActions /></AuthProvider></QueryClientProvider>);
}

vi.mock("./SessionLifecycleManager", () => ({ SessionLifecycleManager: () => null }));

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
    authMocks.restore.mockReset().mockImplementation(() => new Promise(() => undefined));
    authMocks.login.mockReset().mockResolvedValue(signedInUser);
    authMocks.register.mockReset().mockResolvedValue(signedInUser);
    authMocks.logout.mockReset().mockResolvedValue(undefined);
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

  it("keeps the new login when an older session restore completes", async () => {
    let finishRestore!: (user: CurrentUser) => void;
    authMocks.restore.mockImplementationOnce(() => new Promise((resolve) => { finishRestore = resolve; }));
    renderAuthActions();
    await act(async () => undefined);
    await act(async () => fireEvent.click(screen.getByText("Login")));
    expect(screen.getByTestId("auth-state")).toHaveTextContent("authenticated:Leyla");

    await act(async () => finishRestore({ ...signedInUser, firstName: "Old" }));
    expect(screen.getByTestId("auth-state")).toHaveTextContent("authenticated:Leyla");
  });

  it("keeps registration signed in when an older restore fails", async () => {
    let failRestore!: (error: Error) => void;
    authMocks.restore.mockImplementationOnce(() => new Promise((_resolve, reject) => { failRestore = reject; }));
    renderAuthActions();
    await act(async () => undefined);
    await act(async () => fireEvent.click(screen.getByText("Register")));
    await act(async () => failRestore(new Error("Old session expired")));
    expect(screen.getByTestId("auth-state")).toHaveTextContent("authenticated:Leyla");
  });

  it("does not restore a user after logout", async () => {
    let finishRestore!: (user: CurrentUser) => void;
    authMocks.restore.mockImplementationOnce(() => new Promise((resolve) => { finishRestore = resolve; }));
    renderAuthActions();
    await act(async () => undefined);
    await act(async () => fireEvent.click(screen.getByText("Logout")));
    await act(async () => finishRestore(signedInUser));
    expect(screen.getByTestId("auth-state")).toHaveTextContent("anonymous:");
  });

  it("leaves checking state when login fails during background restore", async () => {
    authMocks.login.mockRejectedValueOnce(new Error("Invalid credentials"));
    renderAuthActions();
    await act(async () => undefined);
    await act(async () => fireEvent.click(screen.getByText("Login")));
    expect(screen.getByTestId("auth-state")).toHaveTextContent("anonymous:");
  });
});
