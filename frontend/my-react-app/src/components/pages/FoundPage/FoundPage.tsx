// src/components/pages/FoundPage/FoundPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BookCard from "../../UI/Book/BookCard";
import SearchBar from "../../UI/Book/SearchBar";
import Header from "../../UI/Header/Header";
import { useAuth } from "../../../context/AuthContext";
import "./FoundPage.css";

import { bookApi, type Id, type Book } from "../../../lib/api";

type CardBook = {
  id: Id;
  title: string;
  author: string;
  cover_image_uri?: string | null;
};

// склонение слова "книга"
const getBookWord = (count: number): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return "книг";
  if (lastDigit === 1) return "книга";
  if (lastDigit >= 2 && lastDigit <= 4) return "книги";
  return "книг";
};

type LocationState = {
  searchQuery?: string;
  searchResults?: unknown[];
};

const normalizeToCardBooks = (items: unknown[]): CardBook[] => {
  return items
    .map((b: any) => ({
      id: b?.id,
      title: b?.title ?? "Без названия",
      author: b?.author ?? "Неизвестный автор",
      cover_image_uri: b?.cover_image_uri ?? null,
    }))
    .filter((b) => b.id !== undefined && b.id !== null);
};

const FoundPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const isAuthenticated = !!user && !!token;

  const state = (location.state ?? {}) as LocationState;
  const initialSearchQuery = state.searchQuery ?? "";
  const initialSearchResults = Array.isArray(state.searchResults) ? state.searchResults : [];

  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [books, setBooks] = useState<CardBook[]>(
    normalizeToCardBooks(initialSearchResults)
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Если пришли без результатов и без запроса — грузим каталог
  useEffect(() => {
    if (initialSearchResults.length === 0 && !searchQuery) {
      void fetchAllBooks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllBooks = async (): Promise<void> => {
    setLoading(true);
    setError("");

    try {
      // getCatalog(skip, limit) => /books/catalog?skip&limit
      const resp = await bookApi.getCatalog(0, 50);
      const data = resp.data as Book[];

      setBooks(
        data.map((b: any) => ({
          id: b.id,
          title: b.title ?? "Без названия",
          author: b.author ?? "Неизвестный автор",
          cover_image_uri: b.cover_image_uri ?? null,
        }))
      );
    } catch (err) {
      console.error("Ошибка загрузки каталога:", err);
      setError("Ошибка подключения к серверу");
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string): Promise<void> => {
    const q = query.trim();

    if (!q) {
      setSearchQuery("");
      await fetchAllBooks();
      return;
    }

    setLoading(true);
    setError("");
    setSearchQuery(q);

    try {
      // В api.ts searchBooks использует параметр q (не query)
      const resp = await bookApi.searchBooks(q, 0, 50);
      const data = resp.data as Book[];

      const formatted = data.map((b: any) => ({
        id: b.id,
        title: b.title ?? "Без названия",
        author: b.author ?? "Неизвестный автор",
        cover_image_uri: b.cover_image_uri ?? null,
      }));

      setBooks(formatted);

      if (formatted.length === 0) setError("Поиск не дал результатов");
    } catch (err) {
      console.error("Ошибка поиска:", err);
      setBooks([]);
      setError("Ошибка при выполнении поиска");
    } finally {
      setLoading(false);
    }
  };

  const handleBookAction = (bookId: Id): void => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    navigate(`/book/${bookId}`);
  };

  const onShowAllBooks = (): void => {
    setSearchQuery("");
    void fetchAllBooks();
  };

  const isSearchMode = !!(searchQuery || initialSearchQuery);

  return (
    <div className="page">
      <Header />

      <div className="search-container">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={(q) => void handleSearch(q)}
        />
      </div>

      {error && (
        <div
          style={{
            color: "#721c24",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "5px",
            padding: "15px",
            margin: "20px auto",
            maxWidth: "800px",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      <section className="popular-books-section">
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <div
              style={{
                display: "inline-block",
                width: "40px",
                height: "40px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #3498db",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <p style={{ marginTop: "20px", color: "#666" }}>
              {searchQuery ? `Ищем "${searchQuery}"...` : "Загружаем книги..."}
            </p>
          </div>
        ) : isSearchMode ? (
          <>
            <h2
              className="section-title"
              style={{
                textAlign: "center",
                margin: "30px 0 20px 0",
                color: "#333",
                fontSize: "28px",
                fontWeight: 600,
                width: "100%",
              }}
            >
              {books.length > 0 ? `Нашли ${books.length} ${getBookWord(books.length)}` : "Ничего не найдено"}
            </h2>

            <p
              style={{
                textAlign: "center",
                marginBottom: "30px",
                color: "#666",
                fontSize: "16px",
              }}
            >
              По запросу: "{searchQuery || initialSearchQuery}"
            </p>

            {books.length > 0 ? (
              <div className="books-grid">
                {books.map((book) => (
                  <div
                    key={String(book.id)}
                    onClick={() => handleBookAction(book.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <BookCard book={book} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p style={{ fontSize: "18px", color: "#666", marginBottom: "20px" }}>
                  Попробуйте изменить запрос или поискать другие книги
                </p>

                <button
                  onClick={onShowAllBooks}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#711720",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                  type="button"
                >
                  Показать все книги
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <h2
              className="section-title"
              style={{
                textAlign: "center",
                margin: "30px 0 20px 0",
                color: "#333",
                fontSize: "28px",
                fontWeight: 600,
                width: "100%",
              }}
            >
              Каталог книг
            </h2>

            <p
              style={{
                textAlign: "center",
                marginBottom: "30px",
                color: "#666",
                fontSize: "16px",
              }}
            >
              Всего книг: {books.length}
            </p>

            {books.length > 0 ? (
              <div className="books-grid">
                {books.map((book) => (
                  <div
                    key={String(book.id)}
                    onClick={() => handleBookAction(book.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <BookCard book={book} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p style={{ fontSize: "18px", color: "#666" }}>
                  Нет доступных книг в каталоге
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default FoundPage;
