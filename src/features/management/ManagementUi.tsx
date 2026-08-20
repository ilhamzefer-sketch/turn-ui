import type { ReactNode } from "react";

import { ButtonLink } from "../../shared/ui/Button";

type ManagementPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function ManagementPageHeader({ eyebrow, title, description, actions }: ManagementPageHeaderProps) {
  return (
    <header className="management-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="management-heading__actions">{actions}</div> : null}
    </header>
  );
}

type StatusTone = "neutral" | "success" | "warning" | "danger";

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: StatusTone }) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>;
}

export function ManagementLoading({ label = "Məlumatlar açılır…" }: { label?: string }) {
  return (
    <div className="management-state" role="status">
      <span className="management-state__spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ManagementError({ message }: { message: string }) {
  return (
    <div className="management-state management-state--error" role="alert">
      <strong>Məlumat açıla bilmədi</strong>
      <p>{message}</p>
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
};

export function EmptyState({ title, description, actionLabel, actionTo }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state__mark" aria-hidden="true">+</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && actionTo ? <ButtonLink to={actionTo}>{actionLabel}</ButtonLink> : null}
    </div>
  );
}
