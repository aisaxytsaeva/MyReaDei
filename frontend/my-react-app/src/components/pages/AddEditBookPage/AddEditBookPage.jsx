import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../../UI/Header/Header';
import Button from '../../UI/Button/Button';
import './AddEditBookPage.css';

const AddEditBookPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditMode = !!id || location.state?.isEditing;
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    location: '',
    coverImage: null,
    coverPreview: null,
  });

  const [selectedLocation, setSelectedLocation] = useState('');
  
  // Предзаполняем данные, если это редактирование
  useEffect(() => {
    if (isEditMode) {
      // Здесь можно получить данные книги по ID
      const mockBookData = {
        title: "Война и мир I-II том",
        author: "Толстой Л.Н",
        description: "Описание книги, в которых можно написать что угодно",
        location: "книжный шкаф в кофе 'Фондол'",
        coverPreview: '/assets/cover.png'
      };
      
      setFormData({
        title: mockBookData.title,
        author: mockBookData.author,
        description: mockBookData.description,
        location: mockBookData.location,
        coverImage: null,
        coverPreview: mockBookData.coverPreview
      });
      setSelectedLocation(mockBookData.location);
    }
  }, [isEditMode, id]);

  // Список доступных мест для выдачи
  const availableLocations = [
    "книжный шкаф в кофе 'Фондол'",
    "центральная библиотека",
    "читальный зал университета",
    "кофейня 'Буквоед'",
    "парковый книжный шкаф",
    "м. Пушкинская, книжный обменник"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        coverImage: file,
        coverPreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleLocationChange = (e) => {
    const location = e.target.value;
    setSelectedLocation(location);
    setFormData(prev => ({
      ...prev,
      location: location
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.title.trim() || !formData.author.trim() || !formData.location.trim()) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    // Логика сохранения книги
    console.log('Данные книги:', formData);
    
    if (isEditMode) {
      alert('Книга успешно обновлена!');
      navigate(`/book/${id}`);
    } else {
      alert('Книга успешно добавлена!');
      navigate('/mybooks');
    }
  };

  const handleCancel = () => {
    if (isEditMode) {
      navigate(`/book/${id}`);
    } else {
      navigate('/mybooks');
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      coverImage: null,
      coverPreview: null
    }));
  };

  return (
    <div className="add-edit-book-page">
      <div className="fixed-header">
        <Header />
      </div>
      
      <div className="main-content">
        <div className="content-wrapper">
          <div className="page-header">
            <h1 className="page-title">
              {isEditMode ? 'Редактировать книгу' : 'Добавить книгу'}
            </h1>
            <div className="page-subtitle">
              {isEditMode ? 'Обновите информацию о вашей книге' : 'Откройте вашу книгу для других!'}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="book-form">
            <div className="form-grid">
              {/* Левая колонка - загрузка изображения */}
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
                          <span className="placeholder-icon">📚</span>
                          <span className="placeholder-text">Обложка книги</span>
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
                      />
                      <label htmlFor="cover-upload" className="file-upload-button">
                        Выберите файл
                      </label>
                      <div className="file-hint">
                        Рекомендуемый размер: 300×400px
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Правая колонка - информация о книге */}
              <div className="form-right-column">
                {/* Название */}
                <div className="form-section">
                  <h3 className="section-title">Название</h3>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Введите название книги"
                    className="form-input"
                    required
                  />
                </div>

                {/* Автор */}
                <div className="form-section">
                  <h3 className="section-title">Автор</h3>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="Введите автора книги"
                    className="form-input"
                    required
                  />
                </div>

                {/* Описание */}
                <div className="form-section">
                  <h3 className="section-title">Описание</h3>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Добавьте описание книги"
                    className="form-textarea"
                    rows="4"
                  />
                </div>

                {/* Место выдачи */}
                <div className="form-section">
                  <h3 className="section-title">Место выдачи</h3>
                  <div className="location-container">
                    <div className="location-select-wrapper">
                      <select
                        value={selectedLocation}
                        onChange={handleLocationChange}
                        className="location-select"
                        required
                      >
                        <option value="">Выберите место выдачи</option>
                        {availableLocations.map((location, index) => (
                          <option key={index} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                      <div className="select-arrow">▼</div>
                    </div>
                    
                    {selectedLocation && (
                      <div className="location-info">
                        <p className="location-text">
                          <strong>Заявите процесс выдачи:</strong> Книга будет находиться в выбранном месте
                        </p>
                        <p className="location-text">
                          <strong>Положительный текст:</strong> Убедитесь, что книга доступна в указанном месте
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="form-actions">
              <Button
                type="button"
                onClick={handleCancel}
                variant="secondary"
                className="cancel-button"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="submit-button"
              >
                {isEditMode ? 'Сохранить изменения' : 'Добавить книгу'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditBookPage;