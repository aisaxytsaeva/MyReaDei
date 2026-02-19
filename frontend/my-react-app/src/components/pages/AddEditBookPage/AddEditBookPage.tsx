import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Header from "../../UI/Header/Header";
import Button from "../../UI/Button/Button";
import "./AddEditBookPage.css";

import { bookApi, type Id, type Location } from "../../../lib/api";

type FormState = {
  title: string;
  author: string;
  description: string;
  location_ids: number[];
  coverImage: File | null;
  coverPreview: string | null;
};

type BookForEdit = {
  id: Id;
  title?: string;
  author?: string;
  description?: string | null;
  cover_image_uri?: string | null;
  locations?: Array<{ id: number; name?: string; address?: string }>;
};

function extractAxiosErrorMessage(err: any): string {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const msgs = detail
      .map((e) => e?.msg || e?.message || e?.detail)
      .filter(Boolean);
    if (msgs.length) return msgs.join(", ");
  }

  return err?.message ?? "Ошибка сохранения";
}

const AddEditBookPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user, token } = useAuth();

  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<FormState>({
    title: "",
    author: "",
    description: "",
    location_ids: [],
    coverImage: null,
    coverPreview: null,
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [error, setError] = useState("");
  const [bookData, setBookData] = useState<BookForEdit | null>(null);

  useEffect(() => {
    void fetchLocations();
    if (isEditMode) void fetchBookData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchLocations = async (): Promise<void> => {
    try {
      setLoadingLocations(true);
      setError("");

      const resp = await bookApi.getLocations();
      const data = resp.data as Location[];

      setLocations(
        (Array.isArray(data) ? data : []).map((l: any) => ({
          id: l.id,
          name: l.name ?? "Локация",
          address: l.address ?? "",
        }))
      );
    } catch (err) {
      console.warn("Не удалось загрузить локации, используем демо-данные", err);
      setLocations([
        { id: 1, name: "книжный шкаф в кофе 'Фондол'", address: "ул. Пушкина, 1" },
        { id: 2, name: "центральная библиотека", address: "ул. Ленина, 10" },
        { id: 3, name: "читальный зал университета", address: "пр. Мира, 15" },
        { id: 4, name: "кофейня 'Буквоед'", address: "ул. Гоголя, 5" },
      ]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchBookData = async (): Promise<void> => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const resp = await bookApi.getBookById(id);
      const data = resp.data as BookForEdit;

      setBookData(data);

      setFormData((prev) => ({
        ...prev,
        title: data.title ?? "",
        author: data.author ?? "",
        description: data.description ?? "",
        location_ids: Array.isArray(data.locations)
          ? data.locations
              .map((loc) => Number(loc.id))
              .filter((n) => Number.isFinite(n))
          : [],
        coverImage: null,
        coverPreview: data.cover_image_uri
          ? `http://127.0.0.1:8000${data.cover_image_uri}`
          : null,
      }));
    } catch (err: any) {
      const msg = extractAxiosErrorMessage(err);
      setError(`Не удалось загрузить данные книги: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Пожалуйста, выберите изображение");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Размер файла не должен превышать 5MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, coverImage: file, coverPreview: previewUrl }));
  };

  const handleRemoveImage = (): void => {
    setFormData((prev) => ({ ...prev, coverImage: null, coverPreview: null }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const selectedIds = Array.from(e.target.selectedOptions).map((opt) =>
      Number.parseInt(opt.value, 10)
    );
    setFormData((prev) => ({
      ...prev,
      location_ids: selectedIds.filter((n) => Number.isFinite(n)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.author.trim() || formData.location_ids.length === 0) {
      alert("Пожалуйста, заполните все обязательные поля");
      return;
    }

    if (!user || !token) {
      alert("Пожалуйста, войдите в систему");
      navigate("/auth");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isEditMode && id) {
        await bookApi.updateBook(id, {
          title: formData.title,
          author: formData.author,
          description: formData.description || "",
          location_ids: formData.location_ids,
        });

        if (formData.coverImage) {
          await bookApi.uploadCover(id, formData.coverImage);
        }

        alert("Книга успешно обновлена!");
        navigate(`/book/${id}`);
        return;
      }

      await bookApi.createBook({
        title: formData.title,
        author: formData.author,
        description: formData.description || "",
        location_ids: formData.location_ids,
        cover_image: formData.coverImage,
      } as any);

      alert("Книга успешно добавлена!");
      navigate("/mybooks");
    } catch (err: any) {
      const msg = extractAxiosErrorMessage(err);
      setError(`Ошибка сохранения: ${msg}`);
      alert(`Ошибка сохранения: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (): void => {
    if (isEditMode && id) navigate(`/book/${id}`);
    else navigate("/mybooks");
  };

  const handleGoCreateLocation = (): void => {
    navigate("/locations/create");
  };

  if (!user || !token) {
    return (
      <div className="add-edit-book-page">
        <Header />
        <div style={{ textAlign: "center", padding: "100px 20px", color: "#666" }}>
          <h2>Пожалуйста, войдите в систему</h2>
          <p>Для добавления или редактирования книги требуется авторизация</p>
          <Button onClick={() => navigate("/auth")} style={{ marginTop: "20px" }}>
            Войти
          </Button>
        </div>
      </div>
    );
  }

  if (loading && isEditMode) {
    return (
      <div className="add-edit-book-page">
        <Header />
        <div style={{ textAlign: "center", padding: "100px 20px", color: "#666" }}>
          <div
            style={{
              display: "inline-block",
              width: "40px",
              height: "40px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "20px",
            }}
          />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p>Загрузка данных книги...</p>
        </div>
      </div>
    );
  }

  if (error && isEditMode) {
    return (
      <div className="add-edit-book-page">
        <Header />
        <div style={{ textAlign: "center", padding: "100px 20px", color: "#721c24" }}>
          <h2>Ошибка</h2>
          <p>{error}</p>
          <Button onClick={() => navigate("/mybooks")} style={{ marginTop: "20px" }}>
            Вернуться к моим книгам
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="add-edit-book-page">
      <div className="fixed-header">
        <Header />
      </div>

      <div className="main-content">
        <div className="content-wrapper">
          <div className="page-header">
            <h1 className="page-title">{isEditMode ? "Редактировать книгу" : "Добавить книгу"}</h1>
            <div className="page-subtitle">
              {isEditMode ? "Обновите информацию о вашей книге" : "Откройте вашу книгу для других!"}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="book-form">
            <div className="form-grid">
              <div className="form-left-column">
                <div className="form-section">
                  <h3 className="section-title">Добавьте изображение</h3>

                  <div className="image-upload-container">
                    <div className="image-preview">
                      {formData.coverPreview ? (
                        <>
                          <img
                            src={formData.coverPreview}
                            alt="Предпросмотр обложки"
                            className="preview-image"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="remove-image-btn"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <div className="image-placeholder">
                          <span className="placeholder-text">
                            {isEditMode && bookData?.cover_image_uri
                              ? "Текущая обложка загружена с сервера"
                              : "Обложка книги"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="file-upload-wrapper">
                      <input
                        type="file"
                        id="cover-upload"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file-input"
                        disabled={loading}
                      />
                      <label htmlFor="cover-upload" className="file-upload-button">
                        {formData.coverPreview || (isEditMode && bookData?.cover_image_uri)
                          ? "Изменить изображение"
                          : "Выберите файл"}
                      </label>
                      <div className="file-hint">Поддерживаемые форматы: JPG, PNG, GIF (макс. 5MB)</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-right-column">
                <div className="form-section">
                  <h3 className="section-title">Название *</h3>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Введите название книги"
                    className="form-input"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-section">
                  <h3 className="section-title">Автор *</h3>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="Введите автора книги"
                    className="form-input"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-section">
                  <h3 className="section-title">Описание</h3>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Добавьте описание книги (необязательно)"
                    className="form-textarea"
                    rows={4}
                    disabled={loading}
                  />
                </div>

                <div className="form-section">
                  <h3 className="section-title">Место хранения *</h3>
                  <div className="location-container">
                    {loadingLocations ? (
                      <p>Загрузка локаций...</p>
                    ) : locations.length > 0 ? (
                      <>
                        <div className="location-select-wrapper">
                          <select
                            multiple
                            value={formData.location_ids.map(String)}
                            onChange={handleLocationChange}
                            className="location-select"
                            required
                            disabled={loading}
                            size={4}
                          >
                            {locations.map((loc) => (
                              <option key={String(loc.id)} value={String(loc.id)}>
                                {loc.name} - {loc.address}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="create-location-hint">
                          <div className="create-location-hint-text">
                            Не нашли нужного адреса? создайте его сами
                          </div>
                          <button
                            type="button"
                            className="create-location-btn"
                            onClick={handleGoCreateLocation}
                            disabled={loading}
                          >
                            Создать локацию
                          </button>
                        </div>

                        {formData.location_ids.length > 0 && (
                          <div className="selected-locations">
                            <p>
                              <strong>Выбрано локаций:</strong> {formData.location_ids.length}
                            </p>
                            <ul>
                              {formData.location_ids.map((locId) => {
                                const loc = locations.find((l) => Number(l.id) === locId);
                                return loc ? (
                                  <li key={locId}>
                                    {loc.name} - {loc.address}
                                  </li>
                                ) : null;
                              })}
                            </ul>
                          </div>
                        )}

                        <div className="location-info">
                          <p className="location-text">
                            <strong>Важно:</strong> Укажите, где будет находиться книга для выдачи
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="no-locations">
                        <p>Нет доступных локаций</p>
                        <Button
                          type="button"
                          onClick={() => void fetchLocations()}
                          style={{ marginTop: "10px" }}
                          disabled={loading}
                        >
                          Повторить загрузку
                        </Button>

                        <div className="create-location-hint">
                          <div className="create-location-hint-text">
                            Не нашли нужного адреса? создайте его сами
                          </div>
                          <button
                            type="button"
                            className="create-location-btn"
                            onClick={handleGoCreateLocation}
                            disabled={loading}
                          >
                            Создать локацию
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            <div className="form-actions">
              <Button
                type="button"
                onClick={handleCancel}
                variant="secondary"
                className="cancel-button"
                disabled={loading}
              >
                Отмена
              </Button>

              <Button type="submit" className="submit-button" disabled={loading}>
                {loading ? "Сохранение..." : isEditMode ? "Сохранить изменения" : "Добавить книгу"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditBookPage;
