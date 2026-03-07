import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { bookApi, type LoginResponse, type User as ApiUser } from "../lib/api";


export type UserRole = "guest" | "user" | "moderator" | "admin";

export type UserProfile = ApiUser & {
  book_added?: number;
  book_borrowed?: number;
  role?: UserRole;
};

type AuthContextValue = {
  user: UserProfile | null;
  token: string | null;
  role: UserRole;

  isAuthenticated: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isModeratorOrAdmin: boolean;

  login: (username: string, password: string) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: (overrideToken?: string) => Promise<void>;

  hasAnyRole: (...roles: UserRole[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "token";

function normalizeRole(raw: unknown): UserRole {
  const r = String(raw ?? "").toLowerCase();
  if (r === "admin" || r === "moderator" || r === "user" || r === "guest") return r;
  return "guest";
}

function getRoleFromJwt(token: string | null): UserRole {
  if (!token) return "guest";
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return "guest";

    const b64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);

    const json = atob(padded);
    const payload = JSON.parse(json) as { role?: string };

    return normalizeRole(payload.role ?? "guest");
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

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const r = await bookApi.refresh(); 
        const data = r.data as LoginResponse;
        if (data?.access_token) {
          setToken(data.access_token);
          await refreshMe(data.access_token);
          return;
        }
      } catch {

      }

      if (token) {
        await refreshMe(token);
      }
    };

    void bootstrap();

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

      const roleFromToken = getRoleFromJwt(t);
      const roleFromProfile = normalizeRole(profile.role);

      const finalRole = roleFromToken !== "guest" ? roleFromToken : roleFromProfile !== "guest" ? roleFromProfile : "user";

      setRole(finalRole);
      setUser({ ...profile, role: finalRole });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        // если и refresh не помог (interceptor в api.ts попробует сам), чистим
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

    // refresh-cookie будет выставлен на бэке через Set-Cookie
    setToken(accessToken);
    await refreshMe(accessToken);
  };

  const register = async (payload: Record<string, unknown>): Promise<void> => {
    await bookApi.register(payload);
    // регистрация сама по себе не логинит (у тебя на бэке так)
  };

  const logout = async (): Promise<void> => {
    try {
      await bookApi.logout(); // бэк отзовет refresh в redis и удалит cookie
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