import { useState, useEffect } from "react";
import { bookApi } from "./../lib/api";
import type { FormState, BookForEdit } from "./../types";

export const useBookForm = (isEditMode: boolean, bookId?: string) => {
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
      // Режим редактирования
      if (isEditMode && bookId) {
        const updatePayload: any = {};

        // Проверяем изменения в текстовых полях
        if (formData.title !== bookData?.title) {
          updatePayload.title = formData.title;
        }
        if (formData.author !== bookData?.author) {
          updatePayload.author = formData.author;
        }
        if (formData.description !== (bookData?.description ?? "")) {
          updatePayload.description = formData.description;
        }

        // Проверяем изменения в локациях
        const currentLocationIds = [...formData.location_ids].sort().join(',');
        const originalLocationIds = (bookData?.locations?.map(l => Number(l.id)) ?? []).sort().join(',');
        if (currentLocationIds !== originalLocationIds) {
          updatePayload.location_ids = formData.location_ids;
        }

        // Проверяем изменения в тегах
        const currentTagIds = [...formData.tag_ids].sort().join(',');
        const originalTagIds = (bookData?.tags?.map(t => Number(t.id)) ?? []).sort().join(',');
        if (currentTagIds !== originalTagIds) {
          updatePayload.tag_ids = formData.tag_ids;
        }

        // Обновляем данные книги, если есть изменения
        if (Object.keys(updatePayload).length > 0) {
          console.log("Updating book with payload:", updatePayload);
          await bookApi.updateBook(bookId, updatePayload);
        }

        // Обновляем обложку, если она была изменена (отдельным запросом)
        if (formData.coverImage) {
          console.log("Updating cover for book:", bookId);
          await bookApi.replaceCover(bookId, formData.coverImage);
        }

        return { 
          success: true, 
          message: "Книга успешно обновлена!", 
          redirectTo: `/book/${bookId}`,
          bookId: Number(bookId)
        };
      }

      // Режим создания новой книги
      const response = await bookApi.createBook({
        title: formData.title,
        author: formData.author,
        description: formData.description || "",
        location_ids: formData.location_ids,
        tag_ids: formData.tag_ids,
        cover_image: formData.coverImage,
      });

      // Получаем ID созданной книги из ответа
      const createdBook = response.data;
      const newBookId = createdBook.id;

      return { 
        success: true, 
        message: "Книга успешно добавлена!", 
        redirectTo: `/book/${newBookId}`,
        bookId: newBookId
      };
    } catch (err: any) {
      console.error("Submit error:", err);
      const msg = err?.response?.data?.detail ?? err?.message ?? "Ошибка сохранения";
      setError(msg);
      return { 
        success: false, 
        message: msg,
        redirectTo: undefined,
        bookId: undefined
      };
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