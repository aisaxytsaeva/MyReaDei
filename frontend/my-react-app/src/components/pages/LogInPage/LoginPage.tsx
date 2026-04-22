import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Button from "../../UI/Button/Button";
import Header from "../../UI/Header/Header";
import { SeoManager } from "../../../components/SEO/SeoManager";
import "./LogInPage.css";


type JwtPayload = {
  user_id?: number | string;
  sub?: number | string;
  role?: string;
  [key: string]: unknown;
};

const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);

    const payloadJson = atob(padded);
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
      await authLogin(login, password);
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
    <>
      <SeoManager 
        title="Вход в аккаунт"
        description="Войдите в свой аккаунт MyReaDei для управления книгами и бронированиями"
        noIndex={true}
        noFollow={true}
      />
      
      <div className="login-page">
        <Header />

        <div className="login-container">
          <h1 className="login-title">Войти в аккаунт</h1>

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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogin(e.target.value)}
                className="form-input"
                placeholder="username"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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
    </>
  );
};

export default LoginPage;