import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import { Button } from "./Button";

export type NotificationAction = {
  label: string;
  to: string;
};

export type ErrorDialogAction = NotificationAction;
export type NotificationTone = "success" | "error" | "info";

type ActionableErrorDialogProps = {
  title: string;
  message: string;
  action?: NotificationAction | null;
  onClose: () => void;
};

type NotificationDialogProps = {
  tone: NotificationTone;
  title?: string;
  message: string;
  action?: NotificationAction | null;
  onClose: () => void;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function ActionableErrorDialog({ title, message, action, onClose }: ActionableErrorDialogProps) {
  return <NotificationDialog tone="error" title={title} message={message} action={action} onClose={onClose} />;
}

export function NotificationDialog({ tone, title, message, action, onClose }: NotificationDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const resolvedTitle = title ?? (tone === "success" ? "Əməliyyat tamamlandı" : tone === "info" ? "Yeni bildiriş" : "Əməliyyat tamamlanmadı");
  const eyebrow = tone === "success" ? "Təsdiq bildirişi" : tone === "info" ? "Məlumat bildirişi" : "Əməliyyat dayandırıldı";
  const mark = tone === "success" ? "✓" : tone === "info" ? "i" : "!";
  const guidance = tone === "error"
    ? action
      ? "Problemi həll etmək üçün uyğun bölməyə keçin. Dəyişikliyi tamamladıqdan sonra əməliyyatı yenidən yoxlaya bilərsiniz."
      : "Məlumatları yoxlayın və əməliyyatı yenidən sınayın. Problem davam edərsə, səhifəni yeniləyib bir daha cəhd edin."
    : null;

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("[data-notification-primary]")?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return createPortal(
    <div className="action-error-popup" role="presentation" onMouseDown={handleBackdropClick}>
      <section
        ref={dialogRef}
        className={`action-error-popup__dialog action-error-popup__dialog--${tone}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="notification-title"
        aria-describedby={guidance ? "notification-message notification-guidance" : "notification-message"}
        onKeyDown={handleKeyDown}
      >
        <div className="action-error-popup__heading">
          <span className="action-error-popup__mark" aria-hidden="true">{mark}</span>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="notification-title">{resolvedTitle}</h2>
          </div>
        </div>
        <p id="notification-message" className="action-error-popup__message">{message}</p>
        {guidance ? <p id="notification-guidance" className="action-error-popup__guidance">{guidance}</p> : null}
        <div className="action-error-popup__actions">
          {action ? (
            <a className="button button--primary" data-notification-primary href={action.to} onClick={onClose}>{action.label}</a>
          ) : null}
          <Button data-notification-primary={!action || undefined} variant="secondary" onClick={onClose}>Bağla</Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
