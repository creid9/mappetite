import { useAuth } from '../context/AuthContext';
import type { Restaurant } from '../types';

interface NavbarProps {
  restaurants: Restaurant[];
  onAddRestaurant: () => void;
  onShowList: (filter: 'want_to_go' | 'visited') => void;
}

export default function Navbar({ restaurants, onAddRestaurant, onShowList }: NavbarProps) {
  const { signOut } = useAuth();
  const wantCount = restaurants.filter(r => r.status === 'want_to_go').length;
  const visitedCount = restaurants.filter(r => r.status === 'visited').length;

  return (
    <nav className="absolute top-0 left-0 right-0 z-20 bg-gray-900/90 backdrop-blur-sm border-b border-gray-700">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold text-amber-300">Mappetite</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm hidden sm:flex items-center gap-1">
            <button
              onClick={() => onShowList('want_to_go')}
              className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              {wantCount} saved
            </button>
            <span className="text-gray-500"> · </span>
            <button
              onClick={() => onShowList('visited')}
              className="text-green-400 hover:text-green-300 transition-colors cursor-pointer"
            >
              {visitedCount} visited
            </button>
          </div>
          <button
            onClick={onAddRestaurant}
            className="px-3 py-1.5 text-sm bg-amber-300 hover:bg-amber-400 text-gray-900 font-semibold rounded-lg transition-colors"
          >
            + Add Restaurant
          </button>
          <button
            onClick={signOut}
            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
