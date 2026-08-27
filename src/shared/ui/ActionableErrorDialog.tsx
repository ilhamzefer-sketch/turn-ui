import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

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

export function ActionableErrorDialog({ title, message, action, onClose }: ActionableErrorDialogProps) {
  return <NotificationDialog tone="error" title={title} message={message} action={action} onClose={onClose} />;
}

export function NotificationDialog({ tone, title, message, action, onClose }: NotificationDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const resolvedTitle = title ?? (tone === "success" ? "Əməliyyat tamamlandı" : tone === "info" ? "Yeni bildiriş" : "Əməliyyat tamamlanmadı");
  const mark = tone === "success" ? "✓" : tone === "info" ? "i" : "!";

  useEffect(() => {
    if (tone === "error" || action) return;
    const timeoutId = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [action, onClose, tone]);

  return createPortal(
    <div className="action-error-popup">
      <section
        className={`action-error-popup__dialog action-error-popup__dialog--${tone}`}
        role={tone === "error" ? "alert" : "status"}
        aria-live={tone === "error" ? "assertive" : "polite"}
        aria-atomic="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <div className="action-error-popup__heading">
          <span className="action-error-popup__mark" aria-hidden="true">{mark}</span>
          <div>
            <h2 id={titleId}>{resolvedTitle}</h2>
            <p id={messageId} className="action-error-popup__message">{message}</p>
          </div>
          <button className="action-error-popup__close" type="button" aria-label="Bildirişi bağla" onClick={onClose}>×</button>
        </div>
        {action ? <a className="action-error-popup__action" href={action.to} onClick={onClose}>{action.label}<span aria-hidden="true"> →</span></a> : null}
      </section>
    </div>,
    document.body,
  );
}
