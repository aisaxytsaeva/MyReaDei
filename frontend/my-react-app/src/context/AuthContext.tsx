import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { bookApi, type LoginResponse, type User as ApiUser } from "../lib/api";
import { parseJwt } from "../lib/jwt";

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
  refreshMe: () => Promise<void>;

  hasAnyRole: (...roles: UserRole[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "token";

function normalizeRole(raw: unknown): UserRole {
  const r = String(raw ?? "").toLowerCase();
  if (r === "admin") return "admin";
  if (r === "moderator") return "moderator";
  if (r === "user") return "user";
  if (r === "guest") return "guest";
  return "guest";
}

function getRoleFromToken(token: string | null): UserRole {
  if (!token) return "guest";
  const payload = parseJwt(token);
  if (!payload) return "guest";
  return normalizeRole(payload.role);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>(() => getRoleFromToken(localStorage.getItem(TOKEN_KEY)));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = !!token;
  const isAdmin = role === "admin";
  const isModerator = role === "moderator";
  const isModeratorOrAdmin = role === "moderator" || role === "admin";

  const hasAnyRole = (...roles: UserRole[]) => roles.includes(role);

  // Обновление роли при изменении токена
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      setRole(getRoleFromToken(token));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setRole("guest");
      setUser(null);
    }
  }, [token]);

  // Загрузка профиля при старте
  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      
      // Пробуем обновить токен через refresh
      try {
        const refreshResp = await bookApi.refresh();
        const refreshData = refreshResp.data as LoginResponse;
        if (refreshData?.access_token) {
          const newToken = refreshData.access_token;
          setToken(newToken);
          await loadProfile(newToken);
          setIsLoading(false);
          return;
        }
      } catch (refreshErr) {
        console.log("Refresh failed, trying with existing token");
      }

      // Если refresh не сработал, пробуем с существующим токеном
      if (token) {
        try {
          await loadProfile(token);
        } catch (err) {
          console.error("Failed to load profile with existing token", err);
          setToken(null);
        }
      }
      
      setIsLoading(false);
    };

    void bootstrap();
  }, []);

  const loadProfile = async (authToken: string): Promise<void> => {
    try {
      // Временно сохраняем токен для запроса
      const originalToken = localStorage.getItem(TOKEN_KEY);
      localStorage.setItem(TOKEN_KEY, authToken);
      
      // Обновляем заголовок axios через интерсептор (он сам возьмет из localStorage)
      const resp = await bookApi.getProfile();
      const profile = resp.data as UserProfile;
      
      const roleFromToken = getRoleFromToken(authToken);
      const roleFromProfile = normalizeRole(profile.role);
      const finalRole = roleFromToken !== "guest" ? roleFromToken : roleFromProfile;

      setRole(finalRole);
      setUser({ ...profile, role: finalRole });
    } catch (err) {
      console.error("Error loading profile:", err);
      throw err;
    }
  };

  const refreshMe = async (): Promise<void> => {
    if (!token) {
      setUser(null);
      setRole("guest");
      return;
    }

    try {
      const resp = await bookApi.getProfile();
      const profile = resp.data as UserProfile;
      
      const roleFromToken = getRoleFromToken(token);
      const roleFromProfile = normalizeRole(profile.role);
      const finalRole = roleFromToken !== "guest" ? roleFromToken : roleFromProfile;

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
    try {
      const resp = await bookApi.login(username, password);
      const data = resp.data as LoginResponse;

      const accessToken = data?.access_token;
      if (!accessToken) throw new Error("Сервер не вернул access_token");

      // Устанавливаем токен
      setToken(accessToken);
      localStorage.setItem(TOKEN_KEY, accessToken);
      
      // Обновляем роль из JWT
      setRole(getRoleFromToken(accessToken));
      
      // Загружаем профиль
      await loadProfile(accessToken);
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  const register = async (payload: Record<string, unknown>): Promise<void> => {
    await bookApi.register(payload);
  };

  const logout = async (): Promise<void> => {
    try {
      await bookApi.logout();
    } catch {
      // игнорируем ошибки при логауте
    } finally {
      setToken(null);
      setUser(null);
      setRole("guest");
      localStorage.removeItem(TOKEN_KEY);
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

  // Показываем загрузку при начальной загрузке
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f6dfd7'
      }}>
        <div className="loading-spinner" style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #711720',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}