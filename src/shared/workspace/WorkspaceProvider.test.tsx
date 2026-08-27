import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkspaceContext } from "../api/contracts";
import { WorkspaceProvider } from "./WorkspaceProvider";
import { useWorkspace } from "./useWorkspace";
import { workspaceSelectionStorageKey } from "./workspaceSelectionStorage";

const user = { id: 44, firstName: "Leyla", lastName: "Məmmədova" };
const workspaces: WorkspaceContext[] = [
  { type: "CUSTOMER", contextId: 44, name: "Leyla Məmmədova", role: "CUSTOMER" },
  { type: "BUSINESS", contextId: 10, name: "Sakit Studio", role: "PRIMARY_OWNER" },
];

const workspaceMocks = vi.hoisted(() => ({
  list: vi.fn(),
}));
const storageValues = new Map<string, string>();
const testStorage: Storage = {
  get length() { return storageValues.size; },
  clear: () => storageValues.clear(),
  getItem: (key) => storageValues.get(key) ?? null,
  key: (index) => Array.from(storageValues.keys())[index] ?? null,
  removeItem: (key) => { storageValues.delete(key); },
  setItem: (key, value) => { storageValues.set(key, value); },
};

vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({ status: "authenticated", user }),
}));

vi.mock("../api/workspaceApi", () => ({
  workspaceApi: { list: workspaceMocks.list },
}));

function WorkspaceProbe() {
  const { activeWorkspace, workspaces: availableWorkspaces, selectWorkspace } = useWorkspace();
  const business = availableWorkspaces.find((workspace) => workspace.type === "BUSINESS");

  return (
    <div>
      <span>{activeWorkspace ? `${activeWorkspace.type}:${activeWorkspace.contextId}` : "none"}</span>
      <button type="button" disabled={!business} onClick={() => business && selectWorkspace(business)}>Biznesi seç</button>
    </div>
  );
}

function renderProvider() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <WorkspaceProvider><WorkspaceProbe /></WorkspaceProvider>
    </QueryClientProvider>,
  );
}

describe("WorkspaceProvider", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { configurable: true, value: testStorage });
    window.localStorage.clear();
    workspaceMocks.list.mockReset();
    workspaceMocks.list.mockResolvedValue(workspaces);
  });

  it("restores the selected workspace after the provider is remounted", async () => {
    const firstRender = renderProvider();
    expect(await screen.findByText("CUSTOMER:44")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Biznesi seç" }));
    expect(await screen.findByText("BUSINESS:10")).toBeInTheDocument();
    firstRender.unmount();

    renderProvider();
    expect(await screen.findByText("BUSINESS:10")).toBeInTheDocument();
  });

  it("discards a saved workspace when the user no longer has access", async () => {
    window.localStorage.setItem(workspaceSelectionStorageKey(user.id), "BUSINESS:999");

    renderProvider();

    expect(await screen.findByText("CUSTOMER:44")).toBeInTheDocument();
    await waitFor(() => expect(window.localStorage.getItem(workspaceSelectionStorageKey(user.id))).toBeNull());
  });
});
