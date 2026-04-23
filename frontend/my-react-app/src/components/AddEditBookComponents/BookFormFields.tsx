import React from "react";

type BookFormFieldsProps = {
  title: string;
  author: string;
  description: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  loading: boolean;
  error?: string | null;
};

const BookFormFields: React.FC<BookFormFieldsProps> = ({
  title,
  author,
  description,
  onInputChange,
  loading,
  error,
}) => {
  const getFieldError = (fieldName: string): boolean => {
    if (!error) return false;
    return error.toLowerCase().includes(fieldName.toLowerCase());
  };

  return (
    <>
      <div className="form-section">
        <h3 className="section1-title">Название *</h3>
        <input
          type="text"
          name="title"
          value={title}
          onChange={onInputChange}
          placeholder="Введите название книги"
          className={`form-input ${getFieldError('название') ? 'input-error' : ''}`}
          required
          disabled={loading}
          data-testid="title-input"
        />
        {getFieldError('название') && (
          <div className="field-error-message" style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
            {error}
          </div>
        )}
      </div>

      <div className="form-section">
        <h3 className="section1-title">Автор *</h3>
        <input
          type="text"
          name="author"
          value={author}
          onChange={onInputChange}
          placeholder="Введите автора книги"
          className={`form-input ${getFieldError('автор') ? 'input-error' : ''}`}
          required
          disabled={loading}
          data-testid="author-input"
        />
        {getFieldError('автор') && (
          <div className="field-error-message" style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
            {error}
          </div>
        )}
      </div>

      <div className="form-section">
        <h3 className="section1-title">Описание</h3>
        <textarea
          name="description"
          value={description}
          onChange={onInputChange}
          placeholder="Добавьте описание книги (необязательно)"
          className="form-textarea"
          rows={4}
          disabled={loading}
          data-testid="description-input"
        />
      </div>
    </>
  );
};

export default BookFormFields;