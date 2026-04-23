import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./Head.css";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleLogoClick = () => navigate("/home");
  const handleLogin = () => navigate("/auth");
  const handleProfileClick = () => navigate("/profile");
  const goAdmin = () => navigate("/admin");
  const goModerator = () => navigate("/moderator");

  const isAuthPage =
    location.pathname === "/auth" || location.pathname === "/registration";

  const isProfilePage = location.pathname === "/profile";
  const isAdminPage = location.pathname.startsWith("/admin");
  const isModeratorPage = location.pathname.startsWith("/moderator");

  const isAdmin = user?.role === "admin";
  const isModerator = user?.role === "moderator";

  return (
    <header className="app-header">
      <div className="app-header__inner">

        <div className="app-header__logo" onClick={handleLogoClick}>
          <img
            src="/assets/logo.svg"
            alt="Логотип"
            className="app-header__logoImg"
          />
          <h1 className="app-header__title">MyReaDei</h1>
        </div>

        <div className="app-header__right">

          {isAdmin && !isAdminPage && (
            <button
              className="app-header__adminBtn"
              onClick={goAdmin}
              type="button"
            >
              Панель администратора
            </button>
          )}

          {isModerator && !isModeratorPage && !isAdmin && (
            <button
              className="app-header__moderatorBtn"
              onClick={goModerator}
              type="button"
            >
              Панель модератора
            </button>
          )}

          {user && !isProfilePage ? (
            <button
              className="app-header__iconBtn"
              onClick={handleProfileClick}
              aria-label="Профиль"
              type="button"
              data-testid="user-menu"
            >
              <img
                src="/assets/profile.svg"
                alt="Профиль"
                className="app-header__profileImg"
              />
            </button>
          ) : (
            !isAuthPage &&
            !isProfilePage && (
              <button
                onClick={handleLogin}
                className="app-header__loginBtn"
                type="button"
                data-testid="login-button"
              >
                Войти
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;