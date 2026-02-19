import React, { useEffect, useState } from "react";
import Button from "../../components/UI/Button/Button";
import { bookApi } from "../../lib/api";

type Role = "user" | "moderator" | "admin";

type User = {
  id: number | string;
  username?: string;
  email?: string;
  role?: Role;
};

const UsersManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [draftRoles, setDraftRoles] = useState<Record<string, Role>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await bookApi.adminGetUsers();
      const arr = res.data ?? [];

      setUsers(arr);

      const draft: Record<string, Role> = {};
      arr.forEach((u: User) => {
        draft[String(u.id)] = u.role ?? "user";
      });

      setDraftRoles(draft);
    } finally {
      setLoading(false);
    }
  };

  const changeRole = (id: User["id"], role: Role) => {
    setDraftRoles((p) => ({ ...p, [String(id)]: role }));
  };

  const saveRole = async (u: User) => {
    const next = draftRoles[String(u.id)];
    await bookApi.adminSetUserRole(u.id, next);
    await load();
    alert("Роль обновлена");
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Пользователи</h2>

      {loading && <p>Загрузка...</p>}

      {users.map((u) => (
        <div
          key={String(u.id)}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 14,
            padding: "10px 0",
          }}
        >
          {/* Левая часть с информацией */}
          <div style={{ width: 60 }}>{u.id}</div>
          <div style={{ width: 180 }}>{u.username}</div>
          <div style={{ width: 240 }}>{u.email}</div>

          {/* Правая часть (селект + кнопка) */}
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
    </div>
  );
}
export default UsersManager