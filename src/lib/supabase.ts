import { createClient } from '@supabase/supabase-js';
import type { Restaurant, RestaurantInsert, RestaurantUpdate } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Restaurant CRUD ---

export async function fetchRestaurants(userId: string): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Restaurant[];
}

export async function addRestaurant(restaurant: RestaurantInsert): Promise<Restaurant> {
  const { data, error } = await supabase
    .from('restaurants')
    .insert(restaurant)
    .select()
    .single();

  if (error) throw error;
  return data as Restaurant;
}

export async function updateRestaurant(id: string, updates: RestaurantUpdate): Promise<Restaurant> {
  const { data, error } = await supabase
    .from('restaurants')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Restaurant;
}

export async function deleteRestaurant(id: string): Promise<void> {
  const { error } = await supabase
    .from('restaurants')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// --- Photo Upload ---

export async function uploadPhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('restaurant-photos')
    .upload(path, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from('restaurant-photos')
    .getPublicUrl(path);

  return data.publicUrl;
}
