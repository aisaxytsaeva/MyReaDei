// src/components/BookCard/BookCard.test.tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BookCard  from './BookCard';

describe('BookCard Component', () => {
  const mockBook = {
    id: 1,
    title: 'Война и мир',
    author: 'Лев Толстой',
    cover_image_uri: '/assets/cover.png',
    readers_count: 150,
    tags: [{ id: 1, tag_name: 'Роман' }]
  };

  test('renders book information correctly', () => {
    render(
      <BrowserRouter>
        <BookCard book={mockBook} /> 
      </BrowserRouter>
    );

    expect(screen.getByText('Война и мир')).toBeInTheDocument();
    expect(screen.getByText('Лев Толстой')).toBeInTheDocument();
  });
});