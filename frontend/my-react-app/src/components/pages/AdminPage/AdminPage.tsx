import React, { useState } from "react";
import Header from "../../UI/Header/Header";
import UsersManager from "../../AdminComponents/UsersManager";
import BooksDeleteManager from "../../AdminComponents/BooksDeleteManager";
import PendingLocationsPanel from "../../AdminComponents/PendingLocationsPanel";
import { SeoManager } from "../../../components/SEO/SeoManager";
import "./AdminPage.css";

const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<"users" | "books" | "locations">("users");

  // Динамический заголовок в зависимости от выбранной вкладки
  const getSeoTitle = () => {
    switch (tab) {
      case "users":
        return "Управление пользователями | Панель администратора";
      case "books":
        return "Управление книгами на удаление | Панель администратора";
      case "locations":
        return "Управление локациями | Панель администратора";
      default:
        return "Панель администратора | MyReaDei";
    }
  };

  const getSeoDescription = () => {
    switch (tab) {
      case "users":
        return "Управление пользователями: просмотр, редактирование ролей и удаление пользователей";
      case "books":
        return "Управление книгами, отмеченными на удаление";
      case "locations":
        return "Управление локациями: подтверждение и отклонение новых локаций";
      default:
        return "Панель управления администратора MyReaDei";
    }
  };

  return (
    <>
      <SeoManager 
        title={getSeoTitle()}
        description={getSeoDescription()}
        noIndex={true}
        noFollow={true}
      />
      
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
    </>
  );
};

export default AdminPage;