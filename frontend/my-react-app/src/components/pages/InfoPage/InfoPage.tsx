import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import BookingMenu from "../../UI/Book/BookingMenu";
import Button from "../../UI/Button/Button";
import Header from "../../UI/Header/Header";
import "./InfoPage.css";

import {
  bookApi,
  type Id,
  type Reservation,
  type Location,
  type User as ApiUser,
} from "../../../lib/api";
import { BookDetails, OwnerInfo, LocationItem } from "./../../../types";

function extractAxiosErrorMessage(err: any): string {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const msgs = detail
      .map((e) => e?.msg || e?.message || e?.detail)
      .filter(Boolean);
    if (msgs.length) return msgs.join(", ");
  }

  return err?.message ?? "Ошибка";
}

const getImageUrl = (uri: string | null | undefined): string => {
  if (!uri) return "/assets/cover.png";
  
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  
  if (uri.startsWith('/')) {
    return `http://localhost:8000${uri}`;
  }
  
  return uri;
};

const InfoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [isBookingMenuOpen, setIsBookingMenuOpen] = useState<boolean>(false);
  const [book, setBook] = useState<BookDetails | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo>({
    id: null,
    name: "Владелец",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [userReservation, setUserReservation] = useState<Reservation | null>(
    null
  );

  const userId = useMemo<Id | null>(() => {
    if (!user || typeof user !== "object") return null;
    const u: any = user;
    return u.id ?? u.userId ?? u._id ?? u.user_id ?? null;
  }, [user]);

  const role = (user as any)?.role as string | undefined;
  const isAdmin = role === "admin";
  const isModerator = role === "moderator";

  const isOwner =
    !!userId && !!book?.owner_id && String(userId) === String(book.owner_id);

  const isReservedByUser = !!userReservation;
  const isRegularUser = !!user && !isOwner && !isAdmin && !isModerator;

  useEffect(() => {
    if (id) void fetchBookDetails();
  }, [id, token]);

  const fetchOwnerInfo = async (ownerId: Id): Promise<void> => {
    try {
      if (userId && String(userId) === String(ownerId)) {
        setOwnerInfo({
          id: ownerId,
          name: (user as any)?.name || (user as any)?.username || "Вы",
          email: (user as any)?.email,
          isCurrentUser: true,
        });
        return;
      }

      const resp = await bookApi.getUserById(ownerId);
      const owner = resp.data as ApiUser;

      setOwnerInfo({
        id: owner.id,
        name:
          (owner as any)?.name ||
          (owner as any)?.username ||
          `Пользователь ${String(ownerId)}`,
        email: (owner as any)?.email as string | undefined,
        isCurrentUser: !!userId && String(userId) === String(owner.id),
      });
    } catch (e) {
      console.warn("Не удалось получить данные владельца:", e);
      setOwnerInfo({
        id: ownerId,
        name: `Владелец #${String(ownerId)}`,
        isCurrentUser: false,
      });
    }
  };

  const fetchUserReservations = async (): Promise<void> => {
    try {
      if (!token || !id) return;

      const resp = await bookApi.getReservations();
      const reservations = resp.data as Reservation[];

      const bookIdNum = Number(id);
      const active = reservations.find(
        (r: any) =>
          r.book_id === bookIdNum &&
          (r.status === "active" || r.status === "pending")
      );

      setUserReservation(active ?? null);
    } catch (e) {
      console.error("Ошибка загрузки бронирований:", e);
    }
  };

  const fetchBookDetails = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      if (!id) return;
      const resp = await bookApi.getBookById(id);
      const data = resp.data as any;

      const formattedBook: BookDetails = {
        id: data.id,
        title: data.title || "Без названия",
        author: data.author || "Неизвестный автор",
        description: data.description || "Нет описания",
        cover_image_uri: data.cover_image_uri ?? null,
        owner_id: data.owner_id ?? null,
        status: (data.status || "available") as string,
        locations: (data.locations || []) as LocationItem[],
        tags: data.tags || [],
        reader_count: data.reader_count || 0,
      };

      console.log("Book cover_image_uri:", formattedBook.cover_image_uri); // 🔍 Логируем

      setBook(formattedBook);

      if (formattedBook.owner_id) await fetchOwnerInfo(formattedBook.owner_id);
      if (token) await fetchUserReservations();
    } catch (e: any) {
      const status = e?.response?.status as number | undefined;
      setError(
        status
          ? `Книга не найдена или недоступна (${status})`
          : extractAxiosErrorMessage(e) || "Ошибка подключения к серверу"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (): void => {
    if (book && book.locations && book.locations.length > 0) {
      const location = book.locations[0];
      const locationText =
        typeof location === "string"
          ? location
          : location.address || "Место хранения";

      const encoded = encodeURIComponent(locationText);
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encoded}`,
        "_blank"
      );
    } else {
      alert("Место хранения не указано");
    }
  };

  const handleLogin = () => navigate("/auth");

  const handleEdit = (): void => {
    if (!book) return;
    navigate(`/edit-book/${book.id}`, {
      state: {
        bookId: book.id,
        initialData: {
          title: book.title,
          author: book.author,
          description: book.description,
        },
      },
    });
  };

  const handleDelete = async (): Promise<void> => {
    if (!book || !window.confirm("Вы уверены, что хотите удалить эту книгу?")) {
      return;
    }
    try {
      await bookApi.deleteBook(book.id);
      alert("Книга успешно удалена!");
      navigate("/home");
    } catch (e: any) {
      const msg = extractAxiosErrorMessage(e);
      alert(`Ошибка удаления: ${msg}`);
    }
  };

  const handleMarkDelete = async (): Promise<void> => {
    if (!book) return;
    try {
      await bookApi.markBookDelete(book.id);
      alert("Книга помечена на удаление");
      await fetchBookDetails();
    } catch (e: any) {
      const msg = extractAxiosErrorMessage(e);
      alert(`Ошибка: ${msg}`);
    }
  };

  const handleUnmarkDelete = async (): Promise<void> => {
    if (!book) return;
    try {
      await bookApi.unmarkBookDelete(book.id);
      alert("Пометка удаления снята");
      await fetchBookDetails();
    } catch (e: any) {
      const msg = extractAxiosErrorMessage(e);
      alert(`Ошибка: ${msg}`);
    }
  };

  const handleReserve = (): void => {
    if (!user || !token) {
      navigate("/auth");
      return;
    }
    if (book?.status !== "available") {
      alert("Книга в данный момент недоступна для бронирования");
      return;
    }
    setIsBookingMenuOpen(true);
  };

  const handleBookConfirm = async (days: number): Promise<void> => {
    try {
      if (!user || !token) {
        alert("Необходимо авторизоваться для бронирования");
        return;
      }
      if (!book?.id) {
        alert("Ошибка: книга не найдена");
        return;
      }
      if (book.status !== "available") {
        alert("Книга в данный момент недоступна для бронирования");
        return;
      }

      let selectedLocationId: number = 1;
      try {
        const locResp = await bookApi.getBookLocations(book.id);
        const locs = locResp.data as Location[];
        if (locs?.length && typeof (locs[0] as any).id === "number") {
          selectedLocationId = (locs[0] as any).id;
        }
      } catch {
        // игнорируем
      }

      let planned_return_days: "7" | "14" | "30" | "60";
      if (days <= 7) planned_return_days = "7";
      else if (days <= 14) planned_return_days = "14";
      else if (days <= 30) planned_return_days = "30";
      else planned_return_days = "60";

      await bookApi.createReservation({
        book_id: Number(book.id),
        planned_return_days,
        selected_location_id: selectedLocationId,
      });

      alert(`Книга "${book.title}" успешно забронирована на ${planned_return_days} дней!`);
      setIsBookingMenuOpen(false);
      await fetchBookDetails();
    } catch (e: any) {
      const detail = extractAxiosErrorMessage(e);
      alert(`Ошибка при бронировании: ${detail}`);
    }
  };

  if (loading) {
    return (
      <div className="info-page">
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
          <p>Загрузка информации о книге...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="info-page">
        <Header />
        <div
          style={{
            textAlign: "center",
            padding: "100px 20px",
            color: "#721c24",
          }}
        >
          <h2>Ошибка</h2>
          <p>{error || "Книга не найдена"}</p>
          <Button onClick={() => navigate("/home")} style={{ marginTop: "20px" }}>
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

  const canMarkDelete = (isAdmin || isModerator) && book.status !== "marked_for_deletion";
  const canUnmarkDelete = isAdmin && book.status === "marked_for_deletion";
  const canDeleteHard = isAdmin;

  return (
    <>
      <div className="info-page">
        <BookingMenu
          isOpen={isBookingMenuOpen}
          onClose={() => setIsBookingMenuOpen(false)}
          onBook={handleBookConfirm}
        />

        <Header />

        <div className="info-content">
          <div className="book-container">
            <div className="book-cover-section">
              <div className="book-cover">
                {book.cover_image_uri ? (
                  <img
                    src={getImageUrl(book.cover_image_uri)}  // Исправлено!
                    alt={book.title}
                    className="book-image"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      console.error("Failed to load image:", getImageUrl(book.cover_image_uri));
                      const img = e.currentTarget;
                      img.onerror = null;
                      img.src = "/assets/cover.png";
                      img.onerror = () => {
                        img.style.display = "none";
                        if (img.parentElement) {
                          img.parentElement.innerHTML = '<div class="book-placeholder">📚</div>';
                        }
                      };
                    }}
                  />
                ) : (
                  <div className="book-placeholder">📚</div>
                )}
              </div>

              <div className="action-buttons-container">
                {!user || !token ? (
                  <Button onClick={handleLogin} className="action-button login">
                    Войти для бронирования
                  </Button>
                ) : (
                  <>
                    {isOwner && (
                      <>
                        <div
                          style={{
                            textAlign: "center",
                            marginBottom: "15px",
                            padding: "10px",
                            backgroundColor: "#d4edda",
                            color: "#155724",
                            borderRadius: "5px",
                          }}
                        >
                          <strong>Это ваша книга</strong>
                        </div>
                        <div className="owner-buttons">
                          <Button onClick={handleEdit} className="action-button edit">
                            Редактировать
                          </Button>
                          <Button
                            onClick={async () => {
                              await handleDelete();
                            }}
                            variant="secondary"
                            className="action-button delete"
                          >
                            Удалить
                          </Button>
                        </div>
                      </>
                    )}

                    {!isOwner && isRegularUser && book.status === "available" && !isReservedByUser && (
                      <Button onClick={handleReserve} className="action-button reserve">
                        Забронировать
                      </Button>
                    )}

                    {!isOwner && isRegularUser && isReservedByUser && (
                      <div className="reservation-status">
                        <p style={{ marginBottom: "10px", color: "#28a745" }}>
                          Вы забронировали эту книгу
                        </p>
                      </div>
                    )}

                    {!isOwner &&
                      isRegularUser &&
                      book.status !== "available" &&
                      !isReservedByUser && (
                        <p style={{ color: "#dc3545", textAlign: "center" }}>
                          Книга в данный момент недоступна
                        </p>
                      )}

                    {!isOwner && canMarkDelete && (
                      <Button onClick={handleMarkDelete} className="action-button delete">
                        Пометить на удаление
                      </Button>
                    )}

                    {!isOwner && canUnmarkDelete && (
                      <Button onClick={handleUnmarkDelete} className="action-button edit">
                        Снять пометку удаления
                      </Button>
                    )}

                    {!isOwner && canDeleteHard && (
                      <Button
                        onClick={handleDelete}
                        variant="secondary"
                        className="action-button delete"
                      >
                        Удалить книгу
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="book-info-section">
              <div className="book-header">
                <h1 className="book-title">{book.title}</h1>
                <h2 className="book-author">{book.author}</h2>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginTop: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <span className={`status-badge ${book.status}`}>
                    {book.status === "available"
                      ? "Доступна"
                      : book.status === "reserved"
                      ? "Забронирована"
                      : book.status === "marked_for_deletion"
                      ? "Помечена на удаление"
                      : "Недоступна"}
                  </span>

                  {book.reader_count > 0 && (
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#666",
                        backgroundColor: "#f8f9fa",
                        padding: "4px 10px",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span>📖 {book.reader_count} читателей</span>
                    </span>
                  )}
                </div>
              </div>

              {book.tags && book.tags.length > 0 && (
                <div className="info-container">
                  <h3 className="section1-title">Теги</h3>
                  <div className="tags-container" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {book.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="tag-item"
                        style={{
                          backgroundColor: "#e9ecef",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "14px",
                          color: "#495057",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onClick={() => {
                          navigate(`/catalog?tag=${tag.tag_name}`);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#dee2e6";
                          e.currentTarget.style.transform = "scale(1.02)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#e9ecef";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <span>{tag.tag_name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="info-container">
                <h3 className="section1-title">Описание</h3>
                <p className="book-description">{book.description}</p>
              </div>

              <div className="info-container">
                <h3 className="section1-title">Место хранения</h3>
                <div className="location-content">
                  {book.locations && book.locations.length > 0 ? (
                    <>
                      <p className="book-location">
                        {book.locations.map((loc, index) => {
                          const text =
                            typeof loc === "string"
                              ? loc
                              : [loc.name, loc.address].filter(Boolean).join(" — ") || "Место хранения";

                          return (
                            <React.Fragment key={index}>
                              {text}
                              {index < book.locations.length - 1 && ", "}
                            </React.Fragment>
                          );
                        })}
                      </p>
                      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <Button onClick={handleMapClick} className="map-button">
                          Посмотреть на карте
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="book-location">Место хранения не указано</p>
                  )}
                </div>
              </div>

              <div className="info-container">
                <h3 className="section1-title">Владелец книги</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <p className="book-owner" style={{ fontSize: "18px", fontWeight: 500 }}>
                    {ownerInfo.name}
                  </p>

                  {ownerInfo.isCurrentUser && (
                    <span
                      style={{
                        fontSize: "14px",
                        backgroundColor: "#d4edda",
                        padding: "4px 10px",
                        borderRadius: "4px",
                      }}
                    >
                      Вы являетесь владельцем
                    </span>
                  )}
                </div>

                {ownerInfo.email && !ownerInfo.isCurrentUser && (
                  <p style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>
                    Email: {ownerInfo.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InfoPage;