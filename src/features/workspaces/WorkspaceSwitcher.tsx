import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { workspaceForPath, workspaceHomePath, workspaceKey, workspaceTypeLabel } from "./workspaceLabels";
import { useWorkspace } from "../../shared/workspace/useWorkspace";

export function WorkspaceSwitcher() {
  const { status, workspaces, activeWorkspace, selectWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const routedWorkspace = workspaceForPath(workspaces, location.pathname);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const switcherRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const displayedWorkspace = routedWorkspace ?? activeWorkspace;
  const activeIndex = displayedWorkspace
    ? Math.max(0, workspaces.findIndex((workspace) => workspaceKey(workspace) === workspaceKey(displayedWorkspace)))
    : 0;

  useEffect(() => {
    if (!routedWorkspace || workspaceKey(routedWorkspace) === (activeWorkspace ? workspaceKey(activeWorkspace) : null)) return;
    selectWorkspace(routedWorkspace);
  }, [activeWorkspace, routedWorkspace, selectWorkspace]);

  function openMenu() {
    setHighlightedIndex(activeIndex);
    setIsOpen(true);
  }

  function chooseWorkspace(index: number) {
    const next = workspaces[index];
    if (!next) return;
    selectWorkspace(next);
    setIsOpen(false);
    void navigate(workspaceHomePath(next));
  }

  useEffect(() => {
    if (!isOpen) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) optionRefs.current[highlightedIndex]?.focus();
  }, [highlightedIndex, isOpen]);

  if (status === "loading") {
    return <span className="workspace-switcher__status" role="status">İş sahələri açılır…</span>;
  }

  if (status === "error") {
    return <span className="workspace-switcher__status workspace-switcher__status--error">İş sahələri açıla bilmədi</span>;
  }

  if (!displayedWorkspace) return null;

  return (
    <div className={`workspace-switcher${isOpen ? " is-open" : ""}`} ref={switcherRef}>
      <div className="workspace-switcher__select-wrap">
        <button
          type="button"
          className="workspace-switcher__trigger"
          aria-label="Aktiv iş sahəsi"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls="workspace-options"
          onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              if (!isOpen) openMenu();
              else setHighlightedIndex((current) => event.key === "ArrowDown" ? (current + 1) % workspaces.length : (current - 1 + workspaces.length) % workspaces.length);
            }
          }}
        >
          <span className={`workspace-switcher__type workspace-switcher__type--${displayedWorkspace.type.toLowerCase()}`}>{workspaceTypeLabel(displayedWorkspace.type)}</span>
          <strong>{displayedWorkspace.name}</strong>
          <span className="workspace-switcher__chevron" aria-hidden="true">⌄</span>
        </button>
        {isOpen ? <div className="workspace-switcher__menu" id="workspace-options" role="listbox" aria-label="İş sahəsi seçimi">
          <div className="workspace-switcher__menu-heading">Hesab növünü seçin</div>
          {workspaces.map((workspace, index) => {
            const selected = workspaceKey(workspace) === workspaceKey(displayedWorkspace);
            return <button
              key={workspaceKey(workspace)}
              ref={(element) => { optionRefs.current[index] = element; }}
              type="button"
              role="option"
              aria-selected={selected}
              className={`workspace-switcher__option${selected ? " is-selected" : ""}`}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => chooseWorkspace(index)}
            >
              <span className={`workspace-switcher__option-type workspace-switcher__option-type--${workspace.type.toLowerCase()}`}>{workspaceTypeLabel(workspace.type)}</span>
              <span className="workspace-switcher__option-copy"><strong>{workspace.name}</strong><small>{workspace.role === "OWNER" ? "Sahib" : "Komanda üzvü"}</small></span>
              {selected ? <span className="workspace-switcher__check" aria-hidden="true">✓</span> : null}
            </button>;
          })}
        </div> : null}
      </div>
    </div>
  );
}
