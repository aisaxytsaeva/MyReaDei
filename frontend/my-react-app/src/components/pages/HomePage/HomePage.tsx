// src/components/pages/HomePage/HomePage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BookCard from "../../UI/Book/BookCard";
import SearchBar from "../../UI/Book/SearchBar";
import Header from "../../UI/Header/Header";
import { useAuth } from "../../../context/AuthContext";
import "./HomePage.css";

import { bookApi, type Id, type Book } from "../../../lib/api";

type HomeBookCard = {
  id: Id;
  title: string;
  author: string;
  cover_image_uri?: string | null;
  readers_count?: number;
};

const getDemoBooks = (): HomeBookCard[] => [
  { id: 1, title: "Мастер и Маргарита", author: "Михаил Булгаков" },
  { id: 2, title: "1984", author: "Джордж Оруэлл" },
  { id: 3, title: "Преступление и наказание", author: "Федор Достоевский" },
  { id: 4, title: "Гарри Поттер", author: "Дж. К. Роулинг" },
  { id: 5, title: "Война и мир", author: "Лев Толстой" },
  { id: 6, title: "Маленький принц", author: "Антуан де Сент-Экзюпери" },
];

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [popularBooks, setPopularBooks] = useState<HomeBookCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const { user, token } = useAuth();
  const isAuthenticated = !!user && !!token;

  const navigate = useNavigate();

  useEffect(() => {
    void fetchPopularBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPopularBooks = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      // В api.ts уже есть getPopularBooks(limit)
      const resp = await bookApi.getPopularBooks(6);
      const data = resp.data as any[];

      const formatted: HomeBookCard[] = data.map((b) => ({
        id: b.id,
        title: b.title ?? "Без названия",
        author: b.author ?? "Неизвестный автор",
        cover_image_uri: b.cover_image_uri ?? null,
        readers_count: b.readers_count ?? b.reader_count ?? 0,
      }));

      setPopularBooks(formatted);
    } catch (err) {
      console.error("❌ Ошибка загрузки книг:", err);
      setError("Не удалось загрузить книги");
      setPopularBooks(getDemoBooks());
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string): Promise<void> => {
    if (!query.trim()) return;

    try {
      const resp = await bookApi.searchBooks(query, 0, 100);
      const results = resp.data as Book[];

      navigate("/search", {
        state: {
          searchQuery: query,
          searchResults: results,
        },
      });
    } catch (err) {
      console.error("❌ Ошибка поиска:", err);
      navigate("/search", {
        state: {
          searchQuery: query,
          searchResults: [],
        },
      });
    }
  };

  const handleBookClick = (bookId: Id): void => {
    navigate(`/book/${bookId}`);
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

      {error && (
        <div
          style={{
            color: "#721c24",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "5px",
            padding: "15px",
            margin: "20px auto",
            maxWidth: "600px",
            textAlign: "center",
          }}
        >
          {error} (используются демо-данные)
        </div>
      )}

      <section className="popular-books-section">
        <h2
          className="section-title"
          style={{
            textAlign: "center",
            margin: "30px 0",
            color: "#333",
            fontSize: "28px",
            fontWeight: 600,
            width: "100%",
          }}
        >
          {loading ? "Загрузка..." : "Что популярно сейчас!"}
        </h2>

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
          </div>
        ) : (
          <div className="books-grid">
            {popularBooks.map((book) => (
              <div
                key={String(book.id)}
                onClick={() => handleBookClick(book.id)}
                style={{ cursor: "pointer" }}
              >
               <BookCard book={book} />

              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
