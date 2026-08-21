import type {
  AuthenticatedUserResponse,
  CurrentUser,
  LoginInput,
  RegistrationInput,
} from "./contracts";
import {
  announceApiSessionChange,
  apiRequest,
  clearApiSession,
  restoreAccessToken,
  setAccessToken,
} from "./httpClient";

const LOGOUT_PENDING_KEY = "novbetime.logout-pending";

function setLogoutPending(pending: boolean) {
  try {
    if (pending) {
      localStorage.setItem(LOGOUT_PENDING_KEY, "true");
    } else {
      localStorage.removeItem(LOGOUT_PENDING_KEY);
    }
  } catch {
    return;
  }
}

function isLogoutPending() {
  try {
    return localStorage.getItem(LOGOUT_PENDING_KEY) === "true";
  } catch {
    return false;
  }
}

async function revokeServerSession() {
  await apiRequest<void>("/api/auth/logout", {
    method: "POST",
    retryAuthentication: false,
  });
}

function withoutToken(response: AuthenticatedUserResponse): CurrentUser {
  return {
    id: response.id,
    firstName: response.firstName,
    lastName: response.lastName,
    phone: response.phone,
    status: response.status,
    createdAt: response.createdAt,
  };
}

export const authApi = {
  async login(input: LoginInput) {
    const response = await apiRequest<AuthenticatedUserResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
      retryAuthentication: false,
    });
    setAccessToken(response.accessToken);
    setLogoutPending(false);
    announceApiSessionChange("signed-in");
    return withoutToken(response);
  },

  async register(input: RegistrationInput) {
    const response = await apiRequest<AuthenticatedUserResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
      retryAuthentication: false,
    });
    setAccessToken(response.accessToken);
    setLogoutPending(false);
    announceApiSessionChange("signed-in");
    return withoutToken(response);
  },

  async restore() {
    if (isLogoutPending()) {
      await revokeServerSession();
      setLogoutPending(false);
      throw new Error("Sessiya çıxışdan sonra bağlandı.");
    }
    await restoreAccessToken();
    return apiRequest<CurrentUser>("/api/users/me", { retryAuthentication: false });
  },

  async logout() {
    setLogoutPending(true);
    try {
      await revokeServerSession();
      setLogoutPending(false);
    } catch {
      setLogoutPending(true);
    } finally {
      clearApiSession();
      announceApiSessionChange("signed-out");
    }
  },
};
