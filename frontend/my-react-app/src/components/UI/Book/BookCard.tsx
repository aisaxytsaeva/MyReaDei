import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./BookCard.module.css";

type Book = {
  id: number | string;
  title?: string;
  author?: string;
  cover_image_uri?: string | null;
};

type Props = {
  book: Book;
};

const BookCard: React.FC<Props> = ({ book }) => {
  const { id, title, author, cover_image_uri } = book;
  const navigate = useNavigate();

  const handleBookClick = (): void => {
    navigate(`/book/${id}`);
  };

  return (
    <div onClick={handleBookClick} className={styles.bookCard}>
      <div className={styles.cover}>
        {cover_image_uri ? (
          <img
            src={`http://127.0.0.1:8000${cover_image_uri}`}
            alt={title ?? "Book cover"}
            className={styles.coverImage}
          />
        ) : (
          <div className={styles.coverPlaceholder}>📚</div>
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
