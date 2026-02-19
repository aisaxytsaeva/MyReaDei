
import axios, { type AxiosInstance, type AxiosResponse } from "axios";

export const API_BASE_URL = "http://127.0.0.1:8000";

export type Id = number | string;

export type CreateBookPayload = {
  title: string;
  author: string;
  description?: string;
  location_ids: number[];
  cover_image?: File | null;
};

export type User = {
  id: Id;
  username?: string;
  email?: string;
  name?: string;
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

/** Auth */
export type RegisterResponse = {
  access_token: string;
  user: User;
};

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


api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

/** API wrapper */
export const bookApi = {
  // --- Books ---
  getCatalog: (
    skip = 0,
    limit = 100
  ): Promise<AxiosResponse<Book[]>> =>
    api.get<Book[]>("/books/catalog", { params: { skip, limit } }),

  getBookById: (id: Id): Promise<AxiosResponse<Book>> =>
    api.get<Book>(`/books/${id}`),

  searchBooks: (query: string, skip = 0, limit = 100) =>
  api.get<Book[]>("/books/search/", { params: { query, skip, limit } }),


  getPopularBooks: (limit = 10): Promise<AxiosResponse<Book[]>> =>
    api.get<Book[]>("/books/popular/", { params: { limit } }),

  getMyBooks: (params?: { skip?: number; limit?: number }) =>
  api.get<Book[]>("/users/book/my", { params }),


  createBook: (bookData: {
    title: string;
    author: string;
    description?: string;
    location_ids: number[];
    cover_image?: File | null;
  }): Promise<AxiosResponse<Book>> => {
    const fd = new FormData();

    fd.append("title", bookData.title);
    fd.append("author", bookData.author);
    fd.append("description", bookData.description ?? "");

    for (const id of bookData.location_ids) {
      fd.append("location_ids", String(id));
    }

    if (bookData.cover_image) {
      fd.append("cover_image", bookData.cover_image);
    }

    return api.post<Book>("/books/", fd, {

      headers: { "Content-Type": undefined as any },
    });
  },

  updateBook: (
    id: Id,
    bookData: Partial<Book> & Record<string, unknown>
  ): Promise<AxiosResponse<Book>> => api.put<Book>(`/books/${id}`, bookData),

  deleteBook: (id: Id): Promise<AxiosResponse<void>> =>
    api.delete<void>(`/books/${id}`),

  uploadCover: (
    bookId: Id,
    coverImage: File | Blob
  ): Promise<AxiosResponse<Book>> => {
    const formData = new FormData();
    formData.append("cover_image", coverImage);

    return api.post<Book>(`/books/${bookId}/cover`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getBookLocations: (bookId: Id): Promise<AxiosResponse<Location[]>> =>
    api.get<Location[]>(`/books/${bookId}/locations`),

  // --- Reservations ---
  reserveBook: (bookId: Id, days: number): Promise<AxiosResponse<Reservation>> =>
    api.post<Reservation>("/reservations", { book_id: bookId, days }),

  createReservation: (
    payload: CreateReservationPayload
  ): Promise<AxiosResponse<Reservation>> =>
    api.post<Reservation>("/reservations/", payload),

  getReservations: (): Promise<AxiosResponse<Reservation[]>> =>
    api.get<Reservation[]>("/reservations/my"),

  returnBook: (reservationId: Id): Promise<AxiosResponse<void>> =>
    api.delete<void>(`/reservations/${reservationId}`),

  cancelReservation: (reservationId: Id): Promise<AxiosResponse<void>> =>
    api.post<void>(`/reservations/${reservationId}/cancel`),
  closeReservation: (reservationId: Id) =>
  api.post<void>(`/reservations/${reservationId}/close`),


  // --- Auth ---
  login: (
    username: string,
    password: string
  ): Promise<AxiosResponse<LoginResponse>> => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("grant_type", "password");
    formData.append("scope", "");
    formData.append("client_id", "");
    formData.append("client_secret", "");

    return api.post<LoginResponse>("/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },

  register: (
    userData: Record<string, unknown>
  ): Promise<AxiosResponse<RegisterResponse>> =>
    api.post<RegisterResponse>("/auth/register", userData),

  logout: (): Promise<AxiosResponse<void>> => api.post<void>("/auth/logout"),

  getProfile: (): Promise<AxiosResponse<User>> => api.get<User>("/users/me"),

  getUserById: (id: Id): Promise<AxiosResponse<User>> =>
    api.get<User>(`/users/${id}`),


  getLocations: (): Promise<AxiosResponse<Location[]>> =>
    api.get<Location[]>("/locations"),

  createLocation: (
    payload: CreateLocationPayload
  ): Promise<AxiosResponse<LocationServer>> =>
    api.post<LocationServer>('/locations/', payload),

  getPendingLocations: (skip = 0, limit = 100) =>
  api.get(`/locations/locations/pending-list`, { params: { skip, limit } }),

  approveLocation: (locationId: number) =>
  api.post(`/locations/locations/${locationId}/approve`),

  rejectLocation: (locationId: number) =>
  api.delete(`/locations/locations/${locationId}/reject`),

  deleteLocation: (locationId: number) =>
    api.delete<void>(`/locations/${locationId}`),

  getMyUserBooks: (params?: { limit?: number; skip?: number }) => {
    const cleaned: Record<string, number> = {};
    if (params?.skip !== undefined) cleaned.skip = params.skip;
    if (params?.limit !== undefined && params.limit > 0) cleaned.limit = params.limit; // <= важно
    return api.get<Book[]>("/users/book/my", { params: cleaned });
  },

  getStatistics: (): Promise<AxiosResponse<Statistics>> =>
    api.get<Statistics>("/statistics"),


  adminGetUsers: () => api.get("/admin/users"),
  adminSetUserRole: (userId: Id, role: string) =>
  api.put(`/admin/users/${userId}/role`, { role }),

  adminGetBooksForDelete: () => api.get("/admin/books/for-delete"),

  markBookDelete: (id: Id) => api.post(`/books/${id}/mark-delete`),
  unmarkBookDelete: (id: Id) => api.post(`/books/${id}/unmark-delete`),

};

export default api;
