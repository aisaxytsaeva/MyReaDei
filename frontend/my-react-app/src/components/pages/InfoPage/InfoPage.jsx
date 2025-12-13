import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import BookingMenu from '../../UI/Book/BookingMenu';
import Button from '../../UI/Button/Button';
import Header from '../../UI/Header/Header';
import './InfoPage.css';

const InfoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isBookingMenuOpen, setIsBookingMenuOpen] = useState(false);
  const [book, setBook] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState({ id: null, name: 'Владелец' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userReservation, setUserReservation] = useState(null);

  useEffect(() => {
    if (id) {
      fetchBookDetails();
    }
  }, [id, user]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // ОТЛАДКА: Проверяем структуру user
      console.log('=== DEBUG USER STRUCTURE ===');
      console.log('user object:', user);
      console.log('user keys:', user ? Object.keys(user) : 'no user');
      console.log('user.id:', user?.id);
      console.log('user.userId:', user?.userId);
      console.log('user._id:', user?._id);
      console.log('user.username:', user?.username);
      console.log('user.name:', user?.name);
      
      const headers = {
        'Accept': 'application/json'
      };
      
      if (user && user.access_token) {
        headers['Authorization'] = `Bearer ${user.access_token}`;
      }
      
      console.log(`📥 Запрашиваем книгу ${id}...`);
      const response = await fetch(`http://127.0.0.1:8000/books/${id}`, {
        method: 'GET',
        headers: headers,
        mode: 'cors'
      });
      
      console.log('📤 Ответ деталей книги:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Данные книги:', data);
        console.log('book.owner_id:', data.owner_id, 'тип:', typeof data.owner_id);
        
        const formattedBook = {
          id: data.id,
          title: data.title || 'Без названия',
          author: data.author || 'Неизвестный автор',
          description: data.description || 'Нет описания',
          cover_image_uri: data.cover_image_uri,
          owner_id: data.owner_id,
          status: data.status || 'available',
          locations: data.locations || [],
          reader_count: data.reader_count || 0
        };
        
        setBook(formattedBook);
        
        if (data.owner_id) {
          await fetchOwnerInfo(data.owner_id);
        }
        
        if (user && user.access_token) {
          await fetchUserReservations();
        }
        
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка загрузки книги:', errorText);
        setError(`Книга не найдена или недоступна (${response.status})`);
      }
    } catch (err) {
      console.error('❌ Ошибка сети:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerInfo = async (ownerId) => {
    try {
      console.log(`👤 Запрашиваем владельца ${ownerId}...`);
      
      const headers = { 'Accept': 'application/json' };
      
      // Пробуем разные варианты ID пользователя
      const userId = getUserId(user);
      console.log('🔍 Полученный userId из функции getUserId:', userId);
      console.log('🔍 ownerId для сравнения:', ownerId);
      console.log('🔍 Сравнение:', String(userId) === String(ownerId));
      
      if (user && userId && String(userId) === String(ownerId)) {
        console.log('✅ Это текущий пользователь!');
        setOwnerInfo({
          id: ownerId,
          name: user.name || user.username || 'Вы',
          isCurrentUser: true
        });
        return;
      }
      
      if (user && user.access_token) {
        headers['Authorization'] = `Bearer ${user.access_token}`;
      }
      
      const response = await fetch(`http://127.0.0.1:8000/users/${ownerId}`, {
        method: 'GET',
        headers: headers,
        mode: 'cors'
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Данные владельца:', userData);
        
        setOwnerInfo({
          id: userData.id,
          name: userData.username || `Пользователь ${ownerId}`,
          email: userData.email,
          isCurrentUser: userId && String(userId) === String(userData.id)
        });
      } else {
        console.warn('⚠️ Не удалось получить данные владельца');
        setOwnerInfo({
          id: ownerId,
          name: `Владелец #${ownerId}`,
          isCurrentUser: false
        });
      }
      
    } catch (err) {
      console.error('❌ Ошибка загрузки владельца:', err);
      setOwnerInfo({
        id: ownerId,
        name: `Владелец #${ownerId}`,
        isCurrentUser: false
      });
    }
  };

  const fetchUserReservations = async () => {
    try {
      console.log('📋 Проверяем бронирования пользователя...');
      const response = await fetch('http://127.0.0.1:8000/reservations/my', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const activeReservation = data.find(
          res => res.book_id === parseInt(id) && 
                 (res.status === 'active' || res.status === 'pending')
        );
        
        if (activeReservation) {
          console.log('✅ Найдено активное бронирование:', activeReservation);
          setUserReservation(activeReservation);
        }
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки бронирований:', err);
    }
  };

  // Функция для получения ID пользователя из разных возможных полей
  const getUserId = (userObj) => {
    if (!userObj) return null;
    
    // Пробуем разные возможные поля
    if (userObj.id !== undefined) return userObj.id;
    if (userObj.userId !== undefined) return userObj.userId;
    if (userObj._id !== undefined) return userObj._id;
    if (userObj.user_id !== undefined) return userObj.user_id;
    
    console.warn('⚠️ Не найдено поле ID в объекте user:', userObj);
    return null;
  };

  // Получаем ID пользователя
  const userId = getUserId(user);
  console.log('🔍 Определенный userId:', userId);
  
  // Проверяем является ли пользователь владельцем
  const isOwner = user && book && userId && String(userId) === String(book.owner_id);
  
  console.log('=== DEBUG ISOWNER CHECK ===');
  console.log('user exists:', !!user);
  console.log('book exists:', !!book);
  console.log('userId:', userId);
  console.log('book.owner_id:', book?.owner_id);
  console.log('String(userId):', String(userId));
  console.log('String(book.owner_id):', String(book?.owner_id));
  console.log('Are they equal?:', String(userId) === String(book?.owner_id));
  console.log('isOwner result:', isOwner);
  
  const isReservedByUser = !!userReservation;

  const handleMapClick = () => {
    if (book && book.locations && book.locations.length > 0) {
      const location = book.locations[0];
      let locationText = '';
      
      if (typeof location === 'string') {
        locationText = location;
      } else if (typeof location === 'object') {
        locationText = location.name || location.address || location.description || 'Место хранения';
      }
      
      console.log('📍 Место хранения:', locationText);
      const encodedLocation = encodeURIComponent(locationText);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
      
    } else {
      alert('Место хранения не указано');
    }
  };

  const handleReserve = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (book.status !== 'available') {
      alert('Книга в данный момент недоступна для бронирования');
      return;
    }
    
    setIsBookingMenuOpen(true);
  };

  const handleBookConfirm = async (days) => {
    try {
      if (!user || !user.access_token) {
        alert('Необходимо авторизоваться для бронирования');
        return;
      }

      if (!book || !book.id) {
        alert('Ошибка: книга не найдена');
        return;
      }

      if (book.status !== 'available') {
        alert('Книга в данный момент недоступна для бронирования');
        return;
      }

      let selectedLocationId = 1; 
      
      try {

        if (book.locations && book.locations.length > 0) {
          const locationsResponse = await fetch(`http://127.0.0.1:8000/books/${book.id}/locations`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${user.access_token}`,
              'Accept': 'application/json'
            }
          });
          
          if (locationsResponse.ok) {
            const locationsData = await locationsResponse.json();
            if (locationsData && locationsData.length > 0) {
              selectedLocationId = locationsData[0].id || 1;
            }
          }
        }
      } catch (locationErr) {
        console.warn('Не удалось получить локацию, используем дефолтную:', locationErr);
      }

      // Определяем planned_return_days как строку из разрешенных значений
      let plannedReturnDays;
      const allowedValues = ['7', '14', '30', '60'];
      const daysNumber = parseInt(days);
      
      // Выбираем ближайшее разрешенное значение
      if (daysNumber <= 7) plannedReturnDays = '7';
      else if (daysNumber <= 14) plannedReturnDays = '14';
      else if (daysNumber <= 30) plannedReturnDays = '30';
      else plannedReturnDays = '60';
      
      console.log(`Запрошено ${days} дней, выбрано ${plannedReturnDays} дней`);

      // Создаем объект бронирования с правильными типами данных
      const reservationData = {
        book_id: parseInt(book.id),
        planned_return_days: plannedReturnDays, // ⬅️ СТРОКА '7', '14', '30' или '60'
        selected_location_id: selectedLocationId
      };

      console.log('📤 Отправляем бронирование:', reservationData);

      // Отправляем запрос на создание бронирования
      const response = await fetch('http://127.0.0.1:8000/reservations/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(reservationData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Бронирование создано:', data);
        alert(`Книга "${book.title}" успешно забронирована на ${plannedReturnDays} дней!`);
        setIsBookingMenuOpen(false);
        await fetchBookDetails(); // Обновляем данные книги
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка бронирования:', errorText);
        
        // Пробуем парсить JSON ошибки
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.detail) {
            // Если ошибка содержит список полей
            if (Array.isArray(errorData.detail)) {
              const errorMessages = errorData.detail
                .map(err => {
                  if (err.type === 'missing') {
                    return `Отсутствует поле: ${err.loc[err.loc.length - 1]}`;
                  } else if (err.type === 'enum') {
                    return `Недопустимое значение для поля ${err.loc[err.loc.length - 1]}: ${err.msg}`;
                  } else {
                    return `${err.loc[err.loc.length - 1]}: ${err.msg}`;
                  }
                })
                .join('\n');
              
              alert(`Ошибка при бронировании:\n${errorMessages}`);
            } else {
              alert(`Ошибка при бронировании: ${errorData.detail}`);
            }
          } else {
            alert(`Ошибка при бронировании: ${errorText}`);
          }
        } catch {
          alert(`Ошибка при бронировании: ${errorText}`);
        }
      }
    } catch (err) {
      console.error('❌ Ошибка сети при бронировании:', err);
      alert('Ошибка подключения к серверу при бронировании');
    }
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleEdit = () => {
    if (book) {
      navigate(`/edit-book/${book.id}`, {
        state: { 
          bookId: book.id,
          initialData: {
            title: book.title,
            author: book.author,
            description: book.description
          }
        }
      });
    }
  };

  const handleDelete = async () => {
    if (!book || !confirm('Вы уверены, что хотите удалить эту книгу?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/books/${book.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok || response.status === 204) {
        alert('Книга успешно удалена!');
        navigate('/home');
      } else {
        const errorText = await response.text();
        alert(`Ошибка удаления: ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Ошибка удаления:', err);
      alert('Ошибка при удалении книги');
    }
  };

  const handleCancelReservation = async () => {
    if (!userReservation || !confirm('Вы уверены, что хотите отменить бронирование?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/reservations/${userReservation.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert('Бронирование отменено');
        setUserReservation(null);
        await fetchBookDetails();
      } else {
        const errorText = await response.text();
        alert(`Ошибка отмены: ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Ошибка отмены:', err);
      alert('Ошибка при отмене бронирования');
    }
  };

  const handleViewOwnerProfile = () => {
    if (ownerInfo.id) {
      alert(`Профиль владельца: ${ownerInfo.name}`);
    }
  };

  if (loading) {
    return (
      <div className="info-page">
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
          <p>Загрузка информации о книге...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="info-page">
        <Header />
        <div style={{ 
          textAlign: 'center', 
          padding: '100px 20px',
          color: '#721c24'
        }}>
          <h2>Ошибка</h2>
          <p>{error || 'Книга не найдена'}</p>
          <Button onClick={() => navigate('/home')} style={{ marginTop: '20px' }}>
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="info-page">
      
     
      
      <BookingMenu 
        isOpen={isBookingMenuOpen}
        onClose={() => setIsBookingMenuOpen(false)}
        onBook={handleBookConfirm}
      />
      
      <Header />

      <div className="info-content">
        <div className="book-container">
          <div className="book-cover-section">
            <div className="book-cover">
              {book.cover_image_uri ? (
                <img 
                  src={`http://127.0.0.1:8000${book.cover_image_uri}`} 
                  alt={book.title} 
                  className="book-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/cover.png';
                    e.target.onerror = () => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="book-placeholder">📚</div>';
                    };
                  }}
                />
              ) : (
                <div className="book-placeholder">📚</div>
              )}
            </div>
            
            <div className="action-buttons-container">
              {!user ? (
                <Button onClick={handleLogin} className="action-button login">
                  Войти для бронирования
                </Button>
              ) : isOwner ? (
                <>
                  <div style={{ 
                    textAlign: 'center', 
                    marginBottom: '15px',
                    padding: '10px',
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    borderRadius: '5px'
                  }}>
                    <strong>Это ваша книга</strong>
                  </div>
                  <div className="owner-buttons">
                    <Button onClick={handleEdit} className="action-button edit">
                      Редактировать
                    </Button>
                    <Button onClick={handleDelete} variant="secondary" className="action-button delete">
                      Удалить
                    </Button>
                  </div>
                </>
              ) : book.status === 'available' && !isReservedByUser ? (
                <Button onClick={handleReserve} className="action-button reserve">
                  Забронировать
                </Button>
              ) : isReservedByUser ? (
                <div className="reservation-status">
                  <p style={{ marginBottom: '10px', color: '#28a745' }}>
                    Вы забронировали эту книгу
                  </p>
                  <Button 
                    onClick={handleCancelReservation} 
                    className="action-button cancel"
                    style={{ backgroundColor: '#ffc107', color: '#212529' }}
                  >
                    Отменить бронь
                  </Button>
                </div>
              ) : (
                <p style={{ color: '#dc3545', textAlign: 'center' }}>
                  Книга в данный момент недоступна
                </p>
              )}
            </div>
          </div>

          <div className="book-info-section">
            <div className="book-header">
              <h1 className="book-title">{book.title}</h1>
              <h2 className="book-author">{book.author}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span className={`status-badge ${book.status}`}>
                  {book.status === 'available' ? 'Доступна' : 
                   book.status === 'reserved' ? 'Забронирована' : 'Недоступна'}
                </span>
                {book.reader_count > 0 && (
                  <span style={{ 
                    fontSize: '14px', 
                    color: '#666',
                    backgroundColor: '#f8f9fa',
                    padding: '4px 10px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span>👥</span>
                    <span>{book.reader_count} читателей</span>
                  </span>
                )}
              </div>
            </div>

            <div className="info-container">
              <h3 className="section-title">Описание</h3>
              <p className="book-description">{book.description}</p>
            </div>

            <div className="info-container">
              <h3 className="section-title">Место хранения</h3>
              <div className="location-content">
                {book.locations && book.locations.length > 0 ? (
                  <>
                    <p className="book-location">
                      {Array.isArray(book.locations) 
                        ? book.locations.map((loc, index) => (
                            <React.Fragment key={index}>
                              {typeof loc === 'string' ? loc : loc.name || loc.address || loc.description || 'Место хранения'}
                              {index < book.locations.length - 1 && ', '}
                            </React.Fragment>
                          ))
                        : book.locations}
                    </p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <Button onClick={handleMapClick} className="map-button">
                        📍 Посмотреть на карте
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="book-location">Место хранения не указано</p>
                )}
              </div>
            </div>

            <div className="info-container">
              <h3 className="section-title">Владелец книги</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <p className="book-owner" style={{ fontSize: '18px', fontWeight: '500' }}>
                  {ownerInfo.name}
                </p>
                {!isOwner && (
                  <Button 
                    onClick={handleViewOwnerProfile}
                    style={{ 
                      padding: '6px 12px',
                      fontSize: '14px',
                      backgroundColor: '#6c757d',
                      borderColor: '#6c757d'
                    }}
                  >
                    Профиль
                  </Button>
                )}
                {isOwner && (
                  <span style={{  
                    fontSize: '14px',
                    backgroundColor: '#d4edda',
                    padding: '4px 10px',
                    borderRadius: '4px'
                  }}>
                    Вы являетесь владельцем
                  </span>
                )}
              </div>
              {ownerInfo.email && !isOwner && (
                <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                  Email: {ownerInfo.email}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoPage;