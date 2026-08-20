import { useContext } from "react";

import { WorkspaceContextState } from "./workspaceContext";

export function useWorkspace() {
  const context = useContext(WorkspaceContextState);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider.");
  }
  return context;
}
