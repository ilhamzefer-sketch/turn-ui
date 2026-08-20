import { createContext } from "react";

import type { CurrentUser, LoginInput, RegistrationInput } from "../api/contracts";

export type AuthStatus = "idle" | "checking" | "authenticated" | "anonymous";

export type AuthContextValue = {
  status: AuthStatus;
  user: CurrentUser | null;
  login: (input: LoginInput) => Promise<CurrentUser>;
  register: (input: RegistrationInput) => Promise<CurrentUser>;
  restore: () => Promise<CurrentUser | null>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
