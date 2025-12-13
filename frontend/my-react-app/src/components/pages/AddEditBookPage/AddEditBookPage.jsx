import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../UI/Header/Header';
import Button from '../../UI/Button/Button';
import './AddEditBookPage.css';

const AddEditBookPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  
  const isEditMode = !!id;
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    location_ids: [],
    coverImage: null,
    coverPreview: null,
  });

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [error, setError] = useState('');
  const [bookData, setBookData] = useState(null);

  // Загружаем доступные локации
  useEffect(() => {
    fetchLocations();
    
    // Если режим редактирования, загружаем данные книги
    if (isEditMode) {
      fetchBookData();
    }
  }, [id]);

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      const response = await fetch('http://127.0.0.1:8000/locations', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      } else {
        console.warn('Не удалось загрузить локации, используем демо-данные');
        // Демо-локации на случай если эндпоинта нет
        setLocations([
          { id: 1, name: "книжный шкаф в кофе 'Фондол'", address: "ул. Пушкина, 1" },
          { id: 2, name: "центральная библиотека", address: "ул. Ленина, 10" },
          { id: 3, name: "читальный зал университета", address: "пр. Мира, 15" },
          { id: 4, name: "кофейня 'Буквоед'", address: "ул. Гоголя, 5" },
        ]);
      }
    } catch (err) {
      console.error('Ошибка загрузки локаций:', err);
      setLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchBookData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const headers = {
        'Accept': 'application/json'
      };
      
      if (user && user.access_token) {
        headers['Authorization'] = `Bearer ${user.access_token}`;
      }
      
      const response = await fetch(`http://127.0.0.1:8000/books/${id}`, {
        method: 'GET',
        headers: headers
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📚 Данные книги для редактирования:', data);
        setBookData(data);
        
        // Заполняем форму данными книги
        setFormData({
          title: data.title || '',
          author: data.author || '',
          description: data.description || '',
          location_ids: data.locations?.map(loc => loc.id) || [],
          coverImage: null,
          coverPreview: data.cover_image_uri ? 
            `http://127.0.0.1:8000${data.cover_image_uri}` : null
        });
      } else {
        const errorText = await response.text();
        setError(`Не удалось загрузить данные книги: ${errorText}`);
      }
    } catch (err) {
      console.error('Ошибка загрузки книги:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

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
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        return;
      }
      
      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        coverImage: file,
        coverPreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleLocationChange = (e) => {
    const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setFormData(prev => ({
      ...prev,
      location_ids: selectedIds
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.title.trim() || !formData.author.trim() || formData.location_ids.length === 0) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (!user || !user.access_token) {
      alert('Пожалуйста, войдите в систему');
      navigate('/auth');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiUrl = isEditMode 
        ? `http://127.0.0.1:8000/books/${id}`
        : 'http://127.0.0.1:8000/books/';
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      // Создаем FormData
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('author', formData.author);
      formDataToSend.append('description', formData.description || '');
      
      // Добавляем локации
      formData.location_ids.forEach(id => {
        formDataToSend.append('location_ids', id.toString());
      });
      
      // Добавляем изображение если есть
      if (formData.coverImage) {
        formDataToSend.append('cover_image', formData.coverImage);
      }
      
      console.log('📤 Отправляем данные книги:', {
        title: formData.title,
        author: formData.author,
        description: formData.description,
        location_ids: formData.location_ids,
        hasCover: !!formData.coverImage
      });
      
      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Accept': 'application/json'
          // Не устанавливаем Content-Type, браузер сам установит с boundary для FormData
        },
        body: formDataToSend
      });
      
      console.log('📥 Ответ сервера:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Книга сохранена:', data);
        
        if (isEditMode) {
          alert('Книга успешно обновлена!');
          navigate(`/book/${id}`);
        } else {
          alert('Книга успешно добавлена!');
          navigate('/mybooks');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка сохранения:', errorText);
        setError(`Ошибка сохранения: ${errorText}`);
        alert(`Ошибка сохранения: ${errorText.substring(0, 100)}`);
      }
    } catch (err) {
      console.error('❌ Ошибка сети:', err);
      setError('Ошибка подключения к серверу');
      alert('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode && id) {
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

  // Если пользователь не авторизован
  if (!user) {
    return (
      <div className="add-edit-book-page">
        <Header />
        <div style={{ 
          textAlign: 'center', 
          padding: '100px 20px',
          color: '#666'
        }}>
          <h2>Пожалуйста, войдите в систему</h2>
          <p>Для добавления или редактирования книги требуется авторизация</p>
          <Button onClick={() => navigate('/auth')} style={{ marginTop: '20px' }}>
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
        <div style={{ 
          textAlign: 'center', 
          padding: '100px 20px',
          color: '#666'
        }}>
          <div style={{ 
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
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
        <div style={{ 
          textAlign: 'center', 
          padding: '100px 20px',
          color: '#721c24'
        }}>
          <h2>Ошибка</h2>
          <p>{error}</p>
          <Button onClick={() => navigate('/mybooks')} style={{ marginTop: '20px' }}>
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
            <h1 className="page-title">
              {isEditMode ? 'Редактировать книгу' : 'Добавить книгу'}
            </h1>
            <div className="page-subtitle">
              {isEditMode ? 'Обновите информацию о вашей книге' : 'Откройте вашу книгу для других!'}
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
                          <span className="placeholder-icon">📚</span>
                          <span className="placeholder-text">
                            {isEditMode && bookData?.cover_image_uri 
                              ? 'Текущая обложка загружена с сервера' 
                              : 'Обложка книги'
                            }
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
                      />
                      <label htmlFor="cover-upload" className="file-upload-button">
                        {formData.coverPreview || (isEditMode && bookData?.cover_image_uri) 
                          ? 'Изменить изображение' 
                          : 'Выберите файл'
                        }
                      </label>
                      <div className="file-hint">
                        Поддерживаемые форматы: JPG, PNG, GIF (макс. 5MB)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Правая колонка - информация о книге */}
              <div className="form-right-column">
                {/* Название */}
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

                {/* Автор */}
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

                {/* Описание */}
                <div className="form-section">
                  <h3 className="section-title">Описание</h3>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Добавьте описание книги (необязательно)"
                    className="form-textarea"
                    rows="4"
                    disabled={loading}
                  />
                </div>

                {/* Место хранения */}
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
                            value={formData.location_ids.map(id => id.toString())}
                            onChange={handleLocationChange}
                            className="location-select"
                            required
                            disabled={loading}
                            size="4"
                          >
                            <option value="" disabled>
                              Выберите место хранения (можно выбрать несколько, удерживая Ctrl)
                            </option>
                            {locations.map((location) => (
                              <option key={location.id} value={location.id}>
                                {location.name} - {location.address}
                              </option>
                            ))}
                          </select>
                          <div className="select-arrow">▼</div>
                        </div>
                        
                        {formData.location_ids.length > 0 && (
                          <div className="selected-locations">
                            <p><strong>Выбрано локаций:</strong> {formData.location_ids.length}</p>
                            <ul>
                              {formData.location_ids.map(locId => {
                                const location = locations.find(l => l.id === locId);
                                return location ? (
                                  <li key={locId}>{location.name} - {location.address}</li>
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
                          onClick={fetchLocations}
                          style={{ marginTop: '10px' }}
                        >
                          Повторить загрузку
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Сообщение об ошибке */}
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            {/* Кнопки действий */}
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
              <Button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? 'Сохранение...' : 
                 isEditMode ? 'Сохранить изменения' : 'Добавить книгу'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditBookPage;