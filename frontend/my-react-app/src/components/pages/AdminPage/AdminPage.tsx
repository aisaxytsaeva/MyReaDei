import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../UI/Header/Header";
import UsersManager from "../../AdminComponents/UsersManager";
import BooksDeleteManager from "../../AdminComponents/BooksDeleteManager";
import PendingLocationsPanel from "../../AdminComponents/PendingLocationsPanel";
import { useAuth } from "../../../context/AuthContext";
import "./AdminPage.css";

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [tab, setTab] = useState<"users" | "books" | "locations">("users");

  const role = (user as any)?.role as string | undefined;
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!user || !token) {
      navigate("/auth");
      return;
    }
    
    if (!isAdmin) {
      navigate("/home");
      return;
    }
  }, [user, token, isAdmin, navigate]);

  if (!user || !token || !isAdmin) {
    return null;
  }

  return (
    <div className="adminPage">
      <div className="adminHeader">
        <Header />
      </div>
      <div className="adminBody">
        <div className="adminContainer">
          <h1 className="adminTitle">Панель администратора</h1>

          <div className="adminTabs">
            <button
              className={`adminTab ${tab === "users" ? "active" : ""}`}
              onClick={() => setTab("users")}
            >
              Пользователи
            </button>

            <button
              className={`adminTab ${tab === "books" ? "active" : ""}`}
              onClick={() => setTab("books")}
            >
              Книги на удаление
            </button>

            <button
              className={`adminTab ${tab === "locations" ? "active" : ""}`}
              onClick={() => setTab("locations")}
            >
              Локации
            </button>
          </div>

          <div className="adminSection">
            {tab === "users" && <UsersManager />}
            {tab === "books" && <BooksDeleteManager />}
            {tab === "locations" && <PendingLocationsPanel />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;