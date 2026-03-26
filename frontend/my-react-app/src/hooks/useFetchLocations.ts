import { useState, useEffect } from "react";
import { bookApi, type Location } from "./../lib/api"

export const useFetchLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const resp = await bookApi.getLocations();
        const data = resp.data as Location[];
        setLocations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Не удалось загрузить локации", err);
        setLocations([
          { id: 1, name: "книжный шкаф в кофе 'Фондол'", address: "ул. Пушкина, 1" },
          { id: 2, name: "центральная библиотека", address: "ул. Ленина, 10" },
          { id: 3, name: "читальный зал университета", address: "пр. Мира, 15" },
          { id: 4, name: "кофейня 'Буквоед'", address: "ул. Гоголя, 5" },
        ]);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return { locations, loading, error };
};