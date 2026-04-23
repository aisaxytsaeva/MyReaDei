import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Header from "../../UI/Header/Header";
import Button from "../../UI/Button/Button";
import { ExternalBookSearch } from "../../../components/AddEditBookComponents/ExternalBookSearch";
import "./AddEditBookPage.css";

import { useFetchLocations } from "../../../hooks/useFetchLocations";
import { useFetchTags } from "../../../hooks/useFetchTags";
import { useBookForm } from "../../../hooks/useBookForm";
import BookImageUpload from "./../../AddEditBookComponents/BookImageUpload";
import BookFormFields from "./../../AddEditBookComponents/BookFormFields";
import TagsSelector from "./../../AddEditBookComponents/TagsSelector";
import LocationsSelector from "./../../AddEditBookComponents/LocationsSelector";
import FormActions from "./../../AddEditBookComponents/FormActions";
import LoadingState from "./../../AddEditBookComponents/LoadingState";
import { type ExternalBook } from "../../../lib/api";

const AddEditBookPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user, token } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEditMode = Boolean(id);
  const {
    formData,
    loading,
    error,
    bookData,
    handleInputChange,
    handleLocationChange,
    handleTagChange,
    handleCoverChange,
    handleSubmit,
  } = useBookForm(isEditMode, id);

  const { locations, loading: loadingLocations } = useFetchLocations();
  const { tags, loading: loadingTags } = useFetchTags();

  useEffect(() => {
    if (!user && !token) {
      navigate('/auth', { replace: true });
    }
  }, [user, token, navigate]);

  const handleExternalBookSelect = (externalBook: ExternalBook) => {
    // Заполняем форму данными из внешнего API
    if (externalBook.title) {
      handleInputChange({
        target: { name: "title", value: externalBook.title }
      } as any);
    }
    
    if (externalBook.authors && externalBook.authors.length > 0) {
      handleInputChange({
        target: { name: "author", value: externalBook.authors[0] }
      } as any);
    }
    
    if (externalBook.description) {
      handleInputChange({
        target: { name: "description", value: externalBook.description }
      } as any);
    }
    
    if (externalBook.cover_image) {
      console.log("Cover image URL:", externalBook.cover_image);
    }
  };

  const validateForm = (): boolean => {
    setValidationError(null);
    
    if (!formData.title.trim()) {
      setValidationError("Пожалуйста, введите название книги");
      return false;
    }
    
    if (!formData.author.trim()) {
      setValidationError("Пожалуйста, введите автора книги");
      return false;
    }
    
    if (!formData.location_ids || formData.location_ids.length === 0) {
      setValidationError("Пожалуйста, выберите хотя бы одну локацию");
      return false;
    }
    
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    // Валидация формы
    if (!validateForm()) {
      // Прокручиваем к ошибке валидации
      const errorElement = document.querySelector('.validation-error');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!user || !token) {
      setValidationError("Пожалуйста, войдите в систему");
      navigate("/auth");
      return;
    }

    try {
      const result = await handleSubmit();
      
      if (result.success && result.bookId) {
        // Перенаправляем на страницу книги после успешного сохранения
        navigate(`/book/${result.bookId}`, { replace: true });
      } else if (!result.success && result.message) {
        setSubmitError(result.message);
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      const errorMessage = err.response?.data?.detail || "Произошла ошибка при сохранении книги";
      setSubmitError(errorMessage);
    }
  };

  const handleCancel = () => {
    if (isEditMode && id) {
      navigate(`/book/${id}`);
    } else {
      navigate("/mybooks");
    }
  };

  // Проверка аутентификации
  if (!user || !token) {
    return <Navigate to="/auth" replace />;
  }

  // Состояние загрузки для режима редактирования
  if (loading && isEditMode) {
    return (
      <div className="add-edit-book-page">
        <Header />
        <LoadingState message="Загрузка данных книги..." />
      </div>
    );
  }

  // Ошибка загрузки для режима редактирования
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
        <div className="content">
          <div className="page-header">
            <h1 className="page-title">{isEditMode ? "Редактировать книгу" : "Добавить книгу"}</h1>
            <div className="page-subtitle">
              {isEditMode ? "Обновите информацию о вашей книге" : "Откройте вашу книгу для других!"}
            </div>
          </div>

          {/* Внешний поиск - только для создания новой книги */}
          {!isEditMode && (
            <div className="external-search-section" data-testid="external-search-section">
              <ExternalBookSearch 
                onSelect={handleExternalBookSelect} 
                loading={loading}
              />
            </div>
          )}

          <form onSubmit={onSubmit} className="book-form" data-testid="book-form" noValidate>
            <div className="form-grid">
              <div className="form-left-column">
                <BookImageUpload
                  preview={formData.coverPreview}
                  onFileChange={handleCoverChange}
                  loading={loading}
                  hasExistingCover={!!bookData?.cover_image_uri}
                  existingCoverUrl={bookData?.cover_image_uri || null}  
                />
              </div>

              <div className="form-right-column">
                <BookFormFields
                  title={formData.title}
                  author={formData.author}
                  description={formData.description}
                  onInputChange={handleInputChange}
                  loading={loading}
                  error={validationError}
                />

                <TagsSelector
                  tags={tags}
                  selectedIds={formData.tag_ids}
                  onChange={handleTagChange}
                  loading={loading}
                  loadingTags={loadingTags}
                />

                <LocationsSelector
                  locations={locations}
                  selectedIds={formData.location_ids}
                  onChange={handleLocationChange}
                  loading={loading}
                  loadingLocations={loadingLocations}
                  error={validationError?.includes("локацию") ? validationError : undefined}
                />
              </div>
            </div>

            {/* Отображение ошибок валидации */}
            {validationError && (
              <div className="validation-error" style={{ 
                backgroundColor: "#f8d7da", 
                color: "#721c24", 
                padding: "12px", 
                borderRadius: "8px",
                marginTop: "16px",
                border: "1px solid #f5c6cb"
              }}>
                <p style={{ margin: 0 }}>{validationError}</p>
              </div>
            )}

            {/* Отображение ошибки отправки */}
            {submitError && (
              <div className="error-message" style={{ 
                backgroundColor: "#f8d7da", 
                color: "#721c24", 
                padding: "12px", 
                borderRadius: "8px",
                marginTop: "16px",
                border: "1px solid #f5c6cb"
              }}>
                <p style={{ margin: 0 }}>{submitError}</p>
              </div>
            )}

            {error && !validationError && (
              <div className="error-message" style={{ 
                backgroundColor: "#f8d7da", 
                color: "#721c24", 
                padding: "12px", 
                borderRadius: "8px",
                marginTop: "16px"
              }}>
                <p style={{ margin: 0 }}>{error}</p>
              </div>
            )}

            <FormActions 
              isEditMode={isEditMode} 
              loading={loading} 
              onCancel={handleCancel}
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditBookPage;