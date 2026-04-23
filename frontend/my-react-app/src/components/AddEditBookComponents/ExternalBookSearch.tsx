import React, { useState } from 'react';
import { bookApi, type ExternalBook } from '../../lib/api';

type ExternalBookSearchProps = {
  onSelect: (book: ExternalBook) => void;
  loading?: boolean;
};

export const ExternalBookSearch: React.FC<ExternalBookSearchProps> = ({ 
  onSelect, 
  loading: parentLoading 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ExternalBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await bookApi.searchExternalBooks(query);
      setResults(response.data.items || []);
      
      if (response.data.items?.length === 0) {
        setError('Ничего не найдено');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        setError('Слишком много запросов. Попробуйте позже');
      } else if (status === 504) {
        setError('Сервис временно недоступен. Попробуйте позже');
      } else {
        setError('Ошибка поиска. Попробуйте позже');
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="external-search" data-testid="external-search-section">
      <div className="search-group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск книги в Google Books..."
          disabled={loading || parentLoading}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          data-testid="external-search-input"
        />
        <button onClick={handleSearch} data-testid="external-search-button" disabled={loading || parentLoading}>
          {loading ? 'Поиск...' : 'Найти'}
        </button>
      </div>
      
      {loading && (
        <div className="loading-state" data-testid="external-search-loading">
          <div className="spinner-small"></div>
          <p>Поиск книг...</p>
        </div>
      )}
      
      {error && (
        <div className="error-state" data-testid="external-search-error">
          <p>{error}</p>
          <span className="fallback-hint">Вы можете продолжить заполнение вручную</span>
        </div>
      )}
      
      {results.length > 0 && (
        <div className="search-results" data-testid="external-book-results">
          <h4>Результаты поиска:</h4>
          <ul>
            {results.map((book, idx) => (
              <li key={idx} onClick={() => onSelect(book)} className="result-item" data-testid={`external-book-${idx}`}>
                {book.cover_image && (
                  <img src={book.cover_image} alt="" width="40" />
                )}
                <div className="result-info">
                  <strong>{book.title}</strong>
                  <p>{book.authors?.join(', ') || 'Автор не указан'}</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(book);
                  }}
                  data-testid={`import-book-${idx}`}
                  className="import-button"
                >
                  Импортировать
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};