import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../UI/Header/Header';
import Button from '../../UI/Button/Button';
import BookCard from '../../UI/Book/BookCard';
import DeleteBookModal from '../../UI/Book/DeleteBookModal';
import './MyBooksPage.css';

const MyBooksPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Загружаем книги пользователя
  useEffect(() => {
    if (user && user.access_token) {
      fetchMyBooks();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMyBooks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://127.0.0.1:8000/users/book/my', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Получаем информацию о бронированиях для каждой книги
        const booksWithReservations = await Promise.all(
          data.map(async (book) => {
            try {
              const resResponse = await fetch(`http://127.0.0.1:8000/books/${book.id}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${user.access_token}`,
                  'Accept': 'application/json'
                }
              });
              
              if (resResponse.ok) {
                const bookDetails = await resResponse.json();
                
                // Проверяем есть ли активные бронирования
                let reservationStatus = 'available';
                let reservedBy = '';
                let daysLeft = null;
                
                if (bookDetails.reservations && bookDetails.reservations.length > 0) {
                  const activeReservation = bookDetails.reservations.find(
                    r => r.status === 'active' || r.status === 'pending'
                  );
                  
                  if (activeReservation) {
                    reservationStatus = 'reserved';
                    reservedBy = activeReservation.reader_username || 'Читатель';
                    
                    // Расчет оставшихся дней (пример)
                    if (activeReservation.end_date) {
                      const endDate = new Date(activeReservation.end_date);
                      const today = new Date();
                      const diffTime = endDate - today;
                      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      daysLeft = daysLeft > 0 ? daysLeft : 0;
                    }
                  }
                }
                
                return {
                  id: book.id,
                  title: book.title,
                  author: book.author,
                  cover_image_uri: book.cover_image_uri,
                  reservationStatus,
                  reservedBy,
                  daysLeft
                };
              }
            } catch (err) {
              console.error(`Ошибка загрузки книги ${book.id}:`, err);
            }
            
            return {
              id: book.id,
              title: book.title,
              author: book.author,
              cover_image_uri: book.cover_image_uri,
              reservationStatus: 'available'
            };
          })
        );
        
        setBooks(booksWithReservations);
      } else {
        const errorText = await response.text();
        console.error('Ошибка загрузки книг:', errorText);
        setError('Не удалось загрузить ваши книги');
      }
    } catch (err) {
      console.error('Ошибка сети:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (book) => {
    if (book.reservationStatus === 'reserved') {
      setSelectedBook(book);
      setShowDeleteModal(true);
    } else {
      // Удаление доступной книги
      if (window.confirm(`Вы уверены, что хотите удалить книгу "${book.title}"?`)) {
        try {
          const response = await fetch(`http://127.0.0.1:8000/books/${book.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${user.access_token}`,
              'Accept': 'application/json'
            }
          });
          
          if (response.ok || response.status === 204) {
            // Удаляем книгу из состояния
            setBooks(books.filter(b => b.id !== book.id));
            alert('Книга успешно удалена');
          } else {
            const errorText = await response.text();
            alert(`Ошибка удаления: ${errorText}`);
          }
        } catch (err) {
          console.error('Ошибка удаления:', err);
          alert('Ошибка при удалении книги');
        }
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBook) return;
    
    try {
      // Сначала отменяем все активные бронирования
      const response = await fetch(`http://127.0.0.1:8000/books/${selectedBook.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok || response.status === 204) {
        setBooks(books.filter(b => b.id !== selectedBook.id));
        alert('Книга и все её бронирования удалены');
      } else {
        const errorText = await response.text();
        alert(`Ошибка удаления: ${errorText}`);
      }
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Ошибка при удалении книги');
    } finally {
      closeModal();
    }
  };

  const handleAddBook = () => {
    navigate('/add-book');
  };

  const closeModal = () => {
    setShowDeleteModal(false);
    setSelectedBook(null);
  };

  const getDaysText = (days) => {
    if (days % 10 === 1 && days % 100 !== 11) return 'день';
    if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20)) return 'дня';
    return 'дней';
  };

  if (!user) {
    return (
      <div className="my-books-page">
        <Header />
        <div style={{ 
          textAlign: 'center', 
          padding: '100px 20px',
          color: '#666'
        }}>
          <h2>Пожалуйста, войдите в систему</h2>
          <Button to="/auth" style={{ marginTop: '20px' }}>
            Войти
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="my-books-page">
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
          <p>Загрузка ваших книг...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-books-page">
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
        </div>
      )}
      
      <div className="main-content">
        <div className="content-wrapper">
          <div className="my-books-header">
            <h1 className="page-title">Мои книги</h1>
          </div>

          <div className="books-list">
            {books.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '50px 20px',
                color: '#666',
                gridColumn: '1 / -1'
              }}>
                <p style={{ fontSize: '18px', marginBottom: '20px' }}>
                  У вас пока нет добавленных книг
                </p>
                <Button onClick={handleAddBook}>
                  Добавить первую книгу
                </Button>
              </div>
            ) : (
              books.map(book => (
                <div key={book.id} className="book-item">
                  <div className="book-info-section">
                    <BookCard book={book} />
                    {book.reservationStatus === 'reserved' && (
                      <div className="reservation-details">
                        <div className="reservation-info">
                          Читает <span className="reader-name">{book.reservedBy}</span>
                        </div>
                        {book.daysLeft !== null && book.daysLeft >= 0 && (
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
                    title={book.reservationStatus === 'reserved' ? 'Книга забронирована, удаление невозможно' : 'Удалить книгу'}
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
              ))
            )}
          </div>

          {/* Кнопка добавления книги */}
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

      {showDeleteModal && selectedBook && (
        <DeleteBookModal 
          book={selectedBook}
          onClose={closeModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default MyBooksPage;