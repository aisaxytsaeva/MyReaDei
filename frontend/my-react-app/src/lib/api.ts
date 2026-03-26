import axios, { type AxiosInstance, type AxiosResponse } from "axios";

export const API_BASE_URL = "http://127.0.0.1:8000";

export type Id = number | string;

export type CreateBookPayload = {
  title: string;
  author: string;
  description?: string;
  location_ids: number[];
  tag_ids?: number[];  
  cover_image?: File | null;
};

export type UpdateBookPayload = {
  title?: string;
  author?: string;
  description?: string;
  location_ids?: number[];
  tag_ids?: number[];
  status?: string;
  cover_image?: File | null;
};

export type User = {
  id: Id;
  username?: string;
  email?: string;
  name?: string;
  role?: string; 
  [key: string]: unknown;
};

export type BookStatus = "available" | "reserved" | "unavailable" | string;

export type Location = {
  id?: Id;
  name?: string;
  address?: string;
  [key: string]: unknown;
};

export type LocationServer = {
  id: number;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_approved?: boolean;
  created_by?: number;
};

export type CreateLocationPayload = {
  name: string;
  address: string;
  latitude: "0";
  longitude: "0";
};

export type Tag = {
  id: number;
  tag_name: string;
  description?: string;
};

export type CreateTagPayload = {
  tag_name: string;
  description?: string;
};

export type UpdateTagPayload = {
  tag_name?: string;
  description?: string;
};

export type Book = {
  id: Id;
  title?: string;
  author?: string;
  description?: string;
  cover_image_uri?: string | null;
  cover_image_url?: string;
  owner_id?: Id | null;
  status?: BookStatus;
  locations?: Array<Location | string>;
  tags?: Tag[];  
  reader_count?: number;
  available?: boolean;
  [key: string]: unknown;
};

export type Reservation = {
  id: Id;
  book_id: number;
  book?: Book;
  days?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  planned_return_days?: "7" | "14" | "30" | "60" | string;
  selected_location_id?: number;
  [key: string]: unknown;
};

export type Statistics = Record<string, unknown>;

export type RegisterResponse = User; 

export type LoginResponse = {
  access_token: string;
  token_type?: string;
  user?: User;
  [key: string]: unknown;
};

export type CreateReservationPayload = {
  book_id: number;
  planned_return_days: "7" | "14" | "30" | "60";
  selected_location_id: number;
};

/** Axios instance */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

