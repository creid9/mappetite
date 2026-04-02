import { useState } from 'react';
import type { Restaurant, RestaurantUpdate } from '../types';
import StarRating from './StarRating';

interface RestaurantPopupProps {
  restaurant: Restaurant;
  onUpdate: (id: string, updates: RestaurantUpdate) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function RestaurantPopup({ restaurant, onUpdate, onDelete, onClose }: RestaurantPopupProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: restaurant.name,
    status: restaurant.status,
    yelp_url: restaurant.yelp_url || '',
    cuisine_type: restaurant.cuisine_type || '',
    personal_rating: restaurant.personal_rating || 0,
    personal_review: restaurant.personal_review || '',
  });

  const handleSave = () => {
    onUpdate(restaurant.id, {
      name: form.name,
      status: form.status as 'want_to_go' | 'visited',
      yelp_url: form.yelp_url || null,
      cuisine_type: form.cuisine_type || null,
      personal_rating: form.personal_rating || null,
      personal_review: form.personal_review || null,
    });
    setEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${restaurant.name}"? This cannot be undone.`)) {
      onDelete(restaurant.id);
    }
  };

  const toggleStatus = () => {
    const newStatus = restaurant.status === 'want_to_go' ? 'visited' : 'want_to_go';
    onUpdate(restaurant.id, { status: newStatus });
  };

  return (
    <div className="absolute top-16 right-0 z-30 w-full sm:w-96 h-[calc(100%-4rem)] bg-gray-800 border-l border-gray-700 overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full text-xl font-bold bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            ) : (
              <h2 className="text-xl font-bold text-white truncate">{restaurant.name}</h2>
            )}
            <button
              onClick={toggleStatus}
              className={`mt-1 inline-block px-2.5 py-0.5 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                restaurant.status === 'visited'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {restaurant.status === 'visited' ? 'Been Here' : 'Want to Go'}
            </button>
          </div>
          <button
            onClick={onClose}
            className="ml-2 p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>


        {/* Yelp */}
        <div className="mt-4 space-y-3">
          {editing ? (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Link</label>
              <input
                type="url"
                value={form.yelp_url}
                onChange={(e) => setForm({ ...form, yelp_url: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="Yelp, TripAdvisor, Google Maps, etc."
              />
            </div>
          ) : (
            restaurant.yelp_url && (
              <a
                href={restaurant.yelp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
              >
                View Link ↗
              </a>
            )
          )}
        </div>

        {/* Cuisine */}
        <div className="mt-3">
          {editing ? (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cuisine Type</label>
              <input
                type="text"
                value={form.cuisine_type}
                onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="e.g. Italian, Sushi, BBQ"
              />
            </div>
          ) : (
            restaurant.cuisine_type && (
              <span className="inline-block px-2.5 py-1 bg-amber-300/20 text-amber-300 text-xs font-medium rounded-full">
                {restaurant.cuisine_type}
              </span>
            )
          )}
        </div>

        {/* Personal Rating */}
        <div className="mt-4">
          <label className="block text-sm text-gray-400 mb-1">My Rating</label>
          {editing ? (
            <StarRating rating={form.personal_rating} onChange={(r) => setForm({ ...form, personal_rating: r })} />
          ) : (
            <StarRating rating={restaurant.personal_rating || 0} readonly />
          )}
        </div>

        {/* Personal Review */}
        <div className="mt-4">
          <label className="block text-sm text-gray-400 mb-1">My Review</label>
          {editing ? (
            <textarea
              value={form.personal_review}
              onChange={(e) => setForm({ ...form, personal_review: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
              placeholder="What did you think?"
            />
          ) : (
            <p className="text-sm text-gray-300">
              {restaurant.personal_review || 'No review yet.'}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className="flex-1 py-2 bg-amber-300 hover:bg-amber-400 text-gray-900 text-sm font-semibold rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-semibold rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
