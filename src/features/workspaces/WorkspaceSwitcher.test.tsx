import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

const selectWorkspace = vi.fn();

vi.mock("../../shared/workspace/useWorkspace", () => ({
  useWorkspace: () => ({
    status: "ready",
    activeWorkspace: { type: "INDIVIDUAL", contextId: 11, name: "Camal Cavadov", role: "OWNER" },
    workspaces: [
      { type: "INDIVIDUAL", contextId: 11, name: "Camal Cavadov", role: "OWNER" },
      { type: "BUSINESS", contextId: 21, name: "NövbəTime Studio", role: "OWNER" },
    ],
    selectWorkspace,
  }),
}));

describe("WorkspaceSwitcher", () => {
  beforeEach(() => vi.clearAllMocks());

  it("makes the active workspace type clear and switches through an accessible menu", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><WorkspaceSwitcher /></MemoryRouter>);

    expect(screen.getByText("Fərdi mütəxəssis")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aktiv iş sahəsi" })).toHaveTextContent("Camal Cavadov");

    await user.click(screen.getByRole("button", { name: "Aktiv iş sahəsi" }));
    expect(screen.getByRole("listbox", { name: "İş sahəsi seçimi" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /BiznesNövbəTime StudioSahib/ })).toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: /BiznesNövbəTime StudioSahib/ }));
    expect(selectWorkspace).toHaveBeenCalledWith(expect.objectContaining({ type: "BUSINESS", contextId: 21 }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
