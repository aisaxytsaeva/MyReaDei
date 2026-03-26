import { useState, useEffect } from "react";
import { bookApi, type Tag } from "./../lib/api";

export const useFetchTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const resp = await bookApi.getTags(0, 100);
        const data = resp.data as Tag[];
        setTags(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Не удалось загрузить теги", err);
        setTags([]);
        setError("Не удалось загрузить теги");
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  return { tags, loading, error };
};