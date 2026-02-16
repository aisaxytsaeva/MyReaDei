import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Button from "../../UI/Button/Button";
import Header from "../../UI/Header/Header";
import "./LogInPage.css";

import { bookApi, type User, type LoginResponse } from "../../../lib/api";

type JwtPayload = {
  user_id?: number | string;
  sub?: number | string;
  [key: string]: unknown;
};

const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadJson = atob(parts[1]);
    return JSON.parse(payloadJson) as JwtPayload;
  } catch {
    return null;
  }
};

const LoginPage: React.FC = () => {
  const [login, setLogin] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");

    if (!login.trim() || !password.trim()) {
      setError("Заполните все поля");
      return;
    }

    setLoading(true);

    try {
      // 1) логин
      const resp = await bookApi.login(login, password);
      const data: LoginResponse = resp.data;

      const accessToken = data.access_token;
      if (!accessToken) {
        setError("Сервер не вернул токен");
        return;
      }

      // Сохраняем токен (интерцептор axios будет брать его отсюда)
      localStorage.setItem("token", accessToken);

      // 2) профиль
      let userData: User | null = null;

      try {
        const profileResp = await bookApi.getProfile();
        const profile = profileResp.data;

        userData = {
          ...profile,
          id: profile.id,
          username: (profile as any).username ?? login,
          email: (profile as any).email ?? `${login}@example.com`,
          name: (profile as any).username ?? login,
          
        };
      } catch {
        // fallback: пробуем достать id из JWT
        const payload = decodeJwtPayload(accessToken);
        const idFromToken = payload?.user_id ?? payload?.sub ?? 1;

        userData = {
          id: idFromToken,
          username: login,
          email: `${login}@example.com`,
          name: login,
        };
      }

      // 3) кладём user + token в контекст
      authLogin(userData, accessToken);

      // 4) переход
      navigate("/home");
    } catch (err: any) {
      const status: number | undefined = err?.response?.status;

      if (status === 401) setError("Неверный логин или пароль");
      else if (status === 422) setError("Ошибка в данных");
      else if (status === 404) setError("Сервис временно недоступен");
      else setError(status ? `Ошибка ${status}` : "Ошибка подключения к серверу");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Header />

      <div className="login-container">
        <h2 className="login-title">Войти в аккаунт</h2>

        {error && (
          <div
            style={{
              color: "#721c24",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "5px",
              padding: "15px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Логин</label>
            <input
              type="text"
              value={login}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLogin(e.target.value)
              }
              className="form-input"
              placeholder="test_user"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              className="form-input"
              placeholder="password"
              disabled={loading}
              required
            />
          </div>

          <div className="button-center">
            <Button type="submit" className="fixed-width" disabled={loading}>
              {loading ? "Вход..." : "Войти"}
            </Button>
          </div>
        </form>

        <div className="button-center">
          <Button to="/registration" className="fixed-width">
            Зарегистрироваться
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
