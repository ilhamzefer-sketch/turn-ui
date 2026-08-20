import { createContext } from "react";

import type { WorkspaceContext } from "../api/contracts";

export type WorkspaceStatus = "idle" | "loading" | "ready" | "error";

export type WorkspaceContextValue = {
  status: WorkspaceStatus;
  workspaces: WorkspaceContext[];
  activeWorkspace: WorkspaceContext | null;
  selectWorkspace: (workspace: WorkspaceContext) => void;
  refreshWorkspaces: () => Promise<WorkspaceContext[]>;
};

export const WorkspaceContextState = createContext<WorkspaceContextValue | null>(null);
