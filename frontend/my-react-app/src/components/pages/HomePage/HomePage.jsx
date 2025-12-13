import React, { useState, useEffect } from 'react';
import BookCard from '../../UI/Book/BookCard';
import SearchBar from '../../UI/Book/SearchBar';
import { useNavigate } from 'react-router-dom'; 
import Header from '../../UI/Header/Header';
import { useAuth } from '../../../context/AuthContext'; 
import './HomePage.css'; 

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [popularBooks, setPopularBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth(); 
  const isAuthenticated = !!user; 
  const navigate = useNavigate(); 

  // Загружаем популярные книги с бэкенда
  useEffect(() => {
    fetchPopularBooks();
  }, []);

  const fetchPopularBooks = async () => {
    try {
      setLoading(true);
      console.log('📥 Загружаем популярные книги...');
      
      const response = await fetch('http://127.0.0.1:8000/books/popular/?limit=6', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      console.log('📤 Ответ сервера:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Получены книги:', data);
        
        // Преобразуем данные для совместимости с BookCard
        const formattedBooks = data.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          cover_image_uri: book.cover_image_uri,
          readers_count: book.readers_count || 0
        }));
        
        setPopularBooks(formattedBooks);
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка загрузки книг:', errorText);
        setError('Не удалось загрузить книги');
        
        // Fallback на демо-данные если бэкенд недоступен
        setPopularBooks(getDemoBooks());
      }
    } catch (err) {
      console.error('❌ Ошибка сети:', err);
      setError('Ошибка подключения к серверу');
      setPopularBooks(getDemoBooks());
    } finally {
      setLoading(false);
    }
  };

  const getDemoBooks = () => {
    return [
      { id: 1, title: 'Мастер и Маргарита', author: 'Михаил Булгаков' },
      { id: 2, title: '1984', author: 'Джордж Оруэлл' },
      { id: 3, title: 'Преступление и наказание', author: 'Федор Достоевский' },
      { id: 4, title: 'Гарри Поттер', author: 'Дж. К. Роулинг' },
      { id: 5, title: 'Война и мир', author: 'Лев Толстой' },
      { id: 6, title: 'Маленький принц', author: 'Антуан де Сент-Экзюпери' }
    ];
  };

  const handleSearch = async (query) => {
    if (!query.trim()) return;
    
    console.log('🔍 Поиск книги:', query);
    
    try {
      // Прямой поиск через API
      const response = await fetch(`http://127.0.0.1:8000/books/search/?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
      
      if (response.ok) {
        const searchResults = await response.json();
        console.log('🔍 Результаты поиска:', searchResults);
        
        // Переходим на страницу результатов поиска
        navigate('/search', { 
          state: { 
            searchQuery: query,
            searchResults: searchResults 
          } 
        });
      } else {
        // Fallback: переходим с пустыми результатами
        navigate('/search', { 
          state: { 
            searchQuery: query,
            searchResults: [] 
          } 
        });
      }
    } catch (err) {
      console.error('❌ Ошибка поиска:', err);
      // Fallback: переходим с пустыми результатами
      navigate('/search', { 
        state: { 
          searchQuery: query,
          searchResults: [] 
        } 
      });
    }
  };

  const handleBookAction = (bookId) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    console.log('📖 Переход к книге:', bookId);
    navigate(`/book/${bookId}`);
  };

  const handleBookClick = (bookId) => {
    console.log('🖱️ Клик по книге:', bookId);
    navigate(`/book/${bookId}`);
  };

  return (
    <div className="page">
      <Header />
      
      <div className="search-container">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearch}
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
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          {error} (используются демо-данные)
        </div>
      )}

      <section className="popular-books-section">
        <h2 
          className="section-title"
          style={{
            textAlign: 'center',
            margin: '30px 0',
            color: '#333',
            fontSize: '28px',
            fontWeight: '600',
            width: '100%'
          }}
        >
          {loading ? 'Загрузка...' : 'Что популярно сейчас!'}
        </h2>
        
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
          </div>
        ) : (
          <div className="books-grid">
            {popularBooks.map(book => (
              <div key={book.id} onClick={() => handleBookClick(book.id)} style={{ cursor: 'pointer' }}>
                <BookCard
                  book={book}
                  isAuthenticated={isAuthenticated}
                  onBookAction={() => handleBookAction(book.id)}
                  showReadersCount={true}
                />
              </div>
            ))}
          </div>
        )}
        
      </section>
    </div>
  );
};

export default HomePage;