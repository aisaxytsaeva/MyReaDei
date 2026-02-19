import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { bookApi, type LoginResponse } from "../lib/api";

/** Роли как на бэке */
export type UserRole = "guest" | "user" | "moderator" | "admin";

export type UserProfile = {
  id: number | string;
  username?: string;
  email?: string;

  // поля из /users/me
  book_added?: number;
  book_borrowed?: number;

  // роль может прийти из /users/me или из токена
  role?: UserRole;

  [k: string]: unknown;
};

type AuthContextValue = {
  user: UserProfile | null;
  token: string | null;
  role: UserRole;

  isAuthenticated: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isModeratorOrAdmin: boolean;

  /** обычный логин */
  login: (username: string, password: string) => Promise<void>;

  /** ручная установка сессии (нужно для твоего LoginPage.tsx) */
  setSession: (user: UserProfile, token: string) => Promise<void>;

  register: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: (overrideToken?: string) => Promise<void>;

  /** Хелпер — удобно скрывать/показывать кнопки */
  hasAnyRole: (...roles: UserRole[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "token";

/**
 * Достаём роль из JWT без валидации подписи — только для UI.
 * Истина всё равно на бэке (проверка токена).
 */
function getRoleFromJwt(token: string | null): UserRole {
  if (!token) return "guest";
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return "guest";

    // base64url -> base64
    const b64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);

    const json = atob(padded);
    const payload = JSON.parse(json) as { role?: string };

    const r = (payload.role ?? "guest").toLowerCase();
    if (r === "admin" || r === "moderator" || r === "user" || r === "guest") return r;
    return "guest";
  } catch {
    return "guest";
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>(() => getRoleFromJwt(localStorage.getItem(TOKEN_KEY)));

  const isAuthenticated = !!token;
  const isAdmin = role === "admin";
  const isModerator = role === "moderator";
  const isModeratorOrAdmin = role === "moderator" || role === "admin";

  const hasAnyRole = (...roles: UserRole[]) => roles.includes(role);

  /** Синхронизация токена в localStorage */
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      setRole(getRoleFromJwt(token));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setRole("guest");
      setUser(null);
    }
  }, [token]);

  /** Подтянуть профиль после перезагрузки страницы */
  useEffect(() => {
    if (!token) return;
    void refreshMe(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshMe = async (overrideToken?: string): Promise<void> => {
    const t = overrideToken ?? token;

    if (!t) {
      setUser(null);
      setRole("guest");
      return;
    }

    try {
      const resp = await bookApi.getProfile();
      const profile = resp.data as UserProfile;

      // роль берём приоритетно из токена
      const roleFromToken = getRoleFromJwt(t);

      // если вдруг на бэке тоже есть role — можно подхватить как запасной вариант
      const roleFromProfile = (profile.role ?? "").toString().toLowerCase() as UserRole;

      const finalRole: UserRole =
        roleFromToken !== "guest"
          ? roleFromToken
          : roleFromProfile === "admin" ||
            roleFromProfile === "moderator" ||
            roleFromProfile === "user" ||
            roleFromProfile === "guest"
          ? roleFromProfile
          : "user";

      setRole(finalRole);
      setUser({ ...profile, role: finalRole });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setToken(null);
        setUser(null);
        setRole("guest");
      } else {
        console.warn("Не удалось обновить профиль:", err?.response?.data ?? err?.message ?? err);
      }
    }
  };

  const login = async (username: string, password: string): Promise<void> => {
    const resp = await bookApi.login(username, password);
    const data = resp.data as LoginResponse;

    const accessToken = data?.access_token;
    if (!accessToken) throw new Error("Сервер не вернул access_token");

    setToken(accessToken);
    await refreshMe(accessToken);
  };

  /**
   * ВАЖНО: это то, чего тебе не хватало в LoginPage.tsx
   * Теперь можно делать: auth.setSession(userData, accessToken)
   */
  const setSession = async (u: UserProfile, t: string): Promise<void> => {
    setToken(t);

    const r = getRoleFromJwt(t);
    setRole(r === "guest" ? (u.role ?? "user") : r);
    setUser({ ...u, role: r === "guest" ? (u.role ?? "user") : r });

    // если хочешь, чтобы данные всегда синхронизировались с бэком:
    await refreshMe(t);
  };

  const register = async (payload: Record<string, unknown>): Promise<void> => {
    const resp = await bookApi.register(payload);
    const data = resp.data as any;

    const accessToken: string | undefined = data?.access_token;
    if (accessToken) {
      setToken(accessToken);
      await refreshMe(accessToken);
      return;
    }

    await refreshMe();
  };

  const logout = async (): Promise<void> => {
    try {
      await bookApi.logout();
    } catch {
      // игнор
    } finally {
      setToken(null);
      setUser(null);
      setRole("guest");
    }
  };

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      token,
      role,

      isAuthenticated,
      isAdmin,
      isModerator,
      isModeratorOrAdmin,

      login,
      setSession,
      register,
      logout,
      refreshMe,

      hasAnyRole,
    }),
    [user, token, role, isAuthenticated, isAdmin, isModerator, isModeratorOrAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
