import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { managementApi } from "../../shared/api/managementApi";
import { workspaceApi } from "../../shared/api/workspaceApi";
import { AppHomePage } from "./AppHomePage";

vi.mock("../../shared/auth/useAuth", () => ({
  useAuth: () => ({ user: { id: 7, firstName: "Elmir", lastName: "Elmirov", phone: "+994506667889", status: "ACTIVE" } }),
}));

vi.mock("../../shared/workspace/useWorkspace", () => ({
  useWorkspace: () => ({
    activeWorkspace: { type: "INDIVIDUAL", contextId: 11, name: "Elmir Studio", role: "OWNER" },
    workspaces: [{ type: "INDIVIDUAL", contextId: 11, name: "Elmir Studio", role: "OWNER" }],
    status: "ready",
  }),
}));

vi.mock("../../shared/meta/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("../../shared/api/workspaceApi", () => ({ workspaceApi: { invitations: vi.fn() } }));
vi.mock("../../shared/api/managementApi", () => ({ managementApi: { individualRooms: vi.fn() } }));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter><AppHomePage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AppHomePage", () => {
  beforeEach(() => {
    vi.mocked(workspaceApi.invitations).mockResolvedValue({ businessInvitations: [], roomInvitations: [] });
  });

  it("offers room creation when an individual workspace has no room", async () => {
    vi.mocked(managementApi.individualRooms).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByRole("link", { name: "Otaq yarat" })).toHaveAttribute("href", "/app/individual/11");
  });
});
