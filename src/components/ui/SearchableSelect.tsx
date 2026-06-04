import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  searchText?: string;
}

interface SearchableSelectProps {
  value: string;
  options: SearchableSelectOption[];
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  options,
  placeholder = 'Search or select',
  loading = false,
  disabled = false,
  className = '',
  onChange,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOption = options.find((option) => option.value === value);
  const inputValue = open ? query : selectedOption?.label ?? '';

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery || selectedOption?.label === query) return options.slice(0, 50);

    return options
      .filter((option) => (option.searchText ?? option.label).toLowerCase().includes(normalizedQuery))
      .slice(0, 50);
  }, [options, query, selectedOption?.label]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    setOpen(true);
    if (value && nextQuery !== selectedOption?.label) onChange('');
  };

  const selectOption = (option: SearchableSelectOption) => {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
  };

  const openDropdown = () => {
    if (!open) setQuery('');
    setOpen(true);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        type="text"
        value={inputValue}
        disabled={disabled}
        placeholder={loading ? 'Loading members...' : placeholder}
        onFocus={openDropdown}
        onClick={openDropdown}
        onChange={handleInputChange}
        className="h-10 w-full border-0 border-b border-gray-200 bg-amber-50/30 px-0 pr-8 text-sm font-medium text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-teal-700 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

      {open && !disabled && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-xl"
          role="listbox"
        >
          {loading ? (
            <div className="px-3 py-2 text-sm font-semibold text-gray-500">Loading members...</div>
          ) : filteredOptions.length ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => selectOption(option)}
                className={`block w-full px-3 py-2 text-left text-sm font-semibold transition hover:bg-amber-50 ${
                  option.value === value ? 'bg-amber-50 text-teal-700' : 'text-gray-800'
                }`}
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm font-semibold text-gray-500">No matching members found</div>
          )}
        </div>
      )}
    </div>
  );
};
