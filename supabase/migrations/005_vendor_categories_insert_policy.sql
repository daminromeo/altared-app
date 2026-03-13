-- Allow authenticated users to insert custom categories
create policy "Authenticated users can insert categories"
  on public.vendor_categories for insert
  with check (auth.role() = 'authenticated');

-- Add wedding_name column to profiles (used in header, sharing, onboarding)
alter table public.profiles
  add column if not exists wedding_name text;
