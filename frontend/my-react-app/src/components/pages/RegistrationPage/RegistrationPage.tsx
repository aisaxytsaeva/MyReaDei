// src/components/pages/RegistrationPage/RegistrationPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../UI/Button/Button";
import Header from "../../UI/Header/Header";
import "./RegistrationPage.css";

import { bookApi } from "../../../lib/api";

type FormData = {
  username: string;
  email: string;
  password: string;
};

const RegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      setError("Заполните все поля");
      return;
    }

    setLoading(true);

    try {
      await bookApi.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.username, // как у тебя было
      });

      setSuccess(true);
      setError("");

      window.setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (err: any) {
      const status: number | undefined = err?.response?.status;
      const detail =
        err?.response?.data?.detail ??
        err?.message ??
        "Неизвестная ошибка";

      if (status === 404) {
        setError(
          [
            "❌ Ошибка 404 - Эндпоинт не найден",
            "",
            "Что проверить:",
            "1. Запущен ли бэкенд? (uvicorn main:app --reload)",
            "2. Правильный ли URL? (http://127.0.0.1:8000/auth/register)",
            "3. Добавлен ли роутер в main.py?",
            "",
            "Откройте: http://127.0.0.1:8000/docs",
            "Проверьте наличие POST /auth/register",
          ].join("\n")
        );
      } else if (status === 422) {
        setError("❌ Ошибка валидации данных. Проверьте формат.");
      } else if (status === 400) {
        setError(
          typeof detail === "string"
            ? detail
            : "❌ Ошибка при создании пользователя"
        );
      } else if (!status) {
        // сеть / CORS / сервер недоступен
        const msg = String(detail);
        if (msg.includes("Network") || msg.includes("Failed to fetch")) {
          setError(
            [
              "❌ Не удалось подключиться к серверу",
              "",
              "Убедитесь, что:",
              "1. Бэкенд запущен: uvicorn main:app --reload",
              "2. Адрес правильный: http://127.0.0.1:8000",
              "3. Нет ошибок CORS",
              "",
              "Проверка в браузере:",
              "- Откройте http://127.0.0.1:8000",
              '- Если видите {"message":"Hello World"} - бэкенд работает',
            ].join("\n")
          );
        } else {
          setError(`❌ Ошибка: ${msg}`);
        }
      } else {
        setError(
          `❌ Ошибка ${status}: ${
            typeof detail === "string" ? detail : "Неизвестная ошибка"
          }`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-page">
      <Header />

      <div className="registration-container">
        <h2 className="registration-title">Регистрация</h2>

        {success && (
          <div
            style={{
              color: "#155724",
              backgroundColor: "#d4edda",
              border: "1px solid #c3e6cb",
              borderRadius: "5px",
              padding: "15px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            ✅ Регистрация успешна! Перенаправляем на страницу входа...
          </div>
        )}

        {error && !success && (
          <div
            style={{
              color: "#721c24",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "5px",
              padding: "15px",
              marginBottom: "20px",
              textAlign: "center",
              whiteSpace: "pre-line",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label className="form-label">Логин</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="form-input"
              placeholder="test_user"
              disabled={loading || success}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Почта</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="user@example.com"
              disabled={loading || success}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="password"
              disabled={loading || success}
              required
            />
          </div>

          <div className="button-center">
            <Button
              type="submit"
              disabled={loading || success}
              style={{ width: "460px", height: "50px" }}
            >
              {loading ? "Регистрация..." : success ? "Успешно!" : "Зарегистрироваться"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationPage;
