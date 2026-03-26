import React, { useEffect, useState } from "react";

type BookImageUploadProps = {
  preview: string | null;
  onFileChange: (file: File | null, preview: string | null) => void;
  loading: boolean;
  hasExistingCover?: boolean;
  existingCoverUrl?: string | null;
};

const BookImageUpload: React.FC<BookImageUploadProps> = ({
  preview,
  onFileChange,
  loading,
  hasExistingCover = false,
  existingCoverUrl = null,
}) => {
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    if (existingCoverUrl && !preview && hasExistingCover) {
      onFileChange(null, existingCoverUrl);
    }
  }, [existingCoverUrl, hasExistingCover]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setImageError(false);
    onFileChange(file, previewUrl);
  };

  const handleRemoveImage = () => {
    setImageError(false);
    onFileChange(null, null);
  };

  const handleImageError = () => {
    console.error("Failed to load image:", displayPreview);
    setImageError(true);
  };

  const displayPreview = preview || (hasExistingCover && existingCoverUrl ? existingCoverUrl : null);
  const isExistingImage = preview === null && existingCoverUrl && hasExistingCover;
  const showPlaceholder = !displayPreview || imageError;

  return (
    <div className="form-section">
      <h3 className="section1-title">Добавьте изображение</h3>

      <div className="image-upload-container">
        <div className="image-preview">
          {!showPlaceholder ? (
            <>
              <img 
                src={displayPreview!} 
                alt="Предпросмотр обложки" 
                className="preview-image"
                onError={handleImageError}
              />
              <button 
                type="button" 
                onClick={handleRemoveImage} 
                className="remove-image-btn"
                title="Удалить изображение"
              >
                ✕
              </button>
            </>
          ) : (
            <div className="image-placeholder">
              <span className="placeholder-text">
                {imageError ? "Ошибка загрузки" : (isExistingImage ? "Текущая обложка" : "Обложка книги")}
              </span>
              {imageError && existingCoverUrl && (
                <div className="image-error-hint">
                  <a href={existingCoverUrl} target="_blank" rel="noopener noreferrer">
                    Открыть изображение
                  </a>
                </div>
              )}
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
            {displayPreview && !imageError ? "Изменить изображение" : "Выберите файл"}
          </label>
          <div className="file-hint">Поддерживаемые форматы: JPG, PNG, GIF (макс. 5MB)</div>
          {hasExistingCover && existingCoverUrl && !preview && !imageError && (
            <div className="existing-cover-hint">
              📷 Текущая обложка загружена. Выберите новый файл для замены.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookImageUpload;