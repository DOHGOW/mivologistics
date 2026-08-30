import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { searchAddressSuggestions, type GeocodeResult } from '../lib/geocode';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onSelect: (result: GeocodeResult) => void;
  placeholder?: string;
  inputClassName?: string;
  onEnter?: () => void;
}

/**
 * Free address autocomplete via Nominatim (OpenStreetMap) — debounced
 * search-as-you-type with a real result list, standing in for a paid
 * Google Places widget without needing a Google Cloud billing account.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  inputClassName,
  onEnter,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (text: string) => {
    onChange(text);
    setOpen(true);
    clearTimeout(debounceRef.current);

    if (text.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const requestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      const results = await searchAddressSuggestions(text).catch(() => []);
      if (requestId === requestIdRef.current) {
        setSuggestions(results);
        setLoading(false);
      }
    }, 400);
  };

  const handleSelect = (result: GeocodeResult) => {
    onSelect(result);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full flex items-center gap-2">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        className={inputClassName}
        autoComplete="off"
      />
      {loading && <Loader2 className="w-4 h-4 text-gray-300 animate-spin shrink-0" />}

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-64 overflow-y-auto no-scrollbar">
          {suggestions.map((s, i) => (
            <button
              key={`${s.lat}-${s.lng}-${i}`}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
            >
              <MapPin className="w-4 h-4 text-[#ff8c00] mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700 leading-snug">{s.displayName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
