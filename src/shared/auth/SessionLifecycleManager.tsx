import { useCallback, useEffect, useRef, useState } from "react";

import { authApi } from "../api/authApi";
import { ApiError } from "../api/httpClient";
import type { SessionInfo } from "../api/contracts";
import type { AuthStatus } from "./authContext";
import { SessionExpiryDialog } from "./SessionExpiryDialog";

const ACTIVITY_HEARTBEAT_MS = 60_000;
const WARNING_SECONDS = 120;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;

type SessionLifecycleManagerProps = {
  status: AuthStatus;
  onExpired: () => Promise<void>;
};

export function SessionLifecycleManager({ status, onExpired }: SessionLifecycleManagerProps) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [extending, setExtending] = useState(false);
  const clockOffsetRef = useRef(0);
  const lastHeartbeatRef = useRef(0);
  const expiryHandledRef = useRef(false);

  const acceptSession = useCallback((next: SessionInfo) => {
    clockOffsetRef.current = Date.parse(next.serverTime) - Date.now();
    lastHeartbeatRef.current = Date.now();
    expiryHandledRef.current = false;
    setSession(next);
  }, []);

  const expire = useCallback(async () => {
    if (expiryHandledRef.current) return;
    expiryHandledRef.current = true;
    setSession(null);
    setRemainingSeconds(null);
    await onExpired();
  }, [onExpired]);

  const extend = useCallback(async () => {
    if (extending || status !== "authenticated") return;
    setExtending(true);
    try {
      acceptSession(await authApi.activity());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) await expire();
    } finally {
      setExtending(false);
    }
  }, [acceptSession, expire, extending, status]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    let active = true;
    void authApi.session()
      .then((next) => {
        if (active) acceptSession(next);
      })
      .catch((error) => {
        if (active && error instanceof ApiError && error.status === 401) void expire();
      });
    return () => {
      active = false;
    };
  }, [acceptSession, expire, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const handleActivity = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastHeartbeatRef.current < ACTIVITY_HEARTBEAT_MS) return;
      void extend();
    };
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    return () => ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
  }, [extend, status]);

  useEffect(() => {
    if (!session || status !== "authenticated") return;
    const updateRemaining = () => {
      const serverNow = Date.now() + clockOffsetRef.current;
      const idleRemaining = Date.parse(session.idleExpiresAt) - serverNow;
      const absoluteRemaining = Date.parse(session.absoluteExpiresAt) - serverNow;
      const seconds = Math.max(0, Math.ceil(Math.min(idleRemaining, absoluteRemaining) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) void expire();
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1_000);
    return () => window.clearInterval(timer);
  }, [expire, session, status]);

  if (remainingSeconds === null || remainingSeconds > WARNING_SECONDS || status !== "authenticated") {
    return null;
  }

  return (
    <SessionExpiryDialog
      remainingSeconds={remainingSeconds}
      extending={extending}
      onContinue={() => void extend()}
      onLogout={() => void expire()}
    />
  );
}
