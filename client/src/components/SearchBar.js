import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

const SearchBar = ({ value, onChange, placeholder = 'Search...', onClear }) => {
  return (
    <div className="search-bar">
      <FiSearch className="search-icon" size={16} />
      <input
        type="text"
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button className="btn-icon search-clear" onClick={onClear || (() => onChange(''))} aria-label="Clear search">
          <FiX size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
