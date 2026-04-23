import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BookCard from "../../UI/Book/BookCard";
import SearchBar from "../../UI/Book/SearchBar";
import Header from "../../UI/Header/Header";
import { useAuth } from "../../../context/AuthContext";
import "./HomePage.css";
import { HomeBookCard } from "../../../types";
import { bookApi, type Id, type Book, type Tag } from "../../../lib/api";

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
  
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(false);
  const [showTagFilter, setShowTagFilter] = useState<boolean>(false);
  const [filteredBooks, setFilteredBooks] = useState<HomeBookCard[]>([]);
  const [filtering, setFiltering] = useState<boolean>(false);

  const { user, token } = useAuth();
  const isAuthenticated = !!user && !!token;

  const navigate = useNavigate();

  useEffect(() => {
    void fetchPopularBooks();
    void fetchAllTags();
  }, []);

  useEffect(() => {
    if (selectedTagIds.length > 0) {
      void fetchBooksByTags();
    } else {
      setFilteredBooks(popularBooks);
    }
  }, [selectedTagIds, popularBooks]);

  const fetchPopularBooks = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const resp = await bookApi.getPopularBooks(50);
      const data = resp.data as any[];

      const formatted: HomeBookCard[] = data.map((b) => ({
        id: b.id,
        title: b.title ?? "Без названия",
        author: b.author ?? "Неизвестный автор",
        cover_image_uri: b.cover_image_uri ?? null,
        readers_count: b.readers_count ?? b.reader_count ?? 0,
      }));

      setPopularBooks(formatted);
      setFilteredBooks(formatted);
    } catch (err) {
      console.error("Ошибка загрузки книг:", err);
      setError("Не удалось загрузить книги");
      setPopularBooks(getDemoBooks());
      setFilteredBooks(getDemoBooks());
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTags = async (): Promise<void> => {
    try {
      setLoadingTags(true);
      const resp = await bookApi.getTags(0, 100);
      setAllTags(resp.data as Tag[]);
    } catch (err) {
      console.error(" Ошибка загрузки тегов:", err);
      setAllTags([]);
    } finally {
      setLoadingTags(false);
    }
  };

  const fetchBooksByTags = async (): Promise<void> => {
    if (selectedTagIds.length === 0) return;
    
    try {
      setFiltering(true);
      const resp = await bookApi.getBooksByTags(selectedTagIds, true, 0, 20);
      const data = resp.data as any[];
      
      const formatted: HomeBookCard[] = data.map((b) => ({
        id: b.id,
        title: b.title ?? "Без названия",
        author: b.author ?? "Неизвестный автор",
        cover_image_uri: b.cover_image_uri ?? null,
        readers_count: b.readers_count ?? b.reader_count ?? 0,
      }));
      
      setFilteredBooks(formatted);
    } catch (err) {
      console.error("❌ Ошибка фильтрации по тегам:", err);
      setFilteredBooks([]);
    } finally {
      setFiltering(false);
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
      console.error("Ошибка поиска:", err);
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

  const handleTagToggle = (tagId: number): void => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleClearTags = (): void => {
    setSelectedTagIds([]);
  };

  const handleGoToTagManagement = (): void => {
    navigate("/tags");
  };

  return (
    <div className="page" data-testid="home-page">
      <Header />

      <div className="search-container" data-testid="search-container">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearch}
        />
      </div>

      <button
        onClick={() => setShowTagFilter(!showTagFilter)}
        className={`filter-toggle-btn ${showTagFilter ? 'active' : ''}`}
        data-testid="filter-toggle-btn"
      >
        {showTagFilter ? "🔽 Скрыть фильтр" : "🏷️ Фильтр по тегам"}
      </button>

      {showTagFilter && (
        <div className="tags-filter-panel" data-testid="tags-filter-panel">
          <div className="tags-filter-header">
            <h3 className="tags-filter-title" data-testid="tags-filter-title">
              {selectedTagIds.length > 0 
                ? `Выбрано тегов: ${selectedTagIds.length}` 
                : "Выберите теги для фильтрации"}
              {selectedTagIds.length > 0 && (
                <span className="selected-count" data-testid="selected-count">
                  {selectedTagIds.length}
                </span>
              )}
            </h3>
            {selectedTagIds.length > 0 && (
              <button
                onClick={handleClearTags}
                className="clear-tags-btn"
                data-testid="clear-tags-btn"
              >
                Сбросить
              </button>
            )}
          </div>

          {loadingTags ? (
            <div className="loading-container" data-testid="tags-loading">
              <div className="loading-spinner" />
            </div>
          ) : allTags.length === 0 ? (
            <div className="empty-state" data-testid="no-tags">
              <p>Нет доступных тегов</p>
              {isAuthenticated && (
                <button
                  onClick={handleGoToTagManagement}
                  className="reset-filter-btn"
                  style={{ marginTop: "10px" }}
                  data-testid="create-tag-btn"
                >
                  Создать тег
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="tags-grid" data-testid="tags-grid">
                {allTags.map((tag) => (
                  <label
                    key={tag.id}
                    className={`tag-checkbox-label ${selectedTagIds.includes(tag.id) ? 'selected' : ''}`}
                    onClick={() => handleTagToggle(tag.id)}
                    data-testid={`tag-${tag.id}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => {}}
                      data-testid={`tag-checkbox-${tag.id}`}
                    />
                    <span className="tag-name" data-testid={`tag-name-${tag.id}`}>
                      {tag.tag_name}
                    </span>
                    {selectedTagIds.includes(tag.id) && (
                      <span className="tag-check" data-testid={`tag-check-${tag.id}`}>✓</span>
                    )}
                  </label>
                ))}
              </div>

              {selectedTagIds.length > 0 && (
                <div 
                  className={`filter-info ${filtering ? 'loading' : ''}`}
                  data-testid="filter-info"
                >
                  {filtering ? "Поиск книг..." : `Найдено книг: ${filteredBooks.length}`}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <div className="error-message" data-testid="error-message">
          {error} (используются демо-данные)
        </div>
      )}

      <section className="popular-books-section" data-testid="popular-books-section">
        <h2 className="section-title" data-testid="section-title">
          {loading || filtering
            ? "Загрузка..." 
            : selectedTagIds.length > 0
            ? `Книги по выбранным тегам (${filteredBooks.length})`
            : "Что популярно сейчас!"}
        </h2>

        {loading ? (
          <div className="loading-container" data-testid="loading-container">
            <div className="loading-spinner" />
          </div>
        ) : filteredBooks.length === 0 && selectedTagIds.length > 0 ? (
          <div className="empty-state" data-testid="empty-state">
            <div className="empty-state-icon">😕</div>
            <h3 className="empty-state-title" data-testid="empty-state-title">Книги не найдены</h3>
            <p className="empty-state-text" data-testid="empty-state-text">
              Книги с выбранными тегами не найдены
            </p>
            <button
              onClick={handleClearTags}
              className="reset-filter-btn"
              data-testid="reset-filter-btn"
            >
              Сбросить фильтр
            </button>
          </div>
        ) : (
          <div className="books-grid" data-testid="books-grid">
            {filteredBooks.map((book) => (
              <div
                key={String(book.id)}
                onClick={() => handleBookClick(book.id)}
                className="book-card-wrapper"
                data-testid={`book-card-${book.id}`}
                data-book-id={book.id}
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