-- Create the restaurants table
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  status text not null check (status in ('want_to_go', 'visited')),
  photo_url text,
  yelp_url text,
  yelp_rating double precision,
  cuisine_type text,
  personal_rating integer check (personal_rating is null or (personal_rating >= 1 and personal_rating <= 5)),
  personal_review text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.restaurants enable row level security;

-- Policy: Users can only see their own rows
create policy "Users can view own restaurants"
  on public.restaurants for select
  using (auth.uid() = user_id);

-- Policy: Users can only insert their own rows
create policy "Users can insert own restaurants"
  on public.restaurants for insert
  with check (auth.uid() = user_id);

-- Policy: Users can only update their own rows
create policy "Users can update own restaurants"
  on public.restaurants for update
  using (auth.uid() = user_id);

-- Policy: Users can only delete their own rows
create policy "Users can delete own restaurants"
  on public.restaurants for delete
  using (auth.uid() = user_id);

-- Create storage bucket for photos (run in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('restaurant-photos', 'restaurant-photos', true);

-- Storage policy: Users can upload to their own folder
-- create policy "Users can upload own photos"
--   on storage.objects for insert
--   with check (bucket_id = 'restaurant-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy: Anyone can view photos (public bucket)
-- create policy "Public photo access"
--   on storage.objects for select
--   using (bucket_id = 'restaurant-photos');
