import { useEffect, useRef } from "react";

import { Button } from "../ui/Button";

type SessionExpiryDialogProps = {
  remainingSeconds: number;
  extending: boolean;
  onContinue: () => void;
  onLogout: () => void;
};

export function SessionExpiryDialog({
  remainingSeconds,
  extending,
  onContinue,
  onLogout,
}: SessionExpiryDialogProps) {
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    continueRef.current?.focus();
  }, []);

  return (
    <div className="session-warning" role="presentation">
      <section
        className="session-warning__dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-warning-title"
        aria-describedby="session-warning-description"
      >
        <p className="eyebrow">Sessiya təhlükəsizliyi</p>
        <h2 id="session-warning-title">Sessiyanız bitmək üzrədir</h2>
        <p id="session-warning-description">
          Fəaliyyətsizlik səbəbilə {formatRemaining(remainingSeconds)} sonra avtomatik çıxış ediləcək.
        </p>
        <div className="session-warning__actions">
          <Button ref={continueRef} loading={extending} onClick={onContinue}>Sessiyanı davam etdir</Button>
          <Button variant="quiet" onClick={onLogout}>İndi çıxış et</Button>
        </div>
      </section>
    </div>
  );
}

function formatRemaining(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return minutes > 0 ? `${minutes}:${String(rest).padStart(2, "0")}` : `${rest} saniyə`;
}
