import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Header from "../../UI/Header/Header";
import Button from "../../UI/Button/Button";
import { bookApi, type Tag } from "../../../lib/api";
import "./ModeratorPage.css";

const ModeratorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const role = (user as any)?.role as string | undefined;
  const isModerator = role === "moderator";

  useEffect(() => {
    if (!user || !token) {
      navigate("/auth");
      return;
    }
    
    if (!isModerator) {
      setError("У вас нет прав доступа к этой странице");
      return;
    }
    
    void fetchTags();
  }, [user, token]);

  useEffect(() => {
    const state = location.state as { fromEdit?: boolean };
    if (state?.fromEdit) {
      void fetchTags();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);

  const fetchTags = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      const resp = await bookApi.getTags(0, 200);
      setTags(resp.data as Tag[]);
    } catch (err: any) {
      console.error("Ошибка загрузки тегов:", err);
      setError("Не удалось загрузить список тегов");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = (): void => {
    navigate("/tags/create");
  };

  const handleEditTag = (tagId: number): void => {
    navigate(`/tags/edit/${tagId}`, { state: { fromModerator: true } });
  };

  const handleDeleteTag = async (tagId: number, tagName: string): Promise<void> => {
    if (!window.confirm(`Вы уверены, что хотите удалить тег "${tagName}"?`)) {
      return;
    }
    
    try {
      setDeletingId(tagId);
      await bookApi.deleteTag(tagId);
      alert("Тег успешно удалён!");
      await fetchTags();
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.message ?? "Ошибка удаления";
      const msg = typeof detail === "object" ? JSON.stringify(detail) : String(detail);
      alert(`Ошибка: ${msg}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleGoBack = (): void => {
    navigate("/home");
  };

  if (!user || !token) {
    return null;
  }

  if (!isModerator) {
    return (
      <>
        
        <div className="tm-page">
          <Header />
          <div className="tm-content">
            <div className="tm-error">
              <h2>Доступ запрещён</h2>
              <p>{error || "У вас нет прав доступа к этой странице"}</p>
              <Button onClick={() => navigate("/home")} className="tm-back-btn">
                Вернуться на главную
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      
      <div className="tm-page">
        <Header />
        
        <div className="tm-content">
          <div className="tm-container">
            <div className="tm-header">
              <div className="tm-header-left">
                <button onClick={handleGoBack} className="tm-back-button" aria-label="Назад">
                  ← Назад
                </button>
                <h1 className="tm-title">Управление тегами</h1>
              </div>
              <div className="tm-stats">
                <span className="tm-stats-count">Всего тегов: {tags.length}</span>
              </div>
            </div>

            <div className="tm-description">
              <p>Здесь вы можете создавать, редактировать и удалять теги для книг.</p>
            </div>

            {error && (
              <div className="tm-error-message">
                <p>{error}</p>
                <button onClick={fetchTags} className="tm-retry-btn">Повторить</button>
              </div>
            )}

            {loading ? (
              <div className="tm-loading">
                <div className="tm-spinner"></div>
                <p>Загрузка тегов...</p>
              </div>
            ) : tags.length === 0 ? (
              <div className="tm-empty">
                <h3>Нет тегов</h3>
                <p>Создайте первый тег, чтобы начать категоризацию книг</p>
                <button onClick={handleCreateTag} className="tm-empty-create-btn">
                  + Создать тег
                </button>
              </div>
            ) : (
              <div className="tm-tags-grid">
                {tags.map((tag) => (
                  <div key={tag.id} className="tm-tag-card">
                    <div className="tm-tag-content">
                      <div className="tm-tag-info">
                        <h3 className="tm-tag-name">{tag.tag_name}</h3>
                        {tag.description && (
                          <p className="tm-tag-description">{tag.description}</p>
                        )}
                      </div>
                      <div className="tm-tag-actions">
                        <button
                          onClick={() => handleEditTag(tag.id)}
                          className="tm-edit-btn"
                          aria-label="Редактировать"
                          disabled={deletingId === tag.id}
                        >
                          <img
                            src="/assets/edit.svg"
                            alt="Редактировать"
                            className="delete-icon"
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              const img = e.currentTarget;
                              img.onerror = null;
                              img.style.display = "none";
                              if (img.parentElement) img.parentElement.innerHTML = "✏️";
                            }}
                          />
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id, tag.tag_name)}
                          className="tm-delete-btn"
                          aria-label="Удалить"
                          disabled={deletingId === tag.id}
                        >
                          {deletingId === tag.id ? "Удаление..." : 
                            <img
                              src="/assets/delete_icon.svg"
                              alt="Удалить"
                              className="delete-icon"
                              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                const img = e.currentTarget;
                                img.onerror = null;
                                img.style.display = "none";
                                if (img.parentElement) img.parentElement.innerHTML = "🗑️";
                              }}
                            />
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleCreateTag}
          className="tm-add-button"
          aria-label="Создать тег"
          type="button"
        >
          <img
            src="/assets/plus_icon.svg"
            alt="Создать тег"
            className="tm-plus-icon"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              const img = e.currentTarget;
              img.onerror = null;
              img.style.display = "none";
              if (img.parentElement) img.parentElement.innerHTML = "+";
            }}
          />
        </button>
      </div>
    </>
  );
};

export default ModeratorPage;