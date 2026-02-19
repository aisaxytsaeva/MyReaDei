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

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await bookApi.adminGetBooksForDelete();
      setBooks((res.data ?? []) as BookForDelete[]);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (bookId: number) => {
    if (!confirm("Удалить книгу навсегда?")) return;
    await bookApi.deleteBook(bookId);
    await load();
  };

  const unmark = async (bookId: number) => {
    await bookApi.unmarkBookDelete(bookId);
    await load();
  };

  return (
    <div>
      <h2>Книги на удаление</h2>

      {loading && <p>Загрузка...</p>}

      {!loading && books.length === 0 && <p>Нет книг на удаление.</p>}

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
                    Отменить
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
                    Удалить
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BooksDeleteManager;
