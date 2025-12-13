import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../UI/Header/Header';
import BookCard from '../../UI/Book/BookCard';
import './ReservedBooksPage.css';

const ReservedBooksPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.access_token) {
      fetchReservations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://127.0.0.1:8000/reservations/my', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Фильтруем только активные бронирования
        const activeReservations = data.filter(res => 
          res.status === 'active' || res.status === 'pending'
        ).map(res => {
          // Расчет оставшихся дней
          let daysLeft = null;
          if (res.end_date) {
            const endDate = new Date(res.end_date);
            const today = new Date();
            const diffTime = endDate - today;
            daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            daysLeft = daysLeft > 0 ? daysLeft : 0;
          }
          
          return {
            id: res.id,
            book_id: res.book_id,
            title: res.book_title || 'Без названия',
            author: res.book_author || 'Неизвестный автор',
            cover_image_uri: res.book_cover_image_uri,
            daysLeft: daysLeft,
            status: res.status,
            start_date: res.start_date,
            end_date: res.end_date,
            book_owner: res.book_owner_username
          };
        });
        
        setReservations(activeReservations);
      } else {
        const errorText = await response.text();
        console.error('Ошибка загрузки бронирований:', errorText);
        setError('Не удалось загрузить ваши бронирования');
      }
    } catch (err) {
      console.error('Ошибка сети:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async (reservationId, bookId) => {
    try {
      // Отменяем бронирование
      const response = await fetch(`http://127.0.0.1:8000/reservations/${reservationId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Удаляем бронирование из списка
        setReservations(reservations.filter(res => res.id !== reservationId));
        alert('Книга успешно сдана!');
      } else {
        const errorText = await response.text();
        console.error('Ошибка возврата:', errorText);
        alert(`Ошибка при сдаче книги: ${errorText}`);
      }
    } catch (err) {
      console.error('Ошибка сети при возврате:', err);
      alert('Ошибка при сдаче книги');
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (window.confirm('Вы уверены, что хотите отменить бронирование?')) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/reservations/${reservationId}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          setReservations(reservations.filter(res => res.id !== reservationId));
          alert('Бронирование отменено');
        } else {
          const errorText = await response.text();
          alert(`Ошибка отмены: ${errorText}`);
        }
      } catch (err) {
        console.error('Ошибка отмены:', err);
        alert('Ошибка при отмене бронирования');
      }
    }
  };

  const handleBackToProfile = () => {
    navigate('/profile');
  };

  const handleBookClick = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  const handleBrowseBooks = () => {
    navigate('/home');
  };

  const handleRefresh = () => {
    fetchReservations();
  };

  // Если пользователь не авторизован
  if (!user) {
    return (
      <div className="reserved-books-page">
        <Header />
        <div style={{ 
          textAlign: 'center', 
          padding: '100px 20px',
          color: '#666'
        }}>
          <h2>Пожалуйста, войдите в систему</h2>
          <button 
            onClick={() => navigate('/auth')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="reserved-books-page">
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
          <p>Загрузка ваших бронирований...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reserved-books-page">
      <div className="fixed-header">
        <Header />
      </div>
      
      {error && (
        <div style={{
          margin: '20px auto',
          maxWidth: '800px',
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          {error}
          <button 
            onClick={handleRefresh}
            style={{
              marginLeft: '10px',
              padding: '5px 10px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Повторить
          </button>
        </div>
      )}
      
      <div className="main-content">
        <div className="content-wrapper">
          <div className="reserved-books-header">
            <h1 className="page-title">Забронированные книги</h1>
          </div>

          <div className="reserved-books-list">
            {reservations.length > 0 ? (
              reservations.map(reservation => (
                <div key={reservation.id} className="reserved-book-item">
                  <div className="book-info-section">
                    <div 
                      className="book-card-container"
                      onClick={() => handleBookClick(reservation.book_id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <BookCard book={{
                        id: reservation.book_id,
                        title: reservation.title,
                        author: reservation.author,
                        cover_image_uri: reservation.cover_image_uri
                      }} />
                    </div>
                    
                    <div className="reservation-details">
                      <div className="reservation-meta">
                        <span className="status-badge">
                          {reservation.status === 'active' ? 'Активно' : 'Ожидание'}
                        </span>
                        {reservation.book_owner && (
                          <span className="owner-info">
                            Владелец: {reservation.book_owner}
                          </span>
                        )}
                      </div>
                      
                      {reservation.daysLeft !== null && (
                        <div className="days-left-info">
                          До конца бронирования осталось:{" "}
                          <span className={`days-count ${reservation.daysLeft <= 3 ? 'warning' : ''}`}>
                            {reservation.daysLeft} {getDaysText(reservation.daysLeft)}
                          </span>
                        </div>
                      )}
                      
                      {reservation.start_date && reservation.end_date && (
                        <div className="date-range">
                          {formatDate(reservation.start_date)} — {formatDate(reservation.end_date)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="action-buttons">
                    {reservation.status === 'active' ? (
                      <button 
                        onClick={() => handleReturnBook(reservation.id, reservation.book_id)}
                        className="return-button"
                      >
                        Сдать книгу
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleCancelReservation(reservation.id)}
                        className="cancel-button"
                        style={{
                          backgroundColor: '#ffc107',
                          color: '#212529'
                        }}
                      >
                        Отменить бронь
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-books-message">
                <p>У вас нет активных бронирований</p>
                <button 
                  onClick={handleBrowseBooks}
                  className="browse-books-button"
                >
                  Посмотреть доступные книги
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Вспомогательная функция для правильного склонения слова "день"
const getDaysText = (days) => {
  if (days % 10 === 1 && days % 100 !== 11) return 'день';
  if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20)) return 'дня';
  return 'дней';
};

// Форматирование даты
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default ReservedBooksPage;