/** Attach access token */
api.interceptors.request.use((config) => {
  const url = config.url ?? "";
  const isAuth = url.includes("/auth/login") || url.includes("/auth/refresh") || url.includes("/auth/register");
  if (isAuth) return config;

  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

/** ===== Auto refresh on 401 ===== */
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function resolveQueue(token: string | null) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

function isAuthEndpoint(url?: string) {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/register") ||
    url.includes("/auth/logout")
  );
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    if (isAuthEndpoint(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken) => {
          if (!newToken) return reject(error);
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const resp = await api.post<LoginResponse>("/auth/refresh");
      const newToken = resp.data?.access_token;

      if (!newToken) throw new Error("Server did not return access_token on refresh");

      localStorage.setItem("token", newToken);
      resolveQueue(newToken);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshErr) {
      localStorage.removeItem("token");
      resolveQueue(null);
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export const bookApi = {
  getCatalog: (skip = 0, limit = 100, tag_ids?: number[]): Promise<AxiosResponse<Book[]>> =>
    api.get<Book[]>("/books/catalog", { params: { skip, limit, tag_ids: tag_ids?.join(',') } }),

  getBookById: (id: Id): Promise<AxiosResponse<Book>> => api.get<Book>(`/books/${id}`),

  searchBooks: (query: string, skip = 0, limit = 100, tag_ids?: number[]): Promise<AxiosResponse<Book[]>> =>
    api.get<Book[]>("/books/search/", { params: { query, skip, limit, tag_ids: tag_ids?.join(',') } }),

  getPopularBooks: (limit = 10): Promise<AxiosResponse<Book[]>> =>
    api.get<Book[]>("/books/popular/", { params: { limit } }),

  getMyBooks: (params?: { skip?: number; limit?: number }): Promise<AxiosResponse<Book[]>> =>
    api.get<Book[]>("/users/book/my", { params }),

  createBook: (bookData: {
    title: string;
    author: string;
    description?: string;
    location_ids: number[];
    tag_ids?: number[];
    cover_image?: File | null;
  }): Promise<AxiosResponse<Book>> => {
    const fd = new FormData();

    fd.append("title", bookData.title);
    fd.append("author", bookData.author);
    fd.append("description", bookData.description ?? "");

    // location_ids - каждый ID отдельным полем
    for (const id of bookData.location_ids) {
      fd.append("location_ids", String(id));
    }

    if (bookData.tag_ids && bookData.tag_ids.length > 0) {
      for (const id of bookData.tag_ids) {
        fd.append("tag_ids", String(id));
      }
    }

    if (bookData.cover_image) {
      fd.append("cover_image", bookData.cover_image);
    }

    return api.post<Book>("/books/", fd, {
      headers: { "Content-Type": undefined as any },
    });
  },

  updateBook: (id: Id, bookData: UpdateBookPayload): Promise<AxiosResponse<Book>> => {
  const fd = new FormData();

  if (bookData.title) fd.append("title", bookData.title);
  if (bookData.author) fd.append("author", bookData.author);
  if (bookData.description) fd.append("description", bookData.description);
  if (bookData.status) fd.append("status", bookData.status);

  if (bookData.location_ids && bookData.location_ids.length > 0) {
    for (const id of bookData.location_ids) {
      fd.append("location_ids", String(id));
    }
  }

  if (bookData.tag_ids && bookData.tag_ids.length > 0) {
    for (const id of bookData.tag_ids) {
      fd.append("tag_ids", String(id));
    }
  }

  if (bookData.cover_image) {
    fd.append("cover_image", bookData.cover_image);
  }

  return api.put<Book>(`/books/${id}`, fd, {
    headers: { "Content-Type": undefined as any },
  });
},

  deleteBook: (id: Id): Promise<AxiosResponse<void>> => api.delete<void>(`/books/${id}`),

  uploadCover: (bookId: Id, coverImage: File | Blob): Promise<AxiosResponse<Book>> => {
    const formData = new FormData();
    formData.append("cover_image", coverImage);
    return api.post<Book>(`/books/${bookId}/cover`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  replaceCover: (bookId: Id, coverImage: File | Blob): Promise<AxiosResponse<{ message: string; cover_url: string; cover_key: string }>> => {
    const formData = new FormData();
    formData.append("cover_image", coverImage);
    return api.put(`/books/${bookId}/cover`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteCover: (bookId: Id): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/books/${bookId}/cover`),

  refreshCoverUrl: (bookId: Id): Promise<AxiosResponse<{ book_id: number; cover_url: string; expires_in: string }>> =>
    api.get(`/books/${bookId}/cover/refresh`),

  getBookLocations: (bookId: Id): Promise<AxiosResponse<Location[]>> =>
    api.get<Location[]>(`/books/${bookId}/locations`),

  getTags: (skip = 0, limit = 100, search?: string): Promise<AxiosResponse<Tag[]>> =>
    api.get<Tag[]>("/tags/", { params: { skip, limit, search } }),

  getTagsByNames: (names: string[]): Promise<AxiosResponse<Tag[]>> =>
    api.get<Tag[]>("/tags/by-names/", { params: { names: names.join(',') } }),

  searchTags: (query: string, limit = 10): Promise<AxiosResponse<Tag[]>> =>
    api.get<Tag[]>("/tags/search/", { params: { query, limit } }),

  getPopularTags: (limit = 20): Promise<AxiosResponse<Tag[]>> =>
    api.get<Tag[]>("/tags/popular/", { params: { limit } }),

  getTagById: (tagId: number): Promise<AxiosResponse<Tag>> =>
    api.get<Tag>(`/tags/${tagId}`),

  getTagByName: (name: string): Promise<AxiosResponse<Tag>> =>
    api.get<Tag>(`/tags/name/${name}`),

  createTag: (tagData: CreateTagPayload): Promise<AxiosResponse<Tag>> =>
    api.post<Tag>("/tags/", tagData),

  updateTag: (tagId: number, tagData: UpdateTagPayload): Promise<AxiosResponse<Tag>> =>
  api.put<Tag>(`/tags/${tagId}`, tagData),

  deleteTag: (tagId: number, force = false): Promise<AxiosResponse<void>> =>
    api.delete<void>(`/tags/${tagId}`, { params: { force } }),

  getTagBooksCount: (tagId: number): Promise<AxiosResponse<{ tag_id: number; tag_name: string; books_count: number }>> =>
    api.get(`/tags/${tagId}/books/count`),

  createMultipleTags: (tagsData: CreateTagPayload[]): Promise<AxiosResponse<Tag[]>> =>
    api.post<Tag[]>("/tags/bulk/", tagsData),

  deleteMultipleTags: (tagIds: number[], force = false): Promise<AxiosResponse<{ deleted: any[]; failed: any[]; used_in_books: any[] }>> =>
    api.delete("/tags/bulk/", { params: { tag_ids: tagIds.join(','), force } }),

  addTagsToBook: (bookId: Id, tagIds: number[]): Promise<AxiosResponse<Book>> =>
    api.post<Book>(`/books/${bookId}/tags`, { tag_ids: tagIds }),

  removeTagsFromBook: (bookId: Id, tagIds: number[]): Promise<AxiosResponse<Book>> =>
    api.delete<Book>(`/books/${bookId}/tags`, { data: { tag_ids: tagIds } }),

  getBooksByTags: (tagIds: number[], matchAll = true, skip = 0, limit = 50): Promise<AxiosResponse<Book[]>> =>
    api.get<Book[]>("/books/by-tags/", { params: { tag_ids: tagIds.join(','), match_all: matchAll, skip, limit } }),

  reserveBook: (bookId: Id, days: number): Promise<AxiosResponse<Reservation>> =>
    api.post<Reservation>("/reservations", { book_id: bookId, days }),

  createReservation: (payload: CreateReservationPayload): Promise<AxiosResponse<Reservation>> =>
    api.post<Reservation>("/reservations/", payload),

  getReservations: (): Promise<AxiosResponse<Reservation[]>> => api.get<Reservation[]>("/reservations/my"),

  returnBook: (reservationId: Id): Promise<AxiosResponse<void>> =>
    api.delete<void>(`/reservations/${reservationId}`),

  cancelReservation: (reservationId: Id): Promise<AxiosResponse<void>> =>
    api.post<void>(`/reservations/${reservationId}/cancel`),

  closeReservation: (reservationId: Id) => api.post<void>(`/reservations/${reservationId}/close`),

  login: (username: string, password: string): Promise<AxiosResponse<LoginResponse>> => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    return api.post<LoginResponse>("/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },

  refresh: (): Promise<AxiosResponse<LoginResponse>> =>
    api.post<LoginResponse>("/auth/refresh"),

  register: (userData: Record<string, unknown>): Promise<AxiosResponse<RegisterResponse>> =>
    api.post<RegisterResponse>("/auth/register", userData),

  logout: (): Promise<AxiosResponse<void>> => api.post<void>("/auth/logout"),

  getProfile: (): Promise<AxiosResponse<User>> => api.get<User>("/users/me"),

  getUserById: (id: Id): Promise<AxiosResponse<User>> => api.get<User>(`/users/${id}`),

  getLocations: (): Promise<AxiosResponse<Location[]>> => api.get<Location[]>("/locations"),

  createLocation: (payload: CreateLocationPayload): Promise<AxiosResponse<LocationServer>> =>
    api.post<LocationServer>("/locations/", payload),

  getPendingLocations: (skip = 0, limit = 100) =>
    api.get(`/locations/locations/pending-list`, { params: { skip, limit } }),

  approveLocation: (locationId: number) =>
    api.post(`/locations/locations/${locationId}/approve`),

  rejectLocation: (locationId: number) =>
    api.delete(`/locations/locations/${locationId}/reject`),

  deleteLocation: (locationId: number) => api.delete<void>(`/locations/${locationId}`),

  getMyUserBooks: (params?: { limit?: number; skip?: number }) => {
    const cleaned: Record<string, number> = {};
    if (params?.skip !== undefined) cleaned.skip = params.skip;
    if (params?.limit !== undefined && params.limit > 0) cleaned.limit = params.limit;
    return api.get<Book[]>("/users/book/my", { params: cleaned });
  },

  getStatistics: (): Promise<AxiosResponse<Statistics>> => api.get<Statistics>("/statistics"),

  adminGetUsers: () => api.get("/admin/users"),
  adminSetUserRole: (userId: Id, role: string) => api.put(`/admin/users/${userId}/role`, { role }),
  adminGetBooksForDelete: () => api.get("/admin/books/for-delete"),

  markBookDelete: (id: Id) => api.post(`/books/${id}/mark-delete`),
  unmarkBookDelete: (id: Id) => api.post(`/books/${id}/unmark-delete`),
};

export default api;