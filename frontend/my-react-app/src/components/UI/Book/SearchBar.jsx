import React from 'react';

const SearchBar = ({ searchQuery, onSearchChange, onSearchSubmit }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearchSubmit(searchQuery);
  };

  return (
    <section>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Введите название или автора"
        />
      </form>
    </section>
  );
};

export default SearchBar;