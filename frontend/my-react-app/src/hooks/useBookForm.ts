import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { bookApi, type Id } from "./../lib/api";
import type { FormState, BookForEdit } from "./../types";

export const useBookForm = (isEditMode: boolean, bookId?: string) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormState>({
    title: "",
    author: "",
    description: "",
    location_ids: [],
    tag_ids: [],
    coverImage: null,
    coverPreview: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookData, setBookData] = useState<BookForEdit | null>(null);

  const fetchBookData = async () => {
    if (!bookId) return;

    try {
      setLoading(true);
      const resp = await bookApi.getBookById(bookId);
      const data = resp.data as BookForEdit;

      setBookData(data);

      setFormData((prev) => ({
        ...prev,
        title: data.title ?? "",
        author: data.author ?? "",
        description: data.description ?? "",
        location_ids: data.locations?.map((loc) => Number(loc.id)).filter((n) => Number.isFinite(n)) ?? [],
        tag_ids: data.tags?.map((tag) => Number(tag.id)).filter((n) => Number.isFinite(n)) ?? [],
        coverPreview: data.cover_image_uri ? `http://127.0.0.1:8000${data.cover_image_uri}` : null,
      }));
    } catch (err: any) {
      setError(`Не удалось загрузить данные книги: ${err?.message ?? "Неизвестная ошибка"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode && bookId) {
      void fetchBookData();
    }
  }, [isEditMode, bookId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (selectedIds: number[]) => {
    setFormData((prev) => ({ ...prev, location_ids: selectedIds }));
  };

  const handleTagChange = (selectedIds: number[]) => {
    setFormData((prev) => ({ ...prev, tag_ids: selectedIds }));
  };

  const handleCoverChange = (file: File | null, preview: string | null) => {
    setFormData((prev) => ({ ...prev, coverImage: file, coverPreview: preview }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      if (isEditMode && bookId) {
        const updatePayload: any = {};

        if (formData.title !== bookData?.title) updatePayload.title = formData.title;
        if (formData.author !== bookData?.author) updatePayload.author = formData.author;
        if (formData.description !== (bookData?.description ?? "")) updatePayload.description = formData.description;

        const currentLocationIds = formData.location_ids.sort().join(',');
        const originalLocationIds = (bookData?.locations?.map(l => Number(l.id)) ?? []).sort().join(',');
        if (currentLocationIds !== originalLocationIds) {
          updatePayload.location_ids = formData.location_ids.join(',');
        }

        const currentTagIds = formData.tag_ids.sort().join(',');
        const originalTagIds = (bookData?.tags?.map(t => Number(t.id)) ?? []).sort().join(',');
        if (currentTagIds !== originalTagIds) {
          updatePayload.tag_ids = formData.tag_ids.join(',');
        }

        if (Object.keys(updatePayload).length > 0) {
          await bookApi.updateBook(bookId, updatePayload);
        }

        if (formData.coverImage) {
          await bookApi.replaceCover(bookId, formData.coverImage);
        }

        return { success: true, message: "Книга успешно обновлена!", redirectTo: `/book/${bookId}` };
      }

      await bookApi.createBook({
        title: formData.title,
        author: formData.author,
        description: formData.description || "",
        location_ids: formData.location_ids,
        tag_ids: formData.tag_ids,
        cover_image: formData.coverImage,
      });

      return { success: true, message: "Книга успешно добавлена!", redirectTo: "/mybooks" };
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.message ?? "Ошибка сохранения";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    error,
    bookData,
    handleInputChange,
    handleLocationChange,
    handleTagChange,
    handleCoverChange,
    handleSubmit,
  };
};