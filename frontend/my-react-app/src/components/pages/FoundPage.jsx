import React, { useState } from 'react';
import BookCard from '../UI/Book/BookCarg';
import SearchBar from '../UI/Book/SearchBar';

const FoundPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const isAuthenticated = false;

  const popularBooks = [
    { id: 1, title: 'Мастер и Маргарита', author: 'Михаил Булгаков' },
    { id: 2, title: '1984', author: 'Джордж Оруэлл' },
    { id: 3, title: 'Преступление и наказание', author: 'Федор Достоевский' },
    { id: 4, title: 'Гарри Поттер', author: 'Дж. К. Роулинг' },
    { id: 5, title: 'Война и мир', author: 'Лев Толстой' },
    { id: 6, title: 'Маленький принц', author: 'Антуан де Сент-Экзюпери' }
  ];

  const handleSearch = (query) => {
    console.log('Поиск:', query);
    // Логика поиска
  };

  const handleBookAction = (bookId) => {
    console.log('Бронирование книги:', bookId);
  };

  return (
    <div>
      <header>
        <h1>MyReaDei</h1>
        {isAuthenticated ? (
          <div>
            
            
          </div>
        ) : (
          <div>
            <button onClick={() => window.location.href = '/auth'}>Войти</button>
            
          </div>
        )}
      </header>

      
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
      />

      <section>
        <h2>Нашли несколько вариантов!</h2>
        
        <div>
          {popularBooks.map(book => (
            <BookCard
              key={book.id}
              book={book}
              isAuthenticated={isAuthenticated}
              onBookAction={handleBookAction}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default FoundPage;