import React from "react";

type BookFormFieldsProps = {
  title: string;
  author: string;
  description: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  loading: boolean;
};

const BookFormFields: React.FC<BookFormFieldsProps> = ({
  title,
  author,
  description,
  onInputChange,
  loading,
}) => {
  return (
    <>
      <div className="form-section">
        <h3 className="section1-title">Название </h3>
        <input
          type="text"
          name="title"
          value={title}
          onChange={onInputChange}
          placeholder="Введите название книги"
          className="form-input"
          required
          disabled={loading}
        />
      </div>

      <div className="form-section">
        <h3 className="section1-title">Автор</h3>
        <input
          type="text"
          name="author"
          value={author}
          onChange={onInputChange}
          placeholder="Введите автора книги"
          className="form-input"
          required
          disabled={loading}
        />
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
        />
      </div>
    </>
  );
};

export default BookFormFields;