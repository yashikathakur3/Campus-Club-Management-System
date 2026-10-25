import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';

export default function SearchInput({ onSearchChange, placeholder = 'Search', label = 'Search' }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  useEffect(() => { onSearchChange?.(debouncedQuery.trim()); }, [debouncedQuery, onSearchChange]);

  return (
    <div className="relative w-full max-w-sm">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        aria-label={label}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-control border border-slate-200 bg-white pl-9 pr-10 text-sm shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"><X aria-hidden="true" className="h-4 w-4" /></button>}
    </div>
  );
}
