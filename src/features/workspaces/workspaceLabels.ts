import type { WorkspaceContext } from "../../shared/api/contracts";

export function workspaceTypeLabel(type: WorkspaceContext["type"]) {
  switch (type) {
    case "CUSTOMER":
      return "Müştəri";
    case "INDIVIDUAL":
      return "Fərdi mütəxəssis";
    case "BUSINESS":
      return "Biznes";
    case "ROOM":
      return "Otaq sahibi";
  }
}

export function workspaceKey(workspace: WorkspaceContext) {
  return `${workspace.type}:${workspace.contextId}`;
}

export function workspaceHomePath(workspace: WorkspaceContext) {
  if (workspace.type === "BUSINESS") return `/app/businesses/${workspace.contextId}`;
  if (workspace.type === "INDIVIDUAL") return `/app/individual/${workspace.contextId}`;
  if (workspace.type === "ROOM") return `/app/rooms/${workspace.contextId}`;
  return "/app";
}

export function workspaceForPath(workspaces: WorkspaceContext[], pathname: string) {
  const businessMatch = pathname.match(/^\/app\/businesses\/(\d+)/);
  if (businessMatch) {
    return workspaces.find((workspace) => workspace.type === "BUSINESS" && workspace.contextId === Number(businessMatch[1]));
  }
  const individualMatch = pathname.match(/^\/app\/individual\/(\d+)/);
  if (individualMatch) {
    return workspaces.find((workspace) => workspace.type === "INDIVIDUAL" && workspace.contextId === Number(individualMatch[1]));
  }
  const roomMatch = pathname.match(/^\/app\/rooms\/(\d+)/);
  if (roomMatch) {
    return workspaces.find((workspace) => workspace.type === "ROOM" && workspace.contextId === Number(roomMatch[1]));
  }
  return undefined;
}
