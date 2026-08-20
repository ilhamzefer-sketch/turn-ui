import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { authApi } from "../api/authApi";
import { clearApiSession, subscribeToApiSessionChanges } from "../api/httpClient";
import type { CurrentUser, LoginInput, RegistrationInput } from "../api/contracts";
import { AuthContext, type AuthStatus } from "./authContext";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<CurrentUser | null>(null);

  const login = useCallback(async (input: LoginInput) => {
    const currentUser = await authApi.login(input);
    queryClient.clear();
    setUser(currentUser);
    setStatus("authenticated");
    return currentUser;
  }, [queryClient]);

  const register = useCallback(async (input: RegistrationInput) => {
    const currentUser = await authApi.register(input);
    queryClient.clear();
    setUser(currentUser);
    setStatus("authenticated");
    return currentUser;
  }, [queryClient]);

  const restore = useCallback(async () => {
    setStatus("checking");
    try {
      const currentUser = await authApi.restore();
      setUser(currentUser);
      setStatus("authenticated");
      return currentUser;
    } catch {
      setUser(null);
      setStatus("anonymous");
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      queryClient.clear();
      setUser(null);
      setStatus("anonymous");
    }
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
    clearApiSession();
    queryClient.clear();
    setUser(null);
    setStatus("anonymous");
  }), [queryClient, restore]);

  const value = useMemo(
    () => ({ status, user, login, register, restore, logout }),
    [status, user, login, register, restore, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
