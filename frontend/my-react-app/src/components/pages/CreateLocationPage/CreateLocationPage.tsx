import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../UI/Header/Header";
import Button from "../../UI/Button/Button";
import { useAuth } from "../../../context/AuthContext";
import { bookApi, type CreateLocationPayload } from "../../../lib/api";
import "./CreateLocationPage.css";

const CreateLocationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [name, setName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user || !token) {
      navigate("/auth");
      return;
    }

    if (!name.trim() || !address.trim()) {
      setError("Заполните название и адрес");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload: CreateLocationPayload = {
        name: name.trim(),
        address: address.trim(),
        latitude: "0",
        longitude: "0",
      };

      await bookApi.createLocation(payload);

      alert("Локация отправлена на создание!");
      navigate("/home");
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ??
        err?.message ??
        "Ошибка при создании локации";

      const msg = Array.isArray(detail)
        ? detail.map((x: any) => x?.msg || JSON.stringify(x)).join(", ")
        : String(detail);

      setError(msg);
      alert(`Ошибка: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate(-1);

  return (
    
    <div className="cl-page">
      <Header />
        
      

      <div className="cl-content">
        <div className="cl-wrapper">
          <div className="cl-pageHeader">
            <h1 className="cl-title">Создать локацию</h1>
            <div className="cl-subtitle">
              Укажите место, где можно забрать/оставить книги
            </div>
          </div>

          {!user || !token ? (
            <div className="cl-authBox">
              <h2>Нужна авторизация</h2>
              <p>Чтобы создавать локации, войдите в аккаунт.</p>
              <Button onClick={() => navigate("/auth")} style={{ marginTop: "20px" }}>
                Войти
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="cl-form">
              <div className="cl-section">
                <h3 className="cl-sectionTitle">Название</h3>
                <input
                  type="text"
                  className="cl-input"
                  placeholder="Например: Библиотека на Ленина"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="cl-section">
                <h3 className="cl-sectionTitle">Адрес *</h3>
                <input
                  type="text"
                  className="cl-input"
                  placeholder="Например: ул. Ленина, 10"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <div className="cl-error">
                  <p>{error}</p>
                </div>
              )}

              <div className="cl-actions">
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="secondary"
                  className="cl-btnCancel"
                  disabled={loading}
                >
                  Отмена
                </Button>

                <Button
                  type="submit"
                  className="cl-btnSubmit"
                  disabled={loading}
                >
                  {loading ? "Сохранение..." : "Создать"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateLocationPage;
