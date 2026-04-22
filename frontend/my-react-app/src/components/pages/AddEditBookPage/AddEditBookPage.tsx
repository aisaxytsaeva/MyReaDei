import React from "react";
import { useNavigate, useParams } from "react-router-dom";
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

  const handleExternalBookSelect = (externalBook: ExternalBook) => {
    handleInputChange({
      target: { name: "title", value: externalBook.title }
    } as any);
    
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

  const onSubmit = async (e: React.FormEvent) => {
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

    const result = await handleSubmit();
    if (result.success && result.redirectTo) {
      alert(result.message);
      navigate(result.redirectTo);
    } else if (!result.success && result.message) {
      alert(result.message);
    }
  };

  const handleCancel = () => {
    if (isEditMode && id) navigate(`/book/${id}`);
    else navigate("/mybooks");
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
        <LoadingState message="Загрузка данных книги..." />
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
        <div className="content">
          <div className="page-header">
            <h1 className="page-title">{isEditMode ? "Редактировать книгу" : "Добавить книгу"}</h1>
            <div className="page-subtitle">
              {isEditMode ? "Обновите информацию о вашей книге" : "Откройте вашу книгу для других!"}
            </div>
          </div>

          {!isEditMode && (
            <div className="external-search-section">
              <ExternalBookSearch 
                onSelect={handleExternalBookSelect} 
                loading={loading}
              />
            </div>
          )}

          <form onSubmit={onSubmit} className="book-form">
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
                />
              </div>
            </div>

            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            <FormActions isEditMode={isEditMode} loading={loading} onCancel={handleCancel} />
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditBookPage;