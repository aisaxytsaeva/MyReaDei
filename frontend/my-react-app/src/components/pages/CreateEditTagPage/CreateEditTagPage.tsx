import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../UI/Header/Header";
import Button from "../../UI/Button/Button";
import { useAuth } from "../../../context/AuthContext";
import { bookApi, type CreateTagPayload, type Tag } from "../../../lib/api";
import "./CreateEditTagPage.css";

const CreateEditTagPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user, token } = useAuth();

  const isEditMode = Boolean(id);

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [tagData, setTagData] = useState<Tag | null>(null);

  useEffect(() => {
    if (isEditMode && id) {
      void fetchTagData();
    }
  }, [id]);

  const fetchTagData = async (): Promise<void> => {
    try {
      setLoadingData(true);
      setError("");
      
      const resp = await bookApi.getTagById(Number(id));
      const data = resp.data as Tag;
      
      setTagData(data);
      setName(data.tag_name);
      setDescription(data.description || "");
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.message ?? "Ошибка загрузки тега";
      const msg = Array.isArray(detail)
        ? detail.map((x: any) => x?.msg || JSON.stringify(x)).join(", ")
        : String(detail);
      setError(msg);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user || !token) {
      navigate("/auth");
      return;
    }

    if (!name.trim()) {
      setError("Введите название тега");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isEditMode && id) {
        const payload: { name?: string; description?: string } = {};
        
        if (name.trim() !== tagData?.tag_name) {
          payload.name = name.trim();
        }
        if (description.trim() !== (tagData?.description || "")) {
          payload.description = description.trim() || undefined;
        }
        
        if (Object.keys(payload).length === 0) {
          alert("Нет изменений для сохранения");
          navigate("/moderator", { replace: true });
          return;
        }
        
        await bookApi.updateTag(Number(id), payload);
        alert("Тег успешно обновлён!");
      } else {
        const payload: CreateTagPayload = {
          tag_name: name.trim(),
          description: description.trim() || undefined,
        };
        
        await bookApi.createTag(payload);
        alert("Тег успешно создан!");
      }
      
      navigate("/moderator", { replace: true });
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.message ?? "Ошибка при сохранении тега";
      const msg = Array.isArray(detail)
        ? detail.map((x: any) => x?.msg || JSON.stringify(x)).join(", ")
        : String(detail);
      setError(msg);
      alert(`Ошибка: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode && id) {
      navigate("/moderator", { replace: true });
    } else {
      navigate(-1);
    }
  };


  if (loadingData && isEditMode) {
    return (
      <>
       
        <div className="at-page">
          <Header />
          <div className="at-loading">
            <div className="at-spinner"></div>
            <p>Загрузка данных тега...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      
      
      <div className="at-page">
        <Header />

        <div className="at-content">
          <div className="at-wrapper">
            <div className="at-pageHeader">
              <h1 className="at-title">
                {isEditMode ? "Редактировать тег" : "Создать тег"}
              </h1>
              <div className="at-subtitle">
                {isEditMode 
                  ? "Измените информацию о теге" 
                  : "Добавьте новый тег для категоризации книг"}
              </div>
            </div>

            {!user || !token ? (
              <div className="at-authBox">
                <h2>Нужна авторизация</h2>
                <p>Чтобы {isEditMode ? "редактировать" : "создавать"} теги, войдите в аккаунт.</p>
                <Button onClick={() => navigate("/auth")} style={{ marginTop: "20px" }}>
                  Войти
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="at-form">
                <div className="at-section">
                  <label className="at-sectionTitle">Название тега *</label>
                  <input
                    type="text"
                    className="at-input"
                    placeholder="Например: Фантастика, Детектив, Классика..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="at-section">
                  <label className="at-sectionTitle">Описание</label>
                  <textarea
                    className="at-textarea"
                    placeholder="Добавьте описание тега"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    rows={4}
                  />
                </div>

                {error && (
                  <div className="at-error">
                    <p>{error}</p>
                  </div>
                )}

                <div className="at-actions">
                  <Button
                    type="button"
                    onClick={handleCancel}
                    variant="secondary"
                    className="at-btnCancel"
                    disabled={loading}
                  >
                    Отмена
                  </Button>

                  <Button
                    type="submit"
                    className="at-btnSubmit"
                    disabled={loading}
                  >
                    {loading 
                      ? (isEditMode ? "Сохранение..." : "Создание...") 
                      : (isEditMode ? "Сохранить изменения" : "Создать тег")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateEditTagPage;