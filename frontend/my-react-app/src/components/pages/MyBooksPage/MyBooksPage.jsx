import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../UI/Header/Header';
import Button from '../../UI/Button/Button';
import BookCard from '../../UI/Book/BookCard';
import DeleteBookModal from '../../UI/Book/DeleteBookModal';
import './MyBooksPage.css';

const MyBooksPage = () => {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  const [books, setBooks] = useState([
    { 
      id: 1, 
      title: 'Мастер и Маргарита', 
      author: 'Михаил Булгаков',
      reservationStatus: 'available'
    },
    { 
      id: 2, 
      title: 'Война и мир', 
      author: 'Лев Толстой',
      reservationStatus: 'reserved',
      reservedBy: 'Александр',
      daysLeft: 7 // Добавили срок бронирования
    },
    { 
      id: 3, 
      title: '1984', 
      author: 'Джордж Оруэлл',
      reservationStatus: 'reserved',
      reservedBy: 'Dmitry',
      daysLeft: 3 // Добавили срок бронирования
    },
    { 
      id: 4, 
      title: 'Преступление и наказание', 
      author: 'Федор Достоевский',
      reservationStatus: 'available'
    },
    { 
      id: 5, 
      title: 'Гарри Поттер и философский камень', 
      author: 'Джоан Роулинг',
      reservationStatus: 'available'
    }
  ]);

  const handleDeleteClick = (book) => {
    if (book.reservationStatus === 'reserved') {
      setSelectedBook(book);
      setShowDeleteModal(true);
    } else {
      // Логика удаления доступной книги
      setBooks(books.filter(b => b.id !== book.id));
    }
  };

  const handleAddBook = () => {
    // Логика добавления новой книги
    navigate('/add-book');
  };

  const closeModal = () => {
    setShowDeleteModal(false);
    setSelectedBook(null);
  };

  // Вспомогательная функция для правильного склонения слова "день"
  const getDaysText = (days) => {
    if (days % 10 === 1 && days % 100 !== 11) return 'день';
    if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20)) return 'дня';
    return 'дней';
  };

  return (
    <div className="my-books-page">
      <div className="fixed-header">
        <Header />
      </div>
      
      <div className="main-content">
        <div className="content-wrapper">
          <div className="my-books-header">
            <h1 className="page-title">Мои книги</h1>
          </div>

          <div className="books-list">
            {books.map(book => (
              <div key={book.id} className="book-item">
                <div className="book-info-section">
                  <BookCard book={book} />
                  {book.reservationStatus === 'reserved' && (
                    <div className="reservation-details">
                      <div className="reservation-info">
                        Читает <span className="reader-name">{book.reservedBy}</span>
                      </div>
                      {book.daysLeft && (
                        <div className="days-left-info">
                          До конца бронирования:{" "}
                          <span className={`days-count ${book.daysLeft <= 3 ? 'warning' : ''}`}>
                            {book.daysLeft} {getDaysText(book.daysLeft)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleDeleteClick(book)}
                  className={`delete-button ${book.reservationStatus === 'reserved' ? 'reserved' : ''}`}
                  aria-label="Удалить книгу"
                  disabled={book.reservationStatus === 'reserved'}
                >
                  <img 
                    src="/assets/delete_icon.svg" 
                    alt="Удалить" 
                    className="delete-icon"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '✕';
                    }}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Кнопка добавления книги - квадратная 80x80 */}
          <button 
            onClick={handleAddBook}
            className="add-book-button"
            aria-label="Добавить книгу"
          >
            <img 
              src="/assets/plus_icon.svg" 
              alt="Добавить" 
              className="plus-icon"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '+';
              }}
            />
          </button>
        </div>
      </div>

      {/* Модальное окно для забронированных книг */}
      {showDeleteModal && selectedBook && (
        <DeleteBookModal 
          book={selectedBook}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default MyBooksPage;