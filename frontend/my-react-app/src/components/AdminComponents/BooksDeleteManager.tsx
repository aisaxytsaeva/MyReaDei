import React, { useEffect, useState } from "react";
import Button from "../../components/UI/Button/Button";
import { bookApi } from "../../lib/api";
import BookCard from "../UI/Book/BookCard";

type BookForDelete = {
  id: number;            
  book_id?: number;      
  title: string;
  author: string;
  status: string;
  cover_image_uri?: string | null;
};


const BooksDeleteManager: React.FC = () => {
  const [books, setBooks] = useState<BookForDelete[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  useEffect(() => {
    void load();
  }, [currentPage]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookApi.adminGetBooksForDelete(currentPage, itemsPerPage);
      const data = res.data;
      
      console.log("Response data:", data); // Для отладки
      
      // Обрабатываем разные форматы ответа
      if (data && typeof data === 'object') {
        // Формат с пагинацией { items: [], total, page, size, pages }
        if ('items' in data && Array.isArray(data.items)) {
          setBooks(data.items);
          setTotalPages(data.pages || 1);
          setTotalBooks(data.total || 0);
        }
        // Если пришел просто массив
        else if (Array.isArray(data)) {
          setBooks(data);
          setTotalPages(1);
          setTotalBooks(data.length);
        }
        // Если пришел объект с книгами в другом поле
        else if ('books' in data && Array.isArray(data.books)) {
          setBooks(data.books);
          setTotalPages(data.pages || 1);
          setTotalBooks(data.total || data.books.length);
        }
        else {
          console.error("Неизвестный формат данных:", data);
          setError("Неверный формат данных от сервера");
          setBooks([]);
        }
      } else {
        setBooks([]);
        setError("Нет данных от сервера");
      }
    } catch (error: any) {
      console.error("Ошибка загрузки книг:", error);
      const errorMessage = error?.response?.data?.detail || error?.message || "Ошибка загрузки книг";
      setError(errorMessage);
      
      // Детальная диагностика ошибки 422
      if (error?.response?.status === 422) {
        console.error("Ошибка 422 - неверные параметры запроса");
        console.error("Параметры запроса:", { page: currentPage, size: itemsPerPage });
        console.error("Ответ сервера:", error.response?.data);
        setError(`Ошибка валидации: ${JSON.stringify(error.response?.data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const remove = async (bookId: number) => {
    if (!confirm("Удалить книгу навсегда?")) return;
    try {
      await bookApi.deleteBook(bookId);
      await load();
    } catch (error) {
      console.error("Ошибка удаления:", error);
      alert("Ошибка при удалении книги");
    }
  };

  const unmark = async (bookId: number) => {
    try {
      await bookApi.unmarkBookDelete(bookId);
      await load();
    } catch (error) {
      console.error("Ошибка отмены удаления:", error);
      alert("Ошибка при отмене удаления");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <h2>
        Книги на удаление 
        {totalBooks > 0 && <span style={{ fontSize: 14, color: '#666', marginLeft: 10 }}>({totalBooks})</span>}
      </h2>

      {loading && <p>Загрузка...</p>}

      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '12px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>Ошибка:</strong> {error}
          <button 
            onClick={() => load()} 
            style={{ marginLeft: '10px', padding: '4px 8px', cursor: 'pointer' }}
          >
            Повторить
          </button>
        </div>
      )}

      {!loading && !error && books.length === 0 && (
        <p style={{ color: '#666', textAlign: 'center', marginTop: 40 }}>
          Нет книг на удаление
        </p>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        {books.map((b) => {
          const bookId = b.book_id ?? b.id;

          return (
            <div
              key={bookId}
              style={{
                border: "1px solid #e6e6e6",
                borderRadius: 12,
                padding: 12,
                background: "#fff",
                transition: "box-shadow 0.2s",
              }}
            >
              <BookCard
                book={{
                  id: bookId,
                  title: b.title,
                  author: b.author,
                  cover_image_uri: b.cover_image_uri ?? null,
                }}
              />

              <div style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <div
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="secondary"
                    onClick={(e: any) => {
                      e?.stopPropagation?.();
                      void unmark(bookId);
                    }}
                  >
                    Отменить удаление
                  </Button>
                </div>

                <div
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Button
                    onClick={(e: any) => {
                      e?.stopPropagation?.();
                      void remove(bookId);
                    }}
                  >
                    Удалить навсегда
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Пагинация */}
      {!loading && !error && totalPages > 1 && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px",
          marginTop: "30px",
          padding: "20px 0",
          borderTop: "1px solid #f0f0f0"
        }}>
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: "8px 16px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              opacity: currentPage === 1 ? 0.5 : 1,
              border: "1px solid #ddd",
              borderRadius: 6,
              backgroundColor: "white"
            }}
          >
            ← Назад
          </button>
          
          <span style={{ fontSize: 14 }}>
            Страница {currentPage} из {totalPages}
          </span>
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 16px",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              opacity: currentPage === totalPages ? 0.5 : 1,
              border: "1px solid #ddd",
              borderRadius: 6,
              backgroundColor: "white"
            }}
          >
            Вперед →
          </button>
        </div>
      )}
    </div>
  );
};

export default BooksDeleteManager;
