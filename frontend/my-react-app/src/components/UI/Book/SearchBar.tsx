import React from "react";
import "./SearchBar.css";

type Props = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (query: string) => void;
};

const SearchBar: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    onSearchSubmit(searchQuery);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(e.target.value);
  };

  return (
    <section className="search-bar-section">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={handleChange}
            placeholder="Введите название или автора"
            className="search-input"
          />

          <button type="submit" className="search-button">
            <img
              src="/assets/search.svg"
              alt="Поиск"
              className="search-icon"
            />
          </button>
        </div>
      </form>
    </section>
  );
};

export default SearchBar;
