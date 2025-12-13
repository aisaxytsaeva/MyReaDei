import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookCard from '../../UI/Book/BookCard';
import SearchBar from '../../UI/Book/SearchBar';
import Header from '../../UI/Header/Header';
import './FoundPage.css'; 

const FoundPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const initialSearchQuery = location.state?.searchQuery || '';
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const isAuthenticated = false;

  
  const allBooks = [
    { id: 1, title: 'Мастер и Маргарита', author: 'Михаил Булгаков' },
    { id: 2, title: '1984', author: 'Джордж Оруэлл' },
    { id: 3, title: 'Преступление и наказание', author: 'Федор Достоевский' },
    { id: 4, title: 'Гарри Поттер и философский камень', author: 'Дж. К. Роулинг' },
    { id: 5, title: 'Война и мир', author: 'Лев Толстой' },
    { id: 6, title: 'Маленький принц', author: 'Антуан де Сент-Экзюпери' },
    { id: 7, title: 'Три товарища', author: 'Эрих Мария Ремарк' },
    { id: 8, title: 'Унесенные ветром', author: 'Маргарет Митчелл' },
    { id: 9, title: 'Гордость и предубеждение', author: 'Джейн Остин' },
    { id: 10, title: 'Властелин колец', author: 'Дж. Р. Р. Толкин' },
    { id: 11, title: 'Анна Каренина', author: 'Лев Толстой' },
    { id: 12, title: 'Сто лет одиночества', author: 'Габриэль Гарсиа Маркес' }
  ];

  
  const searchBooks = (query) => {
    if (!query.trim()) {
      return []; 
    }

    const lowerCaseQuery = query.toLowerCase();
    
    return allBooks.filter(book => {
      const titleMatch = book.title.toLowerCase().includes(lowerCaseQuery);
      const authorMatch = book.author.toLowerCase().includes(lowerCaseQuery);
      
      return titleMatch || authorMatch;
    });
  };

  
  useEffect(() => {
    const results = searchBooks(searchQuery);
    setFilteredBooks(results);
  }, [searchQuery]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleBookAction = (bookId) => {
    console.log('Бронирование книги:', bookId);
  };

 
  const searchResults = filteredBooks;

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

      <section className="popular-books-section">
        {searchQuery ? (
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
              {searchResults.length > 0 
                ? `Нашли ${searchResults.length} вариант(ов)!` 
                : 'Ничего не найдено'
              }
            </h2>
            <p style={{ 
              textAlign: 'center', 
              marginBottom: '30px', 
              color: '#666',
              fontSize: '16px'
            }}>
              По запросу: "{searchQuery}"
            </p>
            
            {searchResults.length > 0 ? (
              <div className="books-grid">
                {searchResults.map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    isAuthenticated={isAuthenticated}
                    onBookAction={handleBookAction}
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
              </div>
            )}
          </>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px' 
          }}>
            <h2 
              className="section-title"
              style={{
                textAlign: 'center',
                marginBottom: '20px',
                color: '#333',
                fontSize: '28px',
                fontWeight: '600'
              }}
            >
              Введите поисковый запрос
            </h2>
            <p style={{ 
              fontSize: '18px', 
              color: '#666' 
            }}>
              Начните поиск книг по названию или автору
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default FoundPage;
