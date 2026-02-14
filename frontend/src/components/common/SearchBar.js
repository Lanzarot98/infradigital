import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import './SearchBar.css';

const SearchBar = ({ value, onChange, placeholder }) => {
  var searchPlaceholder = placeholder || 'Buscar...';
  var controlledValue = value !== undefined ? value : undefined;
  var isControlled = controlledValue !== undefined;

  var internalRef = useRef(isControlled ? controlledValue : '');
  var debounceRef = useRef(null);
  var inputRef = useRef(null);

  var displayValue = isControlled ? controlledValue : internalRef.current;

  var localVal = useState(displayValue || '');
  var localValue = localVal[0];
  var setLocalValue = localVal[1];

  useEffect(function() {
    if (isControlled) {
      setLocalValue(controlledValue || '');
    }
  }, [controlledValue, isControlled]);

  var handleChange = function(e) {
    var newValue = e.target.value;
    setLocalValue(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(function() {
      if (onChange) {
        onChange(newValue);
      }
      internalRef.current = newValue;
    }, 300);
  };

  var handleClear = function() {
    setLocalValue('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (onChange) {
      onChange('');
    }
    internalRef.current = '';
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(function() {
    return function() {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="search-bar">
      <div className="search-bar__icon">
        <FiSearch size={18} />
      </div>
      <input
        ref={inputRef}
        type="text"
        className="search-bar__input"
        value={localValue}
        onChange={handleChange}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
      />
      {localValue && localValue.length > 0 && (
        <button
          className="search-bar__clear"
          onClick={handleClear}
          aria-label="Limpiar b\u00fasqueda"
          type="button"
        >
          <FiX size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
