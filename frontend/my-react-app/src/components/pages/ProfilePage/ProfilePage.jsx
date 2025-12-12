import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../../UI/Header/Header';
import Button from '../../UI/Button/Button';
import BookCard from '../../UI/Book/BookCard';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const mockBooks = [
    { id: 1, title: 'Война и мир', author: 'Лев Толстой' },
    { id: 2, title: 'Преступление и наказание', author: 'Федор Достоевский' },
    { id: 3, title: 'Мастер и Маргарита', author: 'Михаил Булгаков' }
  ];

  if (!user) {
    return (
      <div>
        <Header />
        <div className="profile-unauthorized-container">
          <h2>Пожалуйста, войдите в систему</h2>
          <Button href="/auth">Войти</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Header />
      
      <div className="profile-main-content">
        

        <div className="profile-left-column">
          <div className="profile-card">
            <img src="/assets/profile.svg" alt="Профиль" />
            
            <div>
              <h2 className="profile-user-name">
                {user.name}
              </h2>
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

          <div>
            <h2 className="profile-section-title">
              Мои книги
            </h2>
            
            <div className="profile-books-grid">
              {mockBooks.slice(0, 3).map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
            
            <Button 
              onClick={handleMyBooks}
              className="profile-more-button"
            >
              Ещё
            </Button>
          </div>

          <div>
            <h2 className="profile-section-title">
              Забронированные книги
            </h2>
            
            <div className="profile-books-grid">
              {mockBooks.slice(0, 3).map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
            
            <Button 
              onClick={handleReservations}
              className="profile-more-button"
            >
              Ещё
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;