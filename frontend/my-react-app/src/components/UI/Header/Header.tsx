import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleLogoClick = (): void => {
    navigate("/home");
  };

  const handleLogin = (): void => {
    window.location.href = "/auth";
  };

  const handleProfileClick = (): void => {
    navigate("/profile");
  };

  const isAuthPage =
    location.pathname === "/auth" || location.pathname === "/registration";
  const isProfilePage = location.pathname === "/profile";

  const handleLogoMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>
  ): void => {
    e.currentTarget.style.opacity = "0.8";
  };

  const handleLogoMouseLeave = (
    e: React.MouseEvent<HTMLDivElement>
  ): void => {
    e.currentTarget.style.opacity = "1";
  };

  const handleProfileMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>
  ): void => {
    e.currentTarget.style.backgroundColor = "rgba(248, 221, 211, 0.1)";
  };

  const handleProfileMouseLeave = (
    e: React.MouseEvent<HTMLDivElement>
  ): void => {
    e.currentTarget.style.backgroundColor = "transparent";
  };

  const handleLoginMouseEnter = (
    e: React.MouseEvent<HTMLButtonElement>
  ): void => {
    e.currentTarget.style.backgroundColor = "rgba(248, 221, 211, 0.1)";
  };

  const handleLoginMouseLeave = (
    e: React.MouseEvent<HTMLButtonElement>
  ): void => {
    e.currentTarget.style.backgroundColor = "transparent";
  };

  return (
    <header
      style={{
        width: "100%",
        height: "77px",
        display: "flex",
        alignItems: "center",
        paddingLeft: "192px",
        backgroundColor: "#711720",
        position: "relative",
      }}
    >
      <div
        onClick={handleLogoClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          cursor: "pointer",
          transition: "opacity 0.2s",
        }}
        onMouseEnter={handleLogoMouseEnter}
        onMouseLeave={handleLogoMouseLeave}
      >
        <img
          src="/assets/logo.svg"
          alt="Логотип"
          style={{
            width: "40px",
            height: "40px",
            objectFit: "contain",
          }}
        />
        <h1
          style={{
            color: "#F8DDD3",
            fontSize: "36px",
            fontWeight: "normal",
            margin: 0,
            marginBottom: "2px",
          }}
        >
          MyReaDei
        </h1>
      </div>

      <div
        style={{
          marginLeft: "auto",
          paddingRight: "192px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {user && !isProfilePage ? (
          <div
            onClick={handleProfileClick}
            style={{
              cursor: "pointer",
              padding: "8px",
              borderRadius: "50%",
              transition: "background-color 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={handleProfileMouseEnter}
            onMouseLeave={handleProfileMouseLeave}
          >
            <img
              src="/assets/profile.svg"
              alt="Профиль"
              style={{
                width: "50px",
                height: "50px",
                objectFit: "contain",
              }}
            />
          </div>
        ) : (
          !isAuthPage &&
          !isProfilePage && (
            <button
              onClick={handleLogin}
              style={{
                background: "none",
                border: "none",
                color: "#F8DDD3",
                fontSize: "16px",
                cursor: "pointer",
                padding: "8px 16px",
                borderRadius: "4px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={handleLoginMouseEnter}
              onMouseLeave={handleLoginMouseLeave}
            >
              Войти
            </button>
          )
        )}
      </div>
    </header>
  );
};

export default Header;
