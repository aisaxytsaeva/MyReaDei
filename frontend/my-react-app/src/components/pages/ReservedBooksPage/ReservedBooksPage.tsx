import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Header from "../../UI/Header/Header";
import BookCard from "../../UI/Book/BookCard";
import { SeoManager } from "../../../components/SEO/SeoManager";
import "./ReservedBooksPage.css";

import { bookApi, type Id } from "../../../lib/api";

type ReservationItem = {
  id: Id;
  book_id: Id;

  title: string;
  author: string;
  cover_image_uri?: string | null;

  daysLeft: number | null;
  status: "active" | "pending" | string;

  start_date?: string | null;
  end_date?: string | null;

  book_owner?: string | null;
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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const ReservedBooksPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (user && token) {
      void fetchReservations();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const fetchReservations = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const resp = await bookApi.getReservations();
      const data = resp.data as any[];

      const active: ReservationItem[] = data
        .filter((res) => res?.status === "active" || res?.status === "pending")
        .map((res) => {
          let daysLeft: number | null = null;

          if (res?.end_date) {
            const endDate = new Date(res.end_date);
            const today = new Date();
            const diffMs = endDate.getTime() - today.getTime();
            const calc = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            daysLeft = calc > 0 ? calc : 0;
          }

          return {
            id: res.id,
            book_id: res.book_id,
            title: res.book_title || "Без названия",
            author: res.book_author || "Неизвестный автор",
            cover_image_uri: res.book_cover_image_uri ?? null,
            daysLeft,
            status: res.status,
            start_date: res.start_date ?? null,
            end_date: res.end_date ?? null,
            book_owner: res.book_owner_username ?? null,
          };
        });

      setReservations(active);
    } catch (err) {
      console.error("Ошибка загрузки бронирований:", err);
      setError("Не удалось загрузить ваши бронирования");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async (reservationId: Id): Promise<void> => {
    try {
      await bookApi.closeReservation(reservationId);

      setReservations((prev) => prev.filter((r) => String(r.id) !== String(reservationId)));
      alert("Книга успешно сдана!");
    } catch (err: any) {
      console.error("Ошибка сети при возврате:", err);
      const msg =
        err?.response?.data?.detail ??
        err?.message ??
        "Ошибка при сдаче книги";
      alert(`Ошибка при сдаче книги: ${String(msg)}`);
    }
  };

  const handleCancelReservation = async (reservationId: Id): Promise<void> => {
    if (!window.confirm("Вы уверены, что хотите отменить бронирование?")) return;

    try {
      await bookApi.cancelReservation(reservationId);

      setReservations((prev) => prev.filter((r) => String(r.id) !== String(reservationId)));
      alert("Бронирование отменено");
    } catch (err: any) {
      console.error("Ошибка отмены:", err);
      const msg =
        err?.response?.data?.detail ??
        err?.message ??
        "Ошибка при отмене бронирования";
      alert(`Ошибка отмены: ${String(msg)}`);
    }
  };

  const handleBookClick = (bookId: Id): void => {
    navigate(`/book/${bookId}`);
  };

  const handleBrowseBooks = (): void => {
    navigate("/home");
  };

  const handleRefresh = (): void => {
    void fetchReservations();
  };

  const getSeoTitle = () => {
    return `Мои бронирования | MyReaDei`;
  };

  const getSeoDescription = () => {
    return `Управление вашими бронированиями книг. Активных бронирований: ${reservations.length}`;
  };

  if (!user || !token) {
    return (
      <>
        <SeoManager 
          title="Доступ запрещён"
          description="Для просмотра бронирований необходимо авторизоваться"
          noIndex={true}
          noFollow={true}
        />
        <div className="reserved-books-page">
          <Header />
          <div
            style={{
              textAlign: "center",
              padding: "100px 20px",
              color: "#666",
            }}
          >
            <h2>Пожалуйста, войдите в систему</h2>
            <button
              onClick={() => navigate("/auth")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#ffffff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginTop: "20px",
              }}
              type="button"
            >
              Войти
            </button>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <SeoManager 
          title="Загрузка"
          description="Загрузка ваших бронирований"
          noIndex={true}
          noFollow={true}
        />
        <div className="reserved-books-page">
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
            <p>Загрузка ваших бронирований...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoManager 
        title={getSeoTitle()}
        description={getSeoDescription()}
        noIndex={true}
        noFollow={true}
      />
      
      <div className="reserved-books-page">
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
            <button
              onClick={handleRefresh}
              style={{
                marginLeft: "10px",
                padding: "5px 10px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
              }}
              type="button"
            >
              Повторить
            </button>
          </div>
        )}

        <div className="main-content">
          <div className="content-wrapper">
            <div className="reserved-books-header">
              <h1 className="page-title">Забронированные книги</h1>
            </div>

            <div className="reserved-books-list">
              {reservations.length > 0 ? (
                reservations.map((reservation) => (
                  <div key={String(reservation.id)} className="reserved-book-item">
                    <div className="book-info-section">
                      <div
                        className="book-card-container"
                        onClick={() => handleBookClick(reservation.book_id)}
                        style={{ cursor: "pointer" }}
                      >
                        <BookCard
                          book={{
                            id: reservation.book_id,
                            title: reservation.title,
                            author: reservation.author,
                            cover_image_uri: reservation.cover_image_uri,
                          }}
                        />
                      </div>

                      <div className="reservation-details">
                        <div className="reservation-meta">
                          <span className="status-badge">
                            {reservation.status === "active" ? "Активно" : "Ожидание"}
                          </span>

                          {reservation.book_owner && (
                            <span className="owner-info">
                              Владелец: {reservation.book_owner}
                            </span>
                          )}
                        </div>

                        {reservation.daysLeft !== null && (
                          <div className="days-left-info">
                            До конца бронирования осталось:{" "}
                            <span
                              className={`days-count ${
                                reservation.daysLeft <= 3 ? "warning" : ""
                              }`}
                            >
                              {reservation.daysLeft} {getDaysText(reservation.daysLeft)}
                            </span>
                          </div>
                        )}

                        {reservation.start_date && reservation.end_date && (
                          <div className="date-range">
                            {formatDate(reservation.start_date)} —{" "}
                            {formatDate(reservation.end_date)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="action-buttons">
                      {reservation.status === "active" ? (
                        <button
                          onClick={() => void handleReturnBook(reservation.id)}
                          className="return-button"
                          type="button"
                        >
                          Сдать книгу
                        </button>
                      ) : (
                        <button
                          onClick={() => void handleCancelReservation(reservation.id)}
                          className="cancel-button"
                          style={{ backgroundColor: "#ffc107", color: "#212529" }}
                          type="button"
                        >
                          Отменить бронь
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-books-message">
                  <p>У вас нет активных бронирований</p>
                  <button
                    onClick={handleBrowseBooks}
                    className="browse-books-button"
                    type="button"
                  >
                    Посмотреть доступные книги
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReservedBooksPage;