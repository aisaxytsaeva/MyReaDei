// src/components/pages/ProfilePage/ProfilePage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Header from "../../UI/Header/Header";
import Button from "../../UI/Button/Button";
import BookCard from "../../UI/Book/BookCard";
import { SeoManager } from "../../../components/SEO/SeoManager";
import "./ProfilePage.css";
import { ProfileStats, BookCardItem, ReservationCardItem } from "../../../types";
import { bookApi, type Id, type User } from "../../../lib/api";

const ProfilePage: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState<ProfileStats | null>(null);
  const [myBooks, setMyBooks] = useState<BookCardItem[]>([]);
  const [reservations, setReservations] = useState<ReservationCardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (user && token) {
      void fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const fetchProfileData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const profileResp = await bookApi.getProfile();
      const profileData = profileResp.data as User & ProfileStats;
      setUserProfile(profileData);
      
      const myBooksResp = await bookApi.getMyUserBooks({ limit: 0 });
      const booksData = myBooksResp.data as Array<{
        id: Id;
        title?: string;
        author?: string;
        cover_image_uri?: string | null;
      }>;

      setMyBooks(
        booksData.map((b) => ({
          id: b.id,
          title: b.title ?? "Без названия",
          author: b.author ?? "Неизвестный автор",
          cover_image_uri: b.cover_image_uri ?? null,
        }))
      );

      const resResp = await bookApi.getReservations();
      const reservationsData = resResp.data as any[];

      const activeReservations: ReservationCardItem[] = reservationsData
        .filter((r) => r?.status === "active" || r?.status === "pending")
        .slice(0, 3)
        .map((r) => ({
          id: r.book_id ?? r.id,
          title: r.book_title ?? "Без названия",
          author: r.book_author ?? "Неизвестный автор",
          cover_image_uri: r.book_cover_image_uri ?? null,
          reservation_status: r.status,
        }));

      setReservations(activeReservations);
    } catch (err) {
      console.error("Ошибка загрузки профиля:", err);
      setError("Не удалось загрузить данные профиля");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate("/");
  };

  const handleMyBooks = (): void => {
    navigate("/mybooks");
  };

  const handleReservations = (): void => {
    navigate("/reservations");
  };

  // SEO мета-данные
  const getSeoTitle = () => {
    const username = (user as any)?.name || (user as any)?.username || "Пользователь";
    return `Профиль: ${username} | MyReaDei`;
  };

  const getSeoDescription = () => {
    return `Профиль пользователя. Добавлено книг: ${userProfile?.book_added || 0}, прочитано книг: ${userProfile?.book_borrowed || 0}`;
  };

  if (!user || !token) {
    return (
      <>
        <SeoManager 
          title="Доступ запрещён"
          description="Для просмотра профиля необходимо авторизоваться"
          noIndex={true}
          noFollow={true}
        />
        <div>
          <Header />
          <div className="profile-unauthorized-container">
            <h2>Пожалуйста, войдите в систему</h2>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <SeoManager 
          title="Загрузка профиля"
          description="Загрузка данных профиля"
          noIndex={true}
          noFollow={true}
        />
        <div className="profile-container">
          <Header />
          <div
            style={{
              textAlign: "center",
              padding: "100px 0",
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
            <p>Загрузка профиля...</p>
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
      
      <div className="profile-container">
        <Header />

        {error && (
          <div
            style={{
              maxWidth: "800px",
              margin: "20px auto",
              padding: "15px",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7",
              borderRadius: "5px",
              color: "#856404",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <div className="profile-main-content">
          <div className="profile-left-column">
            <div className="profile-card">
              <img src="/assets/profile.svg" alt="Аватар пользователя" />

              <div>
                <h1 className="profile-user-name">
                  {(user as any).name || (user as any).username}
                </h1>

                {userProfile && (
                  <div className="profile-stats">
                    <div className="stat-item">
                      <span className="stat-label">Добавлено книг:</span>
                      <span className="stat-value">{userProfile.book_added ?? 0}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Прочитано книг:</span>
                      <span className="stat-value">{userProfile.book_borrowed ?? 0}</span>
                    </div>
                  </div>
                )}

                <p className="profile-email">{(user as any).email}</p>
              </div>
            </div>

            <Button onClick={() => void handleLogout()} className="profile-logout-button">
              Выйти
            </Button>
          </div>

          <div className="profile-right-column">
            <div className="profile-section">
              <h2 className="profile-section-title">Мои книги</h2>

              <div className="profile-books-grid">
                {myBooks.length > 0 ? (
                  myBooks.map((book) => <BookCard key={String(book.id)} book={book} />)
                ) : (
                  <p
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      color: "#666",
                      padding: "20px",
                    }}
                  >
                    У вас пока нет добавленных книг
                  </p>
                )}
              </div>

              <Button onClick={handleMyBooks} className="profile-more-button">
                {myBooks.length > 0 ? "Все мои книги" : "Добавить книгу"}
              </Button>
            </div>

            <div className="profile-section">
              <h2 className="profile-section-title">Активные бронирования</h2>

              <div className="profile-books-grid">
                {reservations.length > 0 ? (
                  reservations.map((book) => (
                    <div key={String(book.id)} className="reservation-book">
                      <BookCard book={book} />
                      {book.reservation_status && (
                        <div className="reservation-status">
                          Статус:{" "}
                          {book.reservation_status === "active" ? "Активно" : "Ожидание"}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      color: "#666",
                      padding: "20px",
                    }}
                  >
                    Нет активных бронирований
                  </p>
                )}
              </div>

              <Button onClick={handleReservations} className="profile-more-button">
                Все бронирования
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;