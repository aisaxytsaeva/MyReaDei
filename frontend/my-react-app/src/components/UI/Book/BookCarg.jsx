import React from 'react';

const BookCard = ({ book }) => {
  const { id, title, author } = book;

  const handleBookClick = () => {
   
    window.location.href = `/book/${id}`;
  };

  return (
    <div onClick={handleBookClick} style={{ cursor: 'pointer' }}>
      <div>
        📚
      </div>

      <h3>{title}</h3>
      
      <p>{author}</p>
    </div>
  );
};

export default BookCard;