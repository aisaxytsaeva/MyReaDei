import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../UI/Header/Header';
import BookCard from '../../UI/Book/BookCard';
import './ReservedBooksPage.css';

const ReservedBooksPage = () => {
  const navigate = useNavigate();

  // Только книги, забронированные текущим пользователем
  const userReservedBooks = [
    { 
      id: 1, 
      title: 'Война и мир', 
      author: 'Лев Толстой',
      daysLeft: 7,
      cover: '📚'
    },
    { 
      id: 2, 
      title: '1984', 
      author: 'Джордж Оруэлл',
      daysLeft: 3,
      cover: '📚'
    },
    { 
      id: 5, 
      title: 'Гарри Поттер и философский камень', 
      author: 'Джоан Роулинг',
      daysLeft: 5,
      cover: '📚'
    },
    { 
      id: 6, 
      title: 'Маленький принц', 
      author: 'Антуан де Сент-Экзюпери',
      daysLeft: 12,
      cover: '📚'
    }
  ];

  const handleReturnBook = (bookId) => {
    // Логика возврата книги
    console.log(`Возврат книги с ID: ${bookId}`);
    alert(`Книга успешно сдана!`);
    // Здесь можно обновить состояние или сделать API запрос
  };

  const handleBackToProfile = () => {
    navigate('/profile');
  };

  const handleBookClick = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  return (
    <div className="reserved-books-page">
      <div className="fixed-header">
        <Header />
      </div>
      
      <div className="main-content">
        <div className="content-wrapper">
          <div className="reserved-books-header">
            <h1 className="page-title">Забронированные книги</h1>
          </div>

          <div className="reserved-books-list">
            {userReservedBooks.length > 0 ? (
              userReservedBooks.map(book => (
                <div key={book.id} className="reserved-book-item">
                  <div className="book-info-section">
                    <div 
                      className="book-card-container"
                      onClick={() => handleBookClick(book.id)}
                    >
                      <BookCard book={book} />
                    </div>
                    
                    <div className="reservation-details">
                      <div className="days-left-info">
                        До конца бронирования осталось:{" "}
                        <span className={`days-count ${book.daysLeft <= 3 ? 'warning' : ''}`}>
                          {book.daysLeft} {getDaysText(book.daysLeft)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleReturnBook(book.id)}
                    className="return-button"
                  >
                    Сдать
                  </button>
                </div>
              ))
            ) : (
              <div className="no-books-message">
                <p>У вас нет забронированных книг</p>
                <button 
                  onClick={() => navigate('/books')}
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

export default ReservedBooksPage;