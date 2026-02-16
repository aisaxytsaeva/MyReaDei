import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { bookApi, type User, type RegisterResponse } from "../lib/api";

export type RegisterResult =
  | { success: true }
  | { success: false; error: string };

export type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isDemoMode: boolean;
  isAuthenticated: boolean;

  /** token=null => demo mode */
  login: (userData: User, token?: string | null) => void;
  logout: () => Promise<void>;

  register: (userData: Record<string, unknown>) => Promise<RegisterResult>;

  /** можно дернуть вручную, если нужно */
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    void checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async (): Promise<void> => {
    try {
      setLoading(true);

      const storedToken = localStorage.getItem("token");
      const demoMode = localStorage.getItem("demo_mode");
      const storedUser = localStorage.getItem("user");

      // demo mode
      if (demoMode === "true" && storedUser) {
        setIsDemoMode(true);
        setToken(null);
        setUser(JSON.parse(storedUser) as User);
        return;
      }

      // normal mode
      if (storedToken) {
        setToken(storedToken);
        setIsDemoMode(false);

        try {
          const response = await bookApi.getProfile();
          setUser(response.data); // User типизирован в api.ts
          localStorage.setItem("user", JSON.stringify(response.data));
        } catch (profileError) {
          console.error("Ошибка получения профиля:", profileError);
          // fallback: если есть сохраненный user
          if (storedUser) setUser(JSON.parse(storedUser) as User);
        }
      } else {
        setToken(null);
        setUser(null);
        setIsDemoMode(false);
      }
    } catch (error) {
      console.error("Ошибка проверки аутентификации:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("demo_mode");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
      setIsDemoMode(false);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: User, newToken: string | null = null): void => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    if (newToken) {
      setToken(newToken);
      localStorage.setItem("token", newToken);
      localStorage.removeItem("demo_mode");
      setIsDemoMode(false);
    } else {
      // demo
      setToken(null);
      localStorage.removeItem("token");
      localStorage.setItem("demo_mode", "true");
      setIsDemoMode(true);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (!isDemoMode) {
        await bookApi.logout();
      }
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("demo_mode");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
      setIsDemoMode(false);
    }
  };

  const register = async (
    userData: Record<string, unknown>
  ): Promise<RegisterResult> => {
    try {
      const response = await bookApi.register(userData);
      const data: RegisterResponse = response.data;

      setToken(data.access_token);
      localStorage.setItem("token", data.access_token);

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));

      localStorage.removeItem("demo_mode");
      setIsDemoMode(false);

      return { success: true };
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as any).response?.data?.detail === "string"
          ? (error as any).response.data.detail
          : "Ошибка регистрации";

      return { success: false, error: message };
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isDemoMode,
    isAuthenticated: !!user && !!token && !isDemoMode,

    login,
    logout,
    register,

    refreshAuth: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
