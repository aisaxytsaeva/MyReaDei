// src/lib/api.js
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const bookApi = {
  getCatalog: (skip = 0, limit = 100) => 
    api.get('/books/catalog', { params: { skip, limit } }),
  
  // Получить книгу по ID
  getBookById: (id) => api.get(`/books/${id}`),
  
  // Поиск книг
  searchBooks: (query, skip = 0, limit = 100) =>
    api.get('/books/search/', { params: { q: query, skip, limit } }),
  
  // Популярные книги
  getPopularBooks: (limit = 10) =>
    api.get('/books/popular/', { params: { limit } }),
  
  // Мои книги
  getMyBooks: () => api.get('/books/my'),
  
  // Создать книгу
  createBook: (bookData) => api.post('/books/', bookData),
  
  // Обновить книгу
  updateBook: (id, bookData) => api.put(`/books/${id}`, bookData),
  
  // Удалить книгу
  deleteBook: (id) => api.delete(`/books/${id}`),
  
  // Загрузить обложку
  uploadCover: (bookId, coverImage) => {
    const formData = new FormData();
    formData.append('cover_image', coverImage);
    return api.post(`/books/${bookId}/cover`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Бронирование
  reserveBook: (bookId, days) => 
    api.post('/reservations', { book_id: bookId, days }),
  
  // Получить бронирования
  getReservations: () => api.get('/reservations/my'),
  
  // Вернуть книгу
  returnBook: (reservationId) => 
    api.delete(`/reservations/${reservationId}`),
  
  // Авторизация
  
  login: (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('grant_type', 'password');
    formData.append('scope', '');
    formData.append('client_id', '');
    formData.append('client_secret', '');
    
    return api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
  });
},
  
  register: (userData) => 
    api.post('/auth/register', userData),
  
  logout: () => api.post('/auth/logout'),
  
  getProfile: () => api.get('/users/me'),
  
  // Локации
  getLocations: () => api.get('/locations'),
  
  // Статистика
  getStatistics: () => api.get('/statistics'),
};

export default api;