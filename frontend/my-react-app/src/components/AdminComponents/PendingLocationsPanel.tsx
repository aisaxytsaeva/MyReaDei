import React, { useEffect, useState } from "react";

import { bookApi, type Id, type Location } from "../../lib/api";
import "./PendingLocationsPanel.css";
import Button from "../UI/Button/Button";

type PendingLocation = Location & {
  id: Id;
  name?: string;
  address?: string;
};

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

const PendingLocationsPanel: React.FC = () => {
  const [items, setItems] = useState<PendingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<Id | null>(null);
  const [error, setError] = useState("");

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError("");

      const resp = await bookApi.getPendingLocations(0, 200);
      const data = resp.data as any[];

      const normalized: PendingLocation[] = (Array.isArray(data) ? data : []).map(
        (l: any) => ({
          id: l.id,
          name: l.name ?? "Без названия",
          address: l.address ?? "",
        })
      );

      setItems(normalized);
    } catch (e: any) {
      setError(extractAxiosErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPending();
  }, []);

  const handleApprove = async (id: Id) => {
    try {
      setBusyId(id);
      setError("");

      await bookApi.approveLocation(Number(id));
      setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));
    } catch (e: any) {
      setError(extractAxiosErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: Id) => {
    if (!window.confirm("Отклонить локацию? Она будет удалена.")) return;

    try {
      setBusyId(id);
      setError("");

      await bookApi.rejectLocation(Number(id));
      setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));
    } catch (e: any) {
      setError(extractAxiosErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="pl-card">
      <div className="pl-header">
        <h2 className="pl-title">Локации на одобрение</h2>

        <Button
          type="button"
          variant="secondary"
          onClick={() => void fetchPending()}
          disabled={loading}
          className="pl-refreshBtn"
        >
          Обновить
        </Button>
      </div>

      {error && <div className="pl-error">{error}</div>}

      {loading ? (
        <div className="pl-empty">Загрузка...</div>
      ) : items.length === 0 ? (
        <div className="pl-empty">Нет локаций на одобрение</div>
      ) : (
        <div className="pl-list">
          <div className="pl-row pl-row--head">
            <div>ID</div>
            <div>Название</div>
            <div>Адрес</div>
            <div className="pl-actionsHead">Действия</div>
          </div>

          {items.map((loc) => (
            <div key={String(loc.id)} className="pl-row">
              <div className="pl-id">{String(loc.id)}</div>
              <div className="pl-name">{loc.name || "Без названия"}</div>
              <div className="pl-address">{loc.address || "—"}</div>

              <div className="pl-actions">
                <Button
                  type="button"
                  className="pl-approveBtn"
                  disabled={busyId === loc.id}
                  onClick={() => void handleApprove(loc.id)}
                >
                  {busyId === loc.id ? "..." : "Одобрить"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className="pl-rejectBtn"
                  disabled={busyId === loc.id}
                  onClick={() => void handleReject(loc.id)}
                >
                  {busyId === loc.id ? "..." : "Отклонить"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default PendingLocationsPanel;
