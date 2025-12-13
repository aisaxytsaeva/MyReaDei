import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../../UI/Header/Header';
import Button from '../../UI/Button/Button';
import BookCard from '../../UI/Book/BookCard';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [userProfile, setUserProfile] = useState(null);
  const [myBooks, setMyBooks] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.access_token) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Получаем профиль пользователя
      const profileResponse = await fetch('http://127.0.0.1:8000/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData);
      }
      
      // Получаем книги пользователя (первые 3)
      const booksResponse = await fetch('http://127.0.0.1:8000/users/book/my?limit=3', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      if (booksResponse.ok) {
        const booksData = await booksResponse.json();
        const formattedBooks = booksData.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          cover_image_uri: book.cover_image_uri
        }));
        setMyBooks(formattedBooks);
      }
      
      // Получаем текущие бронирования (первые 3)
      const reservationsResponse = await fetch('http://127.0.0.1:8000/reservations/my?limit=3', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      if (reservationsResponse.ok) {
        const reservationsData = await reservationsResponse.json();
        // Берем только активные бронирования
        const activeReservations = reservationsData
          .filter(res => res.status === 'active' || res.status === 'pending')
          .slice(0, 3)
          .map(res => ({
            id: res.book_id,
            title: res.book_title,
            author: res.book_author,
            cover_image_uri: res.book_cover_image_uri,
            reservation_status: res.status
          }));
        setReservations(activeReservations);
      }
      
    } catch (err) {
      console.error('Ошибка загрузки профиля:', err);
      setError('Не удалось загрузить данные профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMyBooks = () => {
    navigate('/mybooks');
  };

  const handleReservations = () => {
    navigate('/reservations');
  };

  if (!user) {
    return (
      <div>
        <Header />
        <div className="profile-unauthorized-container">
          <h2>Пожалуйста, войдите в систему</h2>
          <Button to="/auth">Войти</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-container">
        <Header />
        <div style={{ 
          textAlign: 'center', 
          padding: '100px 0',
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
          <p>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Header />
      
      {error && (
        <div style={{
          maxWidth: '800px',
          margin: '20px auto',
          padding: '15px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '5px',
          color: '#856404',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
      
      <div className="profile-main-content">
        <div className="profile-left-column">
          <div className="profile-card">
            <img src="/assets/profile.svg" alt="Профиль" />
            
            <div>
              <h2 className="profile-user-name">
                {user.name || user.username}
              </h2>
              
              {userProfile && (
                <div className="profile-stats">
                  <div className="stat-item">
                    <span className="stat-label">Добавлено книг:</span>
                    <span className="stat-value">{userProfile.book_added || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Прочитано книг:</span>
                    <span className="stat-value">{userProfile.book_borrowed || 0}</span>
                  </div>
                </div>
              )}
              
              <p className="profile-email">{user.email}</p>
            </div>
          </div>

          <Button 
            onClick={handleLogout}
            className="profile-logout-button"
          >
            Выйти
          </Button>
        </div>

        <div className="profile-right-column">
          {/* Мои книги */}
          <div className="profile-section">
            <h2 className="profile-section-title">
              Мои книги
            </h2>
            
            <div className="profile-books-grid">
              {myBooks.length > 0 ? (
                myBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))
              ) : (
                <p style={{ 
                  gridColumn: '1 / -1', 
                  textAlign: 'center', 
                  color: '#666',
                  padding: '20px'
                }}>
                  У вас пока нет добавленных книг
                </p>
              )}
            </div>
            
            <Button 
              onClick={handleMyBooks}
              className="profile-more-button"
            >
              {myBooks.length > 0 ? 'Все мои книги' : 'Добавить книгу'}
            </Button>
          </div>

          {/* Активные бронирования */}
          <div className="profile-section">
            <h2 className="profile-section-title">
              Активные бронирования
            </h2>
            
            <div className="profile-books-grid">
              {reservations.length > 0 ? (
                reservations.map(book => (
                  <div key={book.id} className="reservation-book">
                    <BookCard book={book} />
                    {book.reservation_status && (
                      <div className="reservation-status">
                        Статус: {book.reservation_status === 'active' ? 'Активно' : 'Ожидание'}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ 
                  gridColumn: '1 / -1', 
                  textAlign: 'center', 
                  color: '#666',
                  padding: '20px'
                }}>
                  Нет активных бронирований
                </p>
              )}
            </div>
            
            <Button 
              onClick={handleReservations}
              className="profile-more-button"
            >
              Все бронирования
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;