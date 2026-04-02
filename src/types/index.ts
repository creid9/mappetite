export interface Restaurant {
  id: string;
  user_id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'want_to_go' | 'visited';
  photo_url: string | null;
  yelp_url: string | null;
  yelp_rating: number | null;
  cuisine_type: string | null;
  personal_rating: number | null;
  personal_review: string | null;
  created_at: string;
}

export type RestaurantInsert = Omit<Restaurant, 'id' | 'created_at'>;
export type RestaurantUpdate = Partial<Omit<Restaurant, 'id' | 'user_id' | 'created_at'>>;
