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

  // Функция для получения правильного URL обложки
  const getImageUrl = (uri: string | null | undefined): string | null => {
    if (!uri) return null;
    
    // Если URL уже полный (начинается с http:// или https://)
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }
    
    // Если относительный URL (начинается с /)
    if (uri.startsWith('/')) {
      return `http://localhost:8000${uri}`;
    }
    
    // Если что-то другое
    return uri;
  };

  const imageUrl = getImageUrl(cover_image_uri);

  console.log("BookCard - cover_image_uri:", cover_image_uri);
  console.log("BookCard - imageUrl:", imageUrl);

  return (
    <div onClick={handleBookClick} className={styles.bookCard}>
      <div className={styles.cover}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title ?? "Book cover"}
            className={styles.coverImage}
            onError={(e) => {
              console.error("Failed to load image:", imageUrl);
              e.currentTarget.style.display = "none";
              const placeholder = e.currentTarget.parentElement?.querySelector('.coverPlaceholder');
              if (placeholder) {
                (placeholder as HTMLElement).style.display = "flex";
              }
            }}
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