const WORKSPACE_SELECTION_PREFIX = "novbetime.active-workspace";
const WORKSPACE_KEY_PATTERN = /^(CUSTOMER|INDIVIDUAL|BUSINESS|ROOM):[1-9]\d*$/;

export function workspaceSelectionStorageKey(userId: number) {
  return `${WORKSPACE_SELECTION_PREFIX}:${userId}`;
}

export function readWorkspaceSelection(userId: number) {
  try {
    const value = window.localStorage.getItem(workspaceSelectionStorageKey(userId))?.trim() ?? "";
    return WORKSPACE_KEY_PATTERN.test(value) ? value : null;
  } catch {
    return null;
  }
}

export function saveWorkspaceSelection(userId: number, workspaceKey: string) {
  if (!WORKSPACE_KEY_PATTERN.test(workspaceKey)) return;
  try {
    window.localStorage.setItem(workspaceSelectionStorageKey(userId), workspaceKey);
  } catch {
    return;
  }
}

export function clearWorkspaceSelection(userId: number) {
  try {
    window.localStorage.removeItem(workspaceSelectionStorageKey(userId));
  } catch {
    return;
  }
}
