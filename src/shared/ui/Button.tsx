import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
};

type ButtonLinkProps = LinkProps & {
  children: ReactNode;
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, variant = "primary", loading = false, disabled, ...props },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      className={`button button--${variant} ${props.className ?? ""}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      type={props.type ?? "button"}
    >
      {loading ? <span className="button__spinner" aria-hidden="true" /> : null}
      <span>{loading ? "Gözləyin…" : children}</span>
    </button>
  );
});

export function ButtonLink({ children, variant = "primary", ...props }: ButtonLinkProps) {
  return (
    <Link {...props} className={`button button--${variant} ${props.className ?? ""}`.trim()}>
      {children}
    </Link>
  );
}
