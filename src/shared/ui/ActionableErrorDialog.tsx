import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import { Button, ButtonLink } from "./Button";

export type ErrorDialogAction = {
  label: string;
  to: string;
};

type ActionableErrorDialogProps = {
  title: string;
  message: string;
  action?: ErrorDialogAction | null;
  onClose: () => void;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function ActionableErrorDialog({ title, message, action, onClose }: ActionableErrorDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("[data-error-primary]")?.focus();

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
        className="action-error-popup__dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="action-error-title"
        aria-describedby="action-error-message action-error-guidance"
        onKeyDown={handleKeyDown}
      >
        <div className="action-error-popup__heading">
          <span className="action-error-popup__mark" aria-hidden="true">!</span>
          <div>
            <p className="eyebrow">Əməliyyat dayandırıldı</p>
            <h2 id="action-error-title">{title}</h2>
          </div>
        </div>
        <p id="action-error-message" className="action-error-popup__message">{message}</p>
        <p id="action-error-guidance" className="action-error-popup__guidance">
          {action
            ? "Problemi həll etmək üçün uyğun bölməyə keçin. Dəyişikliyi tamamladıqdan sonra bu əməliyyatı yenidən yoxlaya bilərsiniz."
            : "Məlumatları yoxlayın və əməliyyatı yenidən sınayın. Problem davam edərsə, səhifəni yeniləyib bir daha cəhd edin."}
        </p>
        <div className="action-error-popup__actions">
          {action ? (
            <ButtonLink data-error-primary to={action.to} onClick={onClose}>{action.label}</ButtonLink>
          ) : null}
          <Button data-error-primary={!action || undefined} variant="secondary" onClick={onClose}>Bağla</Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
