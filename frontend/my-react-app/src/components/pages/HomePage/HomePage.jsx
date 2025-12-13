import React, { useState } from 'react';
import BookCard from '../../UI/Book/BookCard';
import SearchBar from '../../UI/Book/SearchBar';
import { useNavigate } from 'react-router-dom'; 
import Header from '../../UI/Header/Header';
import { useAuth } from '../../../context/AuthContext'; 
import './HomePage.css'; 

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth(); 
  const isAuthenticated = !!user; 
  const navigate = useNavigate(); 

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
    navigate('/search', { state: { searchQuery: query } });
  };

  const handleBookAction = (bookId) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    console.log('Бронирование книги:', bookId);
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
          Что популярно сейчас!
        </h2>
        
        <div className="books-grid">
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

export default HomePage;