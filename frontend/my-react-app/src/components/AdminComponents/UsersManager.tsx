import React, { useEffect, useState } from "react";
import Button from "../../components/UI/Button/Button";
import { bookApi } from "../../lib/api";

type Role = "user" | "moderator" | "admin";

type User = {
  id: number | string;
  username?: string;
  email?: string;
  role?: Role;
  is_active?: boolean;
};

type PaginatedResponse = {
  items: User[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

const UsersManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [draftRoles, setDraftRoles] = useState<Record<string, Role>>({});
  const [loading, setLoading] = useState(false);
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    void load();
  }, [currentPage]); // Загружаем при смене страницы

  const load = async () => {
    setLoading(true);
    try {
      // Передаем параметры пагинации на бэкенд
      const res = await bookApi.adminGetUsers(currentPage, itemsPerPage);
      const data = res.data as PaginatedResponse;
      
      setUsers(data.items);
      setTotalPages(data.pages);
      setTotalUsers(data.total);

      const draft: Record<string, Role> = {};
      data.items.forEach((u: User) => {
        draft[String(u.id)] = u.role ?? "user";
      });

      setDraftRoles(draft);
    } catch (error) {
      console.error("Ошибка загрузки пользователей:", error);
    } finally {
      setLoading(false);
    }
  };

  const changeRole = (id: User["id"], role: Role) => {
    setDraftRoles((p) => ({ ...p, [String(id)]: role }));
  };

  const saveRole = async (u: User) => {
    try {
      const next = draftRoles[String(u.id)];
      await bookApi.adminSetUserRole(u.id, next);
      await load(); // Перезагружаем текущую страницу
      alert("Роль обновлена");
    } catch (error) {
      console.error("Ошибка обновления роли:", error);
      alert("Ошибка при обновлении роли");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>
        Пользователи {totalUsers > 0 && `(${totalUsers})`}
      </h2>

      {loading && <p>Загрузка...</p>}

      {!loading && users.map((u) => (
        <div
          key={String(u.id)}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 14,
            padding: "10px 0",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <div style={{ width: 60 }}>{u.id}</div>
          <div style={{ width: 180 }}>{u.username}</div>
          <div style={{ width: 240 }}>{u.email}</div>
          {u.is_active === false && (
            <div style={{ width: 100, color: "red" }}>Заблокирован</div>
          )}

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <select
              value={draftRoles[String(u.id)]}
              onChange={(e) => changeRole(u.id, e.target.value as Role)}
              style={{
                width: 160,
                height: 42,
                padding: "0 12px",
                borderRadius: 10,
                border: "2px solid #e0e0e0",
                backgroundColor: "#ffffff",
                color: "#333",
                fontSize: 14,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="user">user</option>
              <option value="moderator">moderator</option>
              <option value="admin">admin</option>
            </select>

            <Button
              style={{
                minWidth: 140,
                height: 42,
              }}
              onClick={() => saveRole(u)}
            >
              Сохранить
            </Button>
          </div>
        </div>
      ))}

      {/* Пагинация */}
      {!loading && totalPages > 1 && (
        <div className="pagination" style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px",
          marginTop: "30px",
          padding: "20px 0"
        }}>
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: "8px 16px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            ← Назад
          </button>
          
          <span>
            Страница {currentPage} из {totalPages}
          </span>
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 16px",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            Вперед →
          </button>
        </div>
      )}
      
      {!loading && users.length === 0 && (
        <p>Пользователи не найдены</p>
      )}
    </div>
  );
};

export default UsersManager;