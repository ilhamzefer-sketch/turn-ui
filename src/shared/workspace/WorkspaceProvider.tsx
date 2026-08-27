import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import type { WorkspaceContext } from "../api/contracts";
import { workspaceApi } from "../api/workspaceApi";
import { useAuth } from "../auth/useAuth";
import { WorkspaceContextState, type WorkspaceStatus } from "./workspaceContext";
import { clearWorkspaceSelection, readWorkspaceSelection, saveWorkspaceSelection } from "./workspaceSelectionStorage";

type WorkspaceProviderProps = {
  children: ReactNode;
};

function workspaceKey(workspace: WorkspaceContext) {
  return `${workspace.type}:${workspace.contextId}`;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { status: authStatus, user } = useAuth();
  const [selection, setSelection] = useState<{ userId: number; key: string } | null>(null);
  const query = useQuery({
    queryKey: ["workspaces", user?.id],
    queryFn: workspaceApi.list,
    enabled: authStatus === "authenticated" && Boolean(user),
  });

  const workspaces = useMemo(() => query.data ?? [], [query.data]);
  const selectedKey = selection && selection.userId === user?.id
    ? selection.key
    : user ? readWorkspaceSelection(user.id) : null;
  const activeWorkspace = useMemo(() => {
    const selected = selectedKey
      ? workspaces.find((workspace) => workspaceKey(workspace) === selectedKey)
      : null;
    return selected ?? workspaces.find((workspace) => workspace.type === "CUSTOMER") ?? workspaces[0] ?? null;
  }, [selectedKey, workspaces]);

  useEffect(() => {
    if (!user || !query.isSuccess || !selectedKey) return;
    if (workspaces.some((workspace) => workspaceKey(workspace) === selectedKey)) return;

    clearWorkspaceSelection(user.id);
  }, [query.isSuccess, selectedKey, user, workspaces]);

  const selectWorkspace = useCallback((workspace: WorkspaceContext) => {
    if (!user) return;
    const key = workspaceKey(workspace);
    saveWorkspaceSelection(user.id, key);
    setSelection({ userId: user.id, key });
  }, [user]);

  const refreshWorkspaces = useCallback(async () => {
    const result = await query.refetch();
    return result.data ?? [];
  }, [query]);

  let status: WorkspaceStatus = "idle";
  if (query.isPending && query.fetchStatus !== "idle") status = "loading";
  if (query.isSuccess) status = "ready";
  if (query.isError) status = "error";

  const value = useMemo(
    () => ({ status, workspaces, activeWorkspace, selectWorkspace, refreshWorkspaces }),
    [status, workspaces, activeWorkspace, selectWorkspace, refreshWorkspaces],
  );

  return <WorkspaceContextState.Provider value={value}>{children}</WorkspaceContextState.Provider>;
}
