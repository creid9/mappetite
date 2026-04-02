import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Restaurant } from '../types';

interface MapProps {
  restaurants: Restaurant[];
  onMapClick: (lat: number, lng: number) => void;
  onPinClick: (restaurant: Restaurant) => void;
  addingPin: boolean;
}

export default function Map({ restaurants, onMapClick, onPinClick, addingPin }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 20],
      zoom: 1.5,
      projection: 'globe',
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    map.on('style.load', () => {
      map.setFog({
        color: 'rgb(20, 20, 30)',
        'high-color': 'rgb(40, 40, 70)',
        'horizon-blend': 0.08,
        'space-color': 'rgb(10, 10, 20)',
        'star-intensity': 0.6,
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle map click for adding pins
  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    onMapClick(e.lngLat.lat, e.lngLat.lng);
  }, [onMapClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (addingPin) {
      map.getCanvas().style.cursor = 'crosshair';
      map.on('click', handleMapClick);
    } else {
      map.getCanvas().style.cursor = '';
      map.off('click', handleMapClick);
    }

    return () => {
      map.off('click', handleMapClick);
    };
  }, [addingPin, handleMapClick]);

  // Render markers
  useEffect(() => {
    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const map = mapRef.current;
    if (!map) return;

    restaurants.forEach((restaurant) => {
      const el = document.createElement('div');
      el.className = 'cursor-pointer';
      el.style.width = '24px';
      el.style.height = '32px';

      const color = restaurant.status === 'visited' ? '#22c55e' : '#ef4444';
      const darkColor = restaurant.status === 'visited' ? '#166534' : '#991b1b';

      el.innerHTML = `<svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
        <circle cx="12" cy="11" r="5" fill="${darkColor}" opacity="0.4"/>
        <circle cx="12" cy="11" r="3.5" fill="white" opacity="0.3"/>
      </svg>`;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onPinClick(restaurant);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([restaurant.lng, restaurant.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [restaurants, onPinClick]);

  return (
    <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
  );
}
