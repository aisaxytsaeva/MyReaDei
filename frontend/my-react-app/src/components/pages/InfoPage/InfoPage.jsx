import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import BookingMenu from '../../UI/Book/BookingMenu';
import Button from '../../UI/Button/Button';
import Header from '../../UI/Header/Header';
import './InfoPage.css';

const InfoPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [isBookingMenuOpen, setIsBookingMenuOpen] = useState(false);

  
  const book = {
    id: 1,
    title: "Война и мир I-II том",
    author: "Толстой Л.Н",
    description: "Описание книги, в которых можно написать что угодно",
    location: "книжный шкаф в кофе 'Фондол'",
    owner: { id: 1, name: "Artyom_X" },
    image: '/assets/cover.png' 
  };

  
  const isOwner = user && user.id === book.owner.id;

  const handleMapClick = () => {
    console.log('Открыть карту');
  };

  const handleReserve = () => {
    console.log('Открыть меню бронирования');
    setIsBookingMenuOpen(true);
  };

  const handleBookConfirm = (period) => {
    console.log(`Книга "${book.title}" забронирована на ${period} дней пользователем ${user.name}`);
    alert(`Книга "${book.title}" забронирована на ${period} дней!`);
  };

  const handleLogin = () => {
    window.location.href = '/auth';
  };

  const handleEdit = () => {
    console.log('Редактировать книгу:', book.id);
    // Логика редактирования
  };

  const handleDelete = () => {
    console.log('Удалить книгу:', book.id);
    if (confirm('Вы уверены, что хотите удалить эту книгу?')) {
      // Логика удаления
      alert('Книга удалена!');
      window.location.href = '/home';
    }
  };

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
          {/* Левая часть - обложка книги */}
          <div className="book-cover-section">
            <div className="book-cover">
              {book.image ? (
                <img src={book.image} alt={book.title} className="book-image" />
              ) : (
                <div className="book-placeholder">📚</div>
              )}
            </div>
            
            {/* Все действия с книгой под обложкой */}
            <div className="action-buttons-container">
              {/* Неавторизованный пользователь */}
              {!user && (
                <Button onClick={handleLogin} className="action-button login">
                  Войти для бронирования
                </Button>
              )}
              
              {/* Авторизованный пользователь (не владелец) */}
              {user && !isOwner && (
                <Button onClick={handleReserve} className="action-button reserve">
                  Забронировать
                </Button>
              )}
              
              {/* Владелец книги */}
              {isOwner && (
                <div className="owner-buttons">
                  <Button onClick={handleEdit} className="action-button edit">
                    Редактировать
                  </Button>
                  <Button onClick={handleDelete} variant="secondary" className="action-button delete">
                    Удалить
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Правая часть - информация о книге */}
          <div className="book-info-section">
            {/* Название и автор */}
            <div className="book-header">
              <h1 className="book-title">{book.title}</h1>
              <h2 className="book-author">{book.author}</h2>
            </div>

            {/* Описание */}
            <div className="info-container">
              <h3 className="section-title">Описание</h3>
              <p className="book-description">{book.description}</p>
            </div>

            {/* Место хранения */}
            <div className="info-container">
              <h3 className="section-title">Место хранения</h3>
              <div className="location-content">
                <p className="book-location">{book.location}</p>
                <Button onClick={handleMapClick} className="map-button">
                  Посмотреть на карте
                </Button>
              </div>
            </div>

            {/* Владелец */}
            <div className="info-container">
              <h3 className="section-title">Владелец книги</h3>
              <p className="book-owner">{book.owner.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoPage;