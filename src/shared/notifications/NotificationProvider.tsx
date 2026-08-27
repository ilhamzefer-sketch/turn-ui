import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { NotificationDialog, type NotificationAction, type NotificationTone } from "../ui/ActionableErrorDialog";

type NotificationInput = {
  tone: NotificationTone;
  title?: string;
  message: string;
  action?: NotificationAction | null;
};

type ActiveNotification = NotificationInput & { id: number };
type NotificationContextValue = { publish: (notification: NotificationInput) => void };

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const sequence = useRef(0);
  const [activeNotification, setActiveNotification] = useState<ActiveNotification | null>(null);
  const publish = useCallback((notification: NotificationInput) => {
    sequence.current += 1;
    setActiveNotification({ ...notification, id: sequence.current });
  }, []);
  const value = useMemo(() => ({ publish }), [publish]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {activeNotification ? (
        <NotificationDialog
          key={activeNotification.id}
          tone={activeNotification.tone}
          title={activeNotification.title}
          message={activeNotification.message}
          action={activeNotification.action}
          onClose={() => setActiveNotification(null)}
        />
      ) : null}
    </NotificationContext.Provider>
  );
}

type NotificationEventProps = {
  tone: NotificationTone;
  title?: string;
  message: string | null | undefined;
  action?: NotificationAction | null;
};

export function NotificationEvent({ tone, title, message, action }: NotificationEventProps) {
  const context = useContext(NotificationContext);
  const publishedSignature = useRef<string | null>(null);
  const actionLabel = action?.label ?? "";
  const actionTo = action?.to ?? "";
  const signature = message ? `${tone}\u0000${title ?? ""}\u0000${message}\u0000${actionLabel}\u0000${actionTo}` : null;

  useEffect(() => {
    if (!context) return;
    if (!message || !signature) {
      publishedSignature.current = null;
      return;
    }
    if (publishedSignature.current === signature) return;
    publishedSignature.current = signature;
    context.publish({ tone, title, message, action });
  }, [action, context, message, signature, title, tone]);

  return null;
}
