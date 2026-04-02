import { useState, useMemo } from 'react';
import type { Restaurant } from '../types';

interface RestaurantListProps {
  restaurants: Restaurant[];
  filter: 'want_to_go' | 'visited';
  onSelect: (restaurant: Restaurant) => void;
  onClose: () => void;
}

export default function RestaurantList({ restaurants, filter, onSelect, onClose }: RestaurantListProps) {
  const [cuisineFilter, setCuisineFilter] = useState<string | null>(null);

  const statusFiltered = restaurants.filter(r => r.status === filter);

  const cuisines = useMemo(() => {
    const set = new Set<string>();
    statusFiltered.forEach(r => {
      if (r.cuisine_type) set.add(r.cuisine_type);
    });
    return Array.from(set).sort();
  }, [statusFiltered]);

  const filtered = cuisineFilter
    ? statusFiltered.filter(r => r.cuisine_type === cuisineFilter)
    : statusFiltered;

  const title = filter === 'want_to_go' ? 'Saved Restaurants' : 'Visited Restaurants';

  return (
    <div className="absolute top-16 left-4 z-30 w-80 max-h-[calc(100%-5rem)] bg-gray-800 rounded-xl shadow-xl border border-gray-700 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Cuisine filter chips */}
      {cuisines.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-700 flex flex-wrap gap-1.5">
          <button
            onClick={() => setCuisineFilter(null)}
            className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
              cuisineFilter === null
                ? 'bg-amber-300 text-gray-900 font-semibold'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {cuisines.map(c => (
            <button
              key={c}
              onClick={() => setCuisineFilter(cuisineFilter === c ? null : c)}
              className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                cuisineFilter === c
                  ? 'bg-amber-300 text-gray-900 font-semibold'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-y-auto flex-1">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">No restaurants yet.</p>
        ) : (
          filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelect(r)}
              className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium truncate">{r.name}</span>
                <span className={`text-xs ml-2 font-medium ${r.status === 'visited' ? 'text-green-400' : 'text-red-400'}`}>
                  {r.status === 'visited' ? 'Visited' : 'Saved'}
                </span>
              </div>
              {r.cuisine_type && (
                <span className="text-xs text-amber-300">{r.cuisine_type}</span>
              )}
              {r.personal_rating != null && r.personal_rating > 0 && (
                <span className="text-xs text-yellow-400 ml-2">{'★'.repeat(r.personal_rating)}</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
