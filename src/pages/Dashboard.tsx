import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchRestaurants, addRestaurant as addRestaurantDb, updateRestaurant, deleteRestaurant } from '../lib/supabase';
import type { Restaurant, RestaurantUpdate } from '../types';
import Navbar from '../components/Navbar';
import Map from '../components/Map';
import AddRestaurant from '../components/AddRestaurant';
import RestaurantPopup from '../components/RestaurantPopup';
import RestaurantList from '../components/RestaurantList';

export default function Dashboard() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingPin, setAddingPin] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [listFilter, setListFilter] = useState<'want_to_go' | 'visited' | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchRestaurants(user.id).then(setRestaurants).catch(console.error);
  }, [user]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (addingPin) {
      setPendingCoords({ lat, lng });
      setAddingPin(false);
    }
  }, [addingPin]);

  const handlePinClick = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowAddForm(false);
  }, []);

  const handleAdd = async (name: string, lat: number, lng: number, status: 'want_to_go' | 'visited', sourceUrl?: string) => {
    if (!user) return;
    try {
      const newRestaurant = await addRestaurantDb({
        user_id: user.id,
        name,
        lat,
        lng,
        status,
        photo_url: null,
        yelp_url: sourceUrl || null,
        yelp_rating: null,
        cuisine_type: null,
        personal_rating: null,
        personal_review: null,
      });
      setRestaurants((prev) => [newRestaurant, ...prev]);
      setShowAddForm(false);
      setAddingPin(false);
      setPendingCoords(null);
    } catch (err) {
      console.error('Failed to add restaurant:', err);
    }
  };

  const handleUpdate = async (id: string, updates: RestaurantUpdate) => {
    try {
      const updated = await updateRestaurant(id, updates);
      setRestaurants((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setSelectedRestaurant(updated);
    } catch (err) {
      console.error('Failed to update restaurant:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRestaurant(id);
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
      setSelectedRestaurant(null);
    } catch (err) {
      console.error('Failed to delete restaurant:', err);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
      <Navbar
        restaurants={restaurants}
        onAddRestaurant={() => { setShowAddForm(true); setListFilter(null); }}
        onShowList={(filter) => { setListFilter(filter); setShowAddForm(false); setSelectedRestaurant(null); }}
      />
      <Map
        restaurants={restaurants}
        onMapClick={handleMapClick}
        onPinClick={handlePinClick}
        addingPin={addingPin}
      />

      {/* Restaurant list */}
      {listFilter && (
        <RestaurantList
          restaurants={restaurants}
          filter={listFilter}
          onSelect={(r) => { setSelectedRestaurant(r); setListFilter(null); }}
          onClose={() => setListFilter(null)}
        />
      )}

      {/* Add form */}
      {showAddForm && (
        <AddRestaurant
          onAdd={handleAdd}
          onCancel={() => {
            setShowAddForm(false);
            setAddingPin(false);
            setPendingCoords(null);
          }}
          addingPin={addingPin}
          onStartPlacing={() => setAddingPin(true)}
          pendingCoords={pendingCoords}
        />
      )}

      {/* Restaurant detail panel */}
      {selectedRestaurant && (
        <RestaurantPopup
          key={selectedRestaurant.id}
          restaurant={selectedRestaurant}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setSelectedRestaurant(null)}
        />
      )}
    </div>
  );
}
