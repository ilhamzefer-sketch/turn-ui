import { useLocation, useNavigate } from "react-router-dom";

import { workspaceForPath, workspaceHomePath, workspaceKey, workspaceTypeLabel } from "./workspaceLabels";
import { useWorkspace } from "../../shared/workspace/useWorkspace";

export function WorkspaceSwitcher() {
  const { status, workspaces, activeWorkspace, selectWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();

  if (status === "loading") {
    return <span className="workspace-switcher__status" role="status">İş sahələri açılır…</span>;
  }

  if (status === "error") {
    return <span className="workspace-switcher__status workspace-switcher__status--error">İş sahələri açıla bilmədi</span>;
  }

  const displayedWorkspace = workspaceForPath(workspaces, location.pathname) ?? activeWorkspace;
  if (!displayedWorkspace) return null;

  return (
    <div className="workspace-switcher">
      <label htmlFor="active-workspace">Aktiv sahə</label>
      <select
        id="active-workspace"
        value={workspaceKey(displayedWorkspace)}
        onChange={(event) => {
          const next = workspaces.find((workspace) => workspaceKey(workspace) === event.target.value);
          if (next) {
            selectWorkspace(next);
            void navigate(workspaceHomePath(next));
          }
        }}
      >
        {workspaces.map((workspace) => (
          <option key={workspaceKey(workspace)} value={workspaceKey(workspace)}>
            {workspaceTypeLabel(workspace.type)} · {workspace.name}
          </option>
        ))}
      </select>
    </div>
  );
}
