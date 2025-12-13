import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookCard from '../../UI/Book/BookCard';
import SearchBar from '../../UI/Book/SearchBar';
import Header from '../../UI/Header/Header';
import { useAuth } from '../../../context/AuthContext';
import './FoundPage.css'; 

const FoundPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  
  const initialSearchQuery = location.state?.searchQuery || '';
  const initialSearchResults = location.state?.searchResults || [];
  
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [books, setBooks] = useState(initialSearchResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Если пришли с поиском из HomePage, используем эти результаты
  // Если нет - загружаем весь каталог
  useEffect(() => {
    if (initialSearchResults.length === 0 && !searchQuery) {
      fetchAllBooks();
    }
  }, []);

  const fetchAllBooks = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/books/catalog?limit=50', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        const formattedBooks = data.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          cover_image_uri: book.cover_image_uri
        }));
        setBooks(formattedBooks);
      } else {
        setError('Не удалось загрузить книги');
      }
    } catch (err) {
      console.error('Ошибка загрузки каталога:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      // Если пустой запрос - показываем весь каталог
      fetchAllBooks();
      return;
    }
    
    setLoading(true);
    setSearchQuery(query);
    
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/books/search/?query=${encodeURIComponent(query)}&limit=50`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          mode: 'cors'
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const formattedBooks = data.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          cover_image_uri: book.cover_image_uri
        }));
        setBooks(formattedBooks);
      } else {
        setBooks([]);
        setError('Поиск не дал результатов');
      }
    } catch (err) {
      console.error('Ошибка поиска:', err);
      setBooks([]);
      setError('Ошибка при выполнении поиска');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAction = (bookId) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    navigate(`/book/${bookId}`);
  };

  return (
    <div className="page">
      <Header />

      <div className="search-container">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={() => handleSearch(searchQuery)}
        />
      </div>

      {error && (
        <div style={{
          color: '#721c24',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          padding: '15px',
          margin: '20px auto',
          maxWidth: '800px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <section className="popular-books-section">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div style={{ 
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <p style={{ marginTop: '20px', color: '#666' }}>
              {searchQuery ? `Ищем "${searchQuery}"...` : 'Загружаем книги...'}
            </p>
          </div>
        ) : searchQuery || initialSearchQuery ? (
          <>
            <h2 
              className="section-title"
              style={{
                textAlign: 'center',
                margin: '30px 0 20px 0',
                color: '#333',
                fontSize: '28px',
                fontWeight: '600',
                width: '100%'
              }}
            >
              {books.length > 0 
                ? `Нашли ${books.length} ${getBookWord(books.length)}` 
                : 'Ничего не найдено'
              }
            </h2>
            <p style={{ 
              textAlign: 'center', 
              marginBottom: '30px', 
              color: '#666',
              fontSize: '16px'
            }}>
              По запросу: "{searchQuery || initialSearchQuery}"
            </p>
            
            {books.length > 0 ? (
              <div className="books-grid">
                {books.map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                  />
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px' 
              }}>
                <p style={{ 
                  fontSize: '18px', 
                  color: '#666', 
                  marginBottom: '20px' 
                }}>
                  Попробуйте изменить запрос или поискать другие книги
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    fetchAllBooks();
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#711720',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Показать все книги
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <h2 
              className="section-title"
              style={{
                textAlign: 'center',
                margin: '30px 0 20px 0',
                color: '#333',
                fontSize: '28px',
                fontWeight: '600',
                width: '100%'
              }}
            >
              Каталог книг
            </h2>
            <p style={{ 
              textAlign: 'center', 
              marginBottom: '30px', 
              color: '#666',
              fontSize: '16px'
            }}>
              Всего книг: {books.length}
            </p>
            
            {books.length > 0 ? (
              <div className="books-grid">
                {books.map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                  />
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px' 
              }}>
                <p style={{ 
                  fontSize: '18px', 
                  color: '#666' 
                }}>
                  Нет доступных книг в каталоге
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

// Вспомогательная функция для склонения слова "книга"
const getBookWord = (count) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'книг';
  }
  
  if (lastDigit === 1) {
    return 'книга';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'книги';
  }
  
  return 'книг';
};

export default FoundPage;