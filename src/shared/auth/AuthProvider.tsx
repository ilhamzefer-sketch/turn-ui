import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { authApi } from "../api/authApi";
import { clearApiSession, subscribeToApiSessionChanges } from "../api/httpClient";
import type { CurrentUser, LoginInput, RegistrationInput } from "../api/contracts";
import { AuthContext, type AuthStatus } from "./authContext";
import { SessionLifecycleManager } from "./SessionLifecycleManager";

type AuthProviderProps = {
  children: ReactNode;
};

function clearPrivateDrafts() {
  try {
    Object.keys(sessionStorage).filter((key) => key.startsWith("novbetime.room-schedule-draft.")).forEach((key) => sessionStorage.removeItem(key));
  } catch { /* Storage can be unavailable in private browsing. */ }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const sessionRevision = useRef(0);

  const login = useCallback(async (input: LoginInput) => {
    const revision = ++sessionRevision.current;
    try {
      const currentUser = await authApi.login(input);
      if (sessionRevision.current === revision) {
        queryClient.clear();
        setUser(currentUser);
        setStatus("authenticated");
      }
      return currentUser;
    } catch (error) {
      if (sessionRevision.current === revision) {
        setUser(null);
        setStatus("anonymous");
      }
      throw error;
    }
  }, [queryClient]);

  const register = useCallback(async (input: RegistrationInput) => {
    const revision = ++sessionRevision.current;
    try {
      const currentUser = await authApi.register(input);
      if (sessionRevision.current === revision) {
        queryClient.clear();
        setUser(currentUser);
        setStatus("authenticated");
      }
      return currentUser;
    } catch (error) {
      if (sessionRevision.current === revision) {
        setUser(null);
        setStatus("anonymous");
      }
      throw error;
    }
  }, [queryClient]);

  const restore = useCallback(async () => {
    const revision = ++sessionRevision.current;
    setStatus("checking");
    try {
      const currentUser = await authApi.restore();
      if (sessionRevision.current !== revision) return null;
      setUser(currentUser);
      setStatus("authenticated");
      return currentUser;
    } catch {
      if (sessionRevision.current !== revision) return null;
      setUser(null);
      setStatus("anonymous");
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    sessionRevision.current += 1;
    const logoutRequest = authApi.logout();
    clearPrivateDrafts();
    queryClient.clear();
    setUser(null);
    setStatus("anonymous");
    await logoutRequest;
  }, [queryClient]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        void restore();
      }
    });
    return () => {
      active = false;
    };
  }, [restore]);

  useEffect(() => subscribeToApiSessionChanges((event) => {
    if (event === "signed-in") {
      queryClient.clear();
      void restore();
      return;
    }
    sessionRevision.current += 1;
    clearPrivateDrafts();
    clearApiSession();
    setUser(null);
    setStatus("anonymous");
    if (event === "signed-out") {
      queryClient.clear();
    }
  }), [queryClient, restore]);

  const value = useMemo(
    () => ({ status, user, login, register, restore, logout }),
    [status, user, login, register, restore, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionLifecycleManager status={status} onExpired={logout} />
    </AuthContext.Provider>
  );
}
