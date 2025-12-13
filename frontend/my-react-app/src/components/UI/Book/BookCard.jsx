import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BookCard.module.css';

const BookCard = ({ book }) => {
  const { id, title, author, cover_image_uri } = book; // Добавляем cover_image_uri
  const navigate = useNavigate();

  const handleBookClick = () => {
    navigate(`/book/${id}`);
  };

  return (
    <div 
      onClick={handleBookClick} 
      className={styles.bookCard}
    >
      
      <div className={styles.cover}>
        {cover_image_uri ? (
          <img 
            src={`http://127.0.0.1:8000${cover_image_uri}`} // Показываем обложку
            alt={title}
            className={styles.coverImage}
          />
        ) : (
          <div className={styles.coverPlaceholder}>📚</div> // Заглушка если нет обложки
        )}
      </div>

      
      <div className={styles.bookInfo}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.author}>{author}</p>
      </div>
    </div>
  );
};

export default BookCard;