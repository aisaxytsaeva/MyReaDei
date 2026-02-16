// src/components/pages/MyBooksPage/MyBooksPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Header from "../../UI/Header/Header";
import Button from "../../UI/Button/Button";
import BookCard from "../../UI/Book/BookCard";
import DeleteBookModal from "../../UI/Book/DeleteBookModal";
import "./MyBooksPage.css";

import { bookApi, type Id } from "../../../lib/api";

type MyBookItem = {
  id: Id;
  title: string;
  author: string;
  cover_image_uri?: string | null;

  reservationStatus: "available" | "reserved";
  reservedBy: string;
  daysLeft?: number | null;
};

const MyBooksPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedBook, setSelectedBook] = useState<MyBookItem | null>(null);
  const [books, setBooks] = useState<MyBookItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (user && token) {
      void fetchMyBooks();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const fetchMyBooks = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      // ВАЖНО: в api.ts должен быть метод:
      // getMyUserBooks: () => api.get<Book[]>("/users/book/my")
      const response = await bookApi.getMyUserBooks();

      const data = response.data as Array<{
        id: Id;
        title?: string;
        author?: string;
        cover_image_uri?: string | null;
      }>;

      const booksWithReservations: MyBookItem[] = await Promise.all(
        data.map(async (b) => {
          const base: MyBookItem = {
            id: b.id,
            title: b.title ?? "Без названия",
            author: b.author ?? "Неизвестный автор",
            cover_image_uri: b.cover_image_uri ?? null,
            reservationStatus: "available",
            reservedBy: "",
            daysLeft: null,
          };

          try {
            const detailsResp = await bookApi.getBookById(b.id);
            const bookDetails = detailsResp.data as any;

            const reservations = Array.isArray(bookDetails?.reservations)
              ? (bookDetails.reservations as any[])
              : [];

            const activeReservation = reservations.find(
              (r) => r?.status === "active" || r?.status === "pending"
            );

            if (!activeReservation) return base;

            let daysLeft: number | null = null;
            if (activeReservation?.end_date) {
              const endDate = new Date(activeReservation.end_date);
              const today = new Date();
              const diffMs = endDate.getTime() - today.getTime();
              const calc = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              daysLeft = calc > 0 ? calc : 0;
            }

            return {
              ...base,
              reservationStatus: "reserved",
              reservedBy: activeReservation.reader_username || "Читатель",
              daysLeft,
            };
          } catch (err) {
            console.error(`Ошибка загрузки книги ${b.id}:`, err);
            return base;
          }
        })
      );

      setBooks(booksWithReservations);
    } catch (err) {
      console.error("Ошибка загрузки книг:", err);
      setError("Не удалось загрузить ваши книги");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (book: MyBookItem): Promise<void> => {
    if (book.reservationStatus === "reserved") {
      setSelectedBook(book);
      setShowDeleteModal(true);
      return;
    }

    if (!window.confirm(`Вы уверены, что хотите удалить книгу "${book.title}"?`)) {
      return;
    }

    try {
      await bookApi.deleteBook(book.id);
      setBooks((prev) => prev.filter((b) => String(b.id) !== String(book.id)));
      alert("Книга успешно удалена");
    } catch (err) {
      console.error("Ошибка удаления:", err);
      alert("Ошибка при удалении книги");
    }
  };

  const closeModal = (): void => {
    setShowDeleteModal(false);
    setSelectedBook(null);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedBook) return;

    try {
      await bookApi.deleteBook(selectedBook.id);
      setBooks((prev) =>
        prev.filter((b) => String(b.id) !== String(selectedBook.id))
      );
      alert("Книга и все её бронирования удалены");
    } catch (err) {
      console.error("Ошибка удаления:", err);
      alert("Ошибка при удалении книги");
    } finally {
      closeModal();
    }
  };

  const handleAddBook = (): void => {
    navigate("/add-book");
  };

  const getDaysText = (days: number): string => {
    if (days % 10 === 1 && days % 100 !== 11) return "день";
    if (
      days % 10 >= 2 &&
      days % 10 <= 4 &&
      (days % 100 < 10 || days % 100 >= 20)
    )
      return "дня";
    return "дней";
  };

  if (!user || !token) {
    return (
      <div className="my-books-page">
        <Header />
        <div
          style={{
            textAlign: "center",
            padding: "100px 20px",
            color: "#666",
          }}
        >
          <h2>Пожалуйста, войдите в систему</h2>
          <Button to="/auth" style={{ marginTop: "20px" }}>
            Войти
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="my-books-page">
        <Header />
        <div
          style={{
            textAlign: "center",
            padding: "100px 20px",
            color: "#666",
          }}
        >
          <div
            style={{
              display: "inline-block",
              width: "40px",
              height: "40px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "20px",
            }}
          />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p>Загрузка ваших книг...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-books-page">
      <div className="fixed-header">
        <Header />
      </div>

      {error && (
        <div
          style={{
            margin: "20px auto",
            maxWidth: "800px",
            padding: "15px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            borderRadius: "5px",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      <div className="main-content">
        <div className="content-wrapper">
          <div className="my-books-header">
            <h1 className="page-title">Мои книги</h1>
          </div>

          <div className="books-list">
            {books.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "50px 20px",
                  color: "#666",
                  gridColumn: "1 / -1",
                }}
              >
                <p style={{ fontSize: "18px", marginBottom: "20px" }}>
                  У вас пока нет добавленных книг
                </p>
                <Button onClick={handleAddBook}>Добавить первую книгу</Button>
              </div>
            ) : (
              books.map((book) => (
                <div key={String(book.id)} className="book-item">
                  <div className="book-info-section">
                    <BookCard book={book} />

                    {book.reservationStatus === "reserved" && (
                      <div className="reservation-details">
                        <div className="reservation-info">
                          Читает{" "}
                          <span className="reader-name">{book.reservedBy}</span>
                        </div>

                        {typeof book.daysLeft === "number" && book.daysLeft >= 0 && (
                          <div className="days-left-info">
                            До конца бронирования:{" "}
                            <span
                              className={`days-count ${
                                book.daysLeft <= 3 ? "warning" : ""
                              }`}
                            >
                              {book.daysLeft} {getDaysText(book.daysLeft)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => void handleDeleteClick(book)}
                    className={`delete-button ${
                      book.reservationStatus === "reserved" ? "reserved" : ""
                    }`}
                    aria-label="Удалить книгу"
                    title={
                      book.reservationStatus === "reserved"
                        ? "Книга забронирована, удаление невозможно"
                        : "Удалить книгу"
                    }
                    type="button"
                  >
                    <img
                      src="/assets/delete_icon.svg"
                      alt="Удалить"
                      className="delete-icon"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.style.display = "none";
                        if (img.parentElement) img.parentElement.innerHTML = "✕";
                      }}
                    />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Кнопка добавления книги */}
          <button
            onClick={handleAddBook}
            className="add-book-button"
            aria-label="Добавить книгу"
            type="button"
          >
            <img
              src="/assets/plus_icon.svg"
              alt="Добавить"
              className="plus-icon"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                const img = e.currentTarget;
                img.onerror = null;
                img.style.display = "none";
                if (img.parentElement) img.parentElement.innerHTML = "+";
              }}
            />
          </button>
        </div>
      </div>

      {showDeleteModal && selectedBook && (
        <DeleteBookModal
          book={selectedBook}
          onClose={closeModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default MyBooksPage;
