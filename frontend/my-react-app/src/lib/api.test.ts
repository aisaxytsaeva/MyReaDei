// src/services/api.test.ts
import api, { bookApi } from './api';
import axios from 'axios';

// Мокаем axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Request Interceptor', () => {
    test('adds Bearer token to headers when token exists', async () => {
      const token = 'test-token-123';
      localStorage.setItem('token', token);
      
      mockedAxios.request.mockResolvedValue({ data: {} });
      
      await api.get('/books/catalog');
      
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`
          })
        })
      );
    });

    test('does not add Authorization header for auth endpoints', async () => {
      const token = 'test-token';
      localStorage.setItem('token', token);
      
      mockedAxios.request.mockResolvedValue({ data: {} });
      
      await api.post('/auth/login');
      
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String)
          })
        })
      );
    });

    test('does not add token when localStorage is empty', async () => {
      mockedAxios.request.mockResolvedValue({ data: {} });
      
      await api.get('/books/catalog');
      
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String)
          })
        })
      );
    });
  });

  describe('bookApi', () => {
    describe('getCatalog', () => {
      test('fetches catalog with default params', async () => {
        const mockResponse = { data: [{ id: 1, title: 'Test Book' }] };
        mockedAxios.request.mockResolvedValue(mockResponse);
        
        const result = await bookApi.getCatalog();
        
        expect(mockedAxios.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'get',
            url: '/books/catalog',
            params: { skip: 0, limit: 100, tag_ids: undefined }
          })
        );
        expect(result.data).toEqual(mockResponse.data);
      });

      test('fetches catalog with tag_ids', async () => {
        mockedAxios.request.mockResolvedValue({ data: [] });
        
        await bookApi.getCatalog(0, 20, [1, 2, 3]);
        
        expect(mockedAxios.request).toHaveBeenCalledWith(
          expect.objectContaining({
            params: { skip: 0, limit: 20, tag_ids: '1,2,3' }
          })
        );
      });
    });

    describe('createBook', () => {
      test('creates book with FormData', async () => {
        const mockBook = {
          title: 'New Book',
          author: 'Author',
          description: 'Description',
          location_ids: [1, 2],
          tag_ids: [1, 2]
        };
        
        mockedAxios.request.mockResolvedValue({ data: { id: 1, ...mockBook } });
        
        const result = await bookApi.createBook(mockBook);
        
        expect(mockedAxios.request).toHaveBeenCalled();
        const callArgs = mockedAxios.request.mock.calls[0][0];
        expect(callArgs.method).toBe('post');
        expect(callArgs.url).toBe('/books/');
        expect(callArgs.data).toBeInstanceOf(FormData);
      });

      test('creates book without optional fields', async () => {
        const mockBook = {
          title: 'New Book',
          author: 'Author',
          location_ids: [1]
        };
        
        mockedAxios.request.mockResolvedValue({ data: { id: 1 } });
        
        await bookApi.createBook(mockBook);
        
        expect(mockedAxios.request).toHaveBeenCalled();
      });
    });

    describe('updateBook', () => {
      test('updates book with FormData', async () => {
        const updateData = {
          title: 'Updated Title',
          status: 'available'
        };
        
        mockedAxios.request.mockResolvedValue({ data: { id: 1, ...updateData } });
        
        await bookApi.updateBook(1, updateData);
        
        const callArgs = mockedAxios.request.mock.calls[0][0];
        expect(callArgs.method).toBe('put');
        expect(callArgs.url).toBe('/books/1');
        expect(callArgs.data).toBeInstanceOf(FormData);
      });
    });

    describe('deleteBook', () => {
      test('deletes book by id', async () => {
        mockedAxios.request.mockResolvedValue({ data: null });
        
        await bookApi.deleteBook(1);
        
        expect(mockedAxios.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'delete',
            url: '/books/1'
          })
        );
      });
    });

    describe('uploadCover', () => {
      test('uploads cover image', async () => {
        const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        mockedAxios.request.mockResolvedValue({ data: { id: 1, cover_image_uri: '/covers/1.jpg' } });
        
        await bookApi.uploadCover(1, mockFile);
        
        const callArgs = mockedAxios.request.mock.calls[0][0];
        expect(callArgs.method).toBe('post');
        expect(callArgs.url).toBe('/books/1/cover');
      });
    });
  });

  describe('Response Interceptor - Token Refresh', () => {
    let originalRequest: any;

    beforeEach(() => {
      originalRequest = {
        url: '/books',
        method: 'get',
        headers: {},
        _retry: false
      };
    });

    test('retries request with new token after 401', async () => {
      const newToken = 'new-token';
      
      // Первый запрос падает с 401
      const error401 = {
        response: { status: 401 },
        config: originalRequest
      };
      
      // Запрос на refresh возвращает новый токен
      const refreshResponse = {
        data: { access_token: newToken }
      };
      
      // Повторный запрос успешен
      const retryResponse = { data: { success: true } };
      
      mockedAxios.request
        .mockRejectedValueOnce(error401)
        .mockResolvedValueOnce(refreshResponse)
        .mockResolvedValueOnce(retryResponse);
      
      const result = await api.get('/books');
      
      expect(result.data).toEqual(retryResponse.data);
      expect(localStorage.getItem('token')).toBe(newToken);
    });

    test('does not retry for auth endpoints', async () => {
      const error401 = {
        response: { status: 401 },
        config: { url: '/auth/login' }
      };
      
      mockedAxios.request.mockRejectedValue(error401);
      
      await expect(api.post('/auth/login')).rejects.toEqual(error401);
    });
  });
});