// src/pages/Books/CatalogPage.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import HomePage from './HomePage';
import { AuthProvider } from '../../../context/AuthContext';
import api  from '../../../lib/api';

jest.mock('../../services/api');

describe('CatalogPage User Scenarios', () => {
  const mockBooks = {
    items: [
      { id: 1, title: 'Book 1', author: 'Author 1', readers_count: 10, tags: [] },
      { id: 2, title: 'Book 2', author: 'Author 2', readers_count: 20, tags: [] }
    ],
    total: 2,
    skip: 0,
    limit: 10
  };

  beforeEach(() => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockBooks });
  });

  test('loads and displays books on mount', async () => {
    render(
      <AuthProvider>
        <HomePage />
      </AuthProvider>
    );

    expect(screen.getByText(/загрузка/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Book 1')).toBeInTheDocument();
      expect(screen.getByText('Book 2')).toBeInTheDocument();
    });
  });

  test('filters books by search query', async () => {
    render(
      <AuthProvider>
        <HomePage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Book 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/поиск/i);
    fireEvent.change(searchInput, { target: { value: 'Book 1' } });
    fireEvent.click(screen.getByRole('button', { name: /искать/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('search=Book 1'));
    });
  });

  test('handles loading state correctly', async () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    render(
      <AuthProvider>
        <HomePage />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  test('displays error message on API failure', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(
      <AuthProvider>
        <HomePage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/ошибка загрузки/i)).toBeInTheDocument();
    });
  });
});

