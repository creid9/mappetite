import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface AddRestaurantProps {
  onAdd: (name: string, lat: number, lng: number, status: 'want_to_go' | 'visited', sourceUrl?: string) => void;
  onCancel: () => void;
  addingPin: boolean;
  onStartPlacing: () => void;
  pendingCoords: { lat: number; lng: number } | null;
}

function extractNameFromUrl(url: string): { name: string; searchQuery: string; source: string; coords?: { lat: number; lng: number } } | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    // Yelp: yelp.com/biz/restaurant-name-city or /biz/restaurant-name-city-state
    if (host.includes('yelp.com')) {
      const match = parsed.pathname.match(/\/biz\/([^/?]+)/);
      if (match) {
        const parts = match[1].split('-');
        const fullText = parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return { name: fullText, searchQuery: fullText + ' restaurant', source: 'yelp' };
      }
    }

    // TripAdvisor: tripadvisor.com/Restaurant_Review-...-Reviews-Name-...
    if (host.includes('tripadvisor.com')) {
      const match = parsed.pathname.match(/Reviews-([^-]+(?:-[^-]+)*?)-Reviews/);
      if (match) {
        const name = match[1].replace(/_/g, ' ');
        return { name, searchQuery: name + ' restaurant', source: 'tripadvisor' };
      }
      const altMatch = parsed.pathname.match(/Restaurant_Review[^"]*?-Reviews-(.*?)-/);
      if (altMatch) {
        const name = altMatch[1].replace(/_/g, ' ');
        return { name, searchQuery: name + ' restaurant', source: 'tripadvisor' };
      }
    }

    // Google Maps: google.com/maps/place/Restaurant+Name/@lat,lng,...
    if (host.includes('google.com') || host.includes('goo.gl')) {
      const nameMatch = parsed.pathname.match(/\/place\/([^/@]+)/);
      const coordMatch = parsed.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (nameMatch) {
        const name = decodeURIComponent(nameMatch[1]).replace(/\+/g, ' ');
        const coords = coordMatch ? { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) } : undefined;
        return { name, searchQuery: name, source: 'google', coords };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export default function AddRestaurant({ onAdd, onCancel, addingPin, onStartPlacing, pendingCoords }: AddRestaurantProps) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'want_to_go' | 'visited'>('want_to_go');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Array<{ place_name: string; center: [number, number] }>>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pastedUrl, setPastedUrl] = useState('');
  const [urlParsing, setUrlParsing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (pendingCoords) {
      setCoords(pendingCoords);
    }
  }, [pendingCoords]);

  const sessionToken = useRef(crypto.randomUUID());

  const searchMapbox = async (query: string): Promise<Array<{ place_name: string; center: [number, number] }>> => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;

    // Step 1: Suggest
    const suggestRes = await fetch(
      `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&types=poi&limit=5&access_token=${token}&session_token=${sessionToken.current}`
    );
    const suggestData = await suggestRes.json();
    const suggestions = suggestData.suggestions || [];
    if (suggestions.length === 0) return [];

    // Step 2: Retrieve coordinates for each suggestion
    const results = await Promise.all(
      suggestions.map(async (s: { mapbox_id: string; name: string; full_address?: string; place_formatted?: string }) => {
        const retrieveRes = await fetch(
          `https://api.mapbox.com/search/searchbox/v1/retrieve/${s.mapbox_id}?access_token=${token}&session_token=${sessionToken.current}`
        );
        const retrieveData = await retrieveRes.json();
        const feature = retrieveData.features?.[0];
        if (!feature) return null;
        return {
          place_name: s.full_address || `${s.name}, ${s.place_formatted || ''}`,
          center: feature.geometry.coordinates as [number, number],
        };
      })
    );

    // Generate new session token for next search
    sessionToken.current = crypto.randomUUID();

    return results.filter((r): r is { place_name: string; center: [number, number] } => r !== null);
  };

  const handleUrlPaste = async (url: string) => {
    setPastedUrl(url);
    if (!url.trim()) return;

    const extracted = extractNameFromUrl(url.trim());
    if (!extracted) return;

    setUrlParsing(true);
    setName(extracted.name);

    // Use coords from URL if available (e.g. Google Maps), otherwise geocode
    if (extracted.coords) {
      setCoords(extracted.coords);
      setSearch(extracted.name);
      setUrlParsing(false);
    } else {
      try {
        const features = await searchMapbox(extracted.searchQuery);
        if (features.length > 0) {
          setSearch(features[0].place_name);
          setCoords({ lat: features[0].center[1], lng: features[0].center[0] });
          setResults([]);
        }
      } catch {
        // silently fail
      } finally {
        setUrlParsing(false);
      }
    }
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 3) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const features = await searchMapbox(query);
        setResults(features);
      } catch {
        setResults([]);
      }
    }, 300);
  };

  const selectResult = (result: { place_name: string; center: [number, number] }) => {
    setName(result.place_name.split(',')[0]);
    setCoords({ lat: result.center[1], lng: result.center[0] });
    setSearch(result.place_name);
    setResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !coords) return;
    onAdd(name.trim(), coords.lat, coords.lng, status, pastedUrl.trim() || undefined);
    setName('');
    setSearch('');
    setCoords(null);
    setPastedUrl('');
  };

  // Ensure mapbox token is set for geocoding
  if (!mapboxgl.accessToken) {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
  }

  return (
    <div className="absolute top-16 left-4 z-30 bg-gray-800 rounded-xl shadow-xl p-4 w-80 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-3">Add Restaurant</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Paste URL */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Paste a link</label>
          <input
            type="url"
            value={pastedUrl}
            onChange={(e) => handleUrlPaste(e.target.value)}
            placeholder="Yelp, TripAdvisor, or Google Maps URL"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          {urlParsing && <p className="text-xs text-amber-300 mt-1">Looking up restaurant...</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-600" />
          <span className="text-gray-500 text-xs">or search / place manually</span>
          <div className="flex-1 h-px bg-gray-600" />
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search for a place..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectResult(r)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-600 truncate"
                >
                  {r.place_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">or</span>
          <button
            type="button"
            onClick={onStartPlacing}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              addingPin
                ? 'bg-amber-300 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {addingPin ? 'Click on map...' : 'Place on map'}
          </button>
        </div>

        {coords && (
          <p className="text-xs text-green-400">
            Location set: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </p>
        )}

        <div>
          <label className="block text-sm text-gray-300 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
            placeholder="Restaurant name"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Status</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStatus('want_to_go')}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                status === 'want_to_go'
                  ? 'bg-red-500/20 text-red-400 border border-red-500'
                  : 'bg-gray-700 text-gray-400 border border-gray-600'
              }`}
            >
              Want to Go
            </button>
            <button
              type="button"
              onClick={() => setStatus('visited')}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                status === 'visited'
                  ? 'bg-green-500/20 text-green-400 border border-green-500'
                  : 'bg-gray-700 text-gray-400 border border-gray-600'
              }`}
            >
              Been Here
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!name.trim() || !coords}
            className="flex-1 py-2 bg-amber-300 hover:bg-amber-400 text-gray-900 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Pin
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
