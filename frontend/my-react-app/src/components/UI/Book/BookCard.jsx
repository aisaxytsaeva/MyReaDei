import React from 'react';
import styles from './BookCard.module.css';

const BookCard = ({ book }) => {
  const { id, title, author } = book;

  const handleBookClick = () => {
    window.location.href = `/book/${id}`;
  };

  return (
    <div 
      onClick={handleBookClick} 
      className={styles.bookCard}
    >
      
      <div className={styles.cover}>
        📚
      </div>

      
      <div className={styles.bookInfo}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.author}>{author}</p>
      </div>
    </div>
  );
};

export default BookCard;