import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BookCard from "../../UI/Book/BookCard";
import SearchBar from "../../UI/Book/SearchBar";
import Header from "../../UI/Header/Header";
import { useAuth } from "../../../context/AuthContext";
import "./FoundPage.css";
import { CardBook } from "../../../types";
import { bookApi, type Id, type Book, type Tag } from "../../../lib/api";

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
  const [originalSearchResults, setOriginalSearchResults] = useState<CardBook[]>(
    normalizeToCardBooks(initialSearchResults)
  );
  const [books, setBooks] = useState<CardBook[]>(normalizeToCardBooks(initialSearchResults));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(false);
  const [showTagFilter, setShowTagFilter] = useState<boolean>(false);
  const [filtering, setFiltering] = useState<boolean>(false);

  useEffect(() => {
    void fetchAllTags();
    if (initialSearchResults.length > 0) {
      setOriginalSearchResults(normalizeToCardBooks(initialSearchResults));
      setBooks(normalizeToCardBooks(initialSearchResults));
    } else {
      void fetchAllBooks();
    }
  }, []);

  useEffect(() => {
    if (selectedTagIds.length === 0) {
      setBooks(originalSearchResults);
      return;
    }

    setFiltering(true);

    const filterByTags = async () => {
      try {
        const resp = await bookApi.getBooksByTags(selectedTagIds, true, 0, 50);
        const taggedBookIds = new Set((resp.data as any[]).map(b => b.id));
        
        const filtered = originalSearchResults.filter(book => 
          taggedBookIds.has(Number(book.id))
        );
        
        setBooks(filtered);
        setError(filtered.length === 0 ? "Книги с выбранными тегами не найдены" : "");
      } catch (err) {
        console.error("Ошибка фильтрации по тегам:", err);
        setBooks([]);
        setError("Ошибка при фильтрации по тегам");
      } finally {
        setFiltering(false);
      }
    };
    
    filterByTags();
  }, [selectedTagIds, originalSearchResults]);

  const fetchAllTags = async (): Promise<void> => {
    try {
      setLoadingTags(true);
      const resp = await bookApi.getTags(0, 100);
      setAllTags(resp.data as Tag[]);
    } catch (err) {
      console.error("Ошибка загрузки тегов:", err);
      setAllTags([]);
    } finally {
      setLoadingTags(false);
    }
  };

  const fetchAllBooks = async (): Promise<void> => {
    setLoading(true);
    setError("");

    try {
      const resp = await bookApi.getCatalog(0, 50);
      const data = resp.data as Book[];

      const formatted = data.map((b: any) => ({
        id: b.id,
        title: b.title ?? "Без названия",
        author: b.author ?? "Неизвестный автор",
        cover_image_uri: b.cover_image_uri ?? null,
      }));
      
      setOriginalSearchResults(formatted);
      setBooks(formatted);
    } catch (err) {
      console.error("Ошибка загрузки каталога:", err);
      setError("Ошибка подключения к серверу");
      setOriginalSearchResults([]);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string): Promise<void> => {
    const q = query.trim();

    if (!q) {
      setSearchQuery("");
      setSelectedTagIds([]);
      await fetchAllBooks();
      return;
    }

    setLoading(true);
    setError("");
    setSearchQuery(q);
    setSelectedTagIds([]); 

    try {
      const resp = await bookApi.searchBooks(q, 0, 50);
      const data = resp.data as Book[];

      const formatted = data.map((b: any) => ({
        id: b.id,
        title: b.title ?? "Без названия",
        author: b.author ?? "Неизвестный автор",
        cover_image_uri: b.cover_image_uri ?? null,
      }));

      setOriginalSearchResults(formatted);
      setBooks(formatted);

      if (formatted.length === 0) setError("Поиск не дал результатов");
    } catch (err) {
      console.error("Ошибка поиска:", err);
      setOriginalSearchResults([]);
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
    setSelectedTagIds([]);
    void fetchAllBooks();
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

  const isSearchMode = !!(searchQuery || initialSearchQuery);
  const isLoading = loading || filtering;
  const hasActiveFilters = selectedTagIds.length > 0;
  const hasOriginalResults = originalSearchResults.length > 0;


  return (
    <>
      
      <div className="page">
        <Header />

        <div className="search-container">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={(q) => void handleSearch(q)}
          />
        </div>

        {hasOriginalResults && (
          <button
            onClick={() => setShowTagFilter(!showTagFilter)}
            className={`filter-toggle-btn ${showTagFilter ? 'active' : ''}`}
          >
            {showTagFilter ? "Скрыть фильтр" : " Фильтр по тегам"}
          </button>
        )}

        {showTagFilter && hasOriginalResults && (
          <div className="tags-filter-panel">
            <div className="tags-filter-header">
              <h3 className="tags-filter-title">
                {selectedTagIds.length > 0 
                  ? `Выбрано тегов: ${selectedTagIds.length}` 
                  : "Выберите теги для фильтрации"}
                {selectedTagIds.length > 0 && (
                  <span className="selected-count">{selectedTagIds.length}</span>
                )}
              </h3>
              {selectedTagIds.length > 0 && (
                <button
                  onClick={handleClearTags}
                  className="clear-tags-btn"
                >
                  Сбросить
                </button>
              )}
            </div>

            {loadingTags ? (
              <div className="loading-container">
                <div className="loading-spinner" />
              </div>
            ) : allTags.length === 0 ? (
              <div className="empty-state">
                <p>Нет доступных тегов</p>
                {isAuthenticated && (
                  <button
                    onClick={handleGoToTagManagement}
                    className="reset-filter-btn"
                    style={{ marginTop: "10px" }}
                  >
                    Создать тег
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="tags-grid">
                  {allTags.map((tag) => (
                    <label
                      key={tag.id}
                      className={`tag-checkbox-label ${selectedTagIds.includes(tag.id) ? 'selected' : ''}`}
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTagIds.includes(tag.id)}
                        onChange={() => {}}
                      />
                      <span className="tag-name">{tag.tag_name}</span>
                      {selectedTagIds.includes(tag.id) && (
                        <span className="tag-check">✓</span>
                      )}
                    </label>
                  ))}
                </div>

                {selectedTagIds.length > 0 && (
                  <div className={`filter-info ${filtering ? 'loading' : ''}`}>
                    {filtering 
                      ? "Фильтрация..." 
                      : `Найдено книг: ${books.length} из ${originalSearchResults.length}`}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <section className="popular-books-section">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p className="loading-text">
                {hasActiveFilters 
                  ? "Фильтрация книг..." 
                  : searchQuery 
                  ? `Ищем "${searchQuery}"...` 
                  : "Загружаем книги..."}
              </p>
            </div>
          ) : hasActiveFilters ? (
            <>
              <h1 className="section-title">
                {books.length > 0 
                  ? `Нашли ${books.length} ${getBookWord(books.length)} по выбранным тегам` 
                  : "Ничего не найдено"}
              </h1>

              {selectedTagIds.length > 0 && (
                <div className="active-filters">
                  <span className="active-filters-label">Активные теги:</span>
                  {selectedTagIds.map((tagId) => {
                    const tag = allTags.find(t => t.id === tagId);
                    return tag ? (
                      <span key={tagId} className="active-filter-tag">
                        {tag.tag_name}
                        <button
                          onClick={() => handleTagToggle(tagId)}
                          className="remove-filter-btn"
                        >
                          ✕
                        </button>
                      </span>
                    ) : null;
                  })}
                  <button onClick={handleClearTags} className="clear-all-filters">
                    Сбросить все
                  </button>
                </div>
              )}

              {books.length > 0 ? (
                <div className="books-grid">
                  {books.map((book) => (
                    <div
                      key={String(book.id)}
                      onClick={() => handleBookAction(book.id)}
                      className="book-card-wrapper"
                    >
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h3 className="empty-state-title">Книги не найдены</h3>
                  <p className="empty-state-text">
                    Книги с выбранными тегами не найдены среди результатов поиска
                  </p>
                  <button
                    onClick={handleClearTags}
                    className="reset-filter-btn"
                  >
                    Сбросить фильтр
                  </button>
                </div>
              )}
            </>
          ) : isSearchMode ? (
            <>
              <h1 className="section-title">
                {books.length > 0 
                  ? `Нашли ${books.length} ${getBookWord(books.length)}` 
                  : "Ничего не найдено"}
              </h1>

              <p className="search-query-info">
                По запросу: "{searchQuery || initialSearchQuery}"
              </p>

              {books.length > 0 ? (
                <div className="books-grid">
                  {books.map((book) => (
                    <div
                      key={String(book.id)}
                      onClick={() => handleBookAction(book.id)}
                      className="book-card-wrapper"
                    >
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h3 className="empty-state-title">Ничего не найдено</h3>
                  <p className="empty-state-text">
                    Попробуйте изменить запрос или поискать другие книги
                  </p>
                  <button
                    onClick={onShowAllBooks}
                    className="reset-filter-btn"
                  >
                    Показать все книги
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className="section-title">
                Каталог книг
              </h1>

              <p className="catalog-count">
                Всего книг: {books.length}
              </p>

              {books.length > 0 ? (
                <div className="books-grid">
                  {books.map((book) => (
                    <div
                      key={String(book.id)}
                      onClick={() => handleBookAction(book.id)}
                      className="book-card-wrapper"
                    >
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h3 className="empty-state-title">Нет доступных книг</h3>
                  <p className="empty-state-text">
                    В каталоге пока нет книг
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
};

export default FoundPage;