-- Add user_id to vendor_categories so custom categories are per-user
-- Default/seed categories have user_id = NULL (visible to all)
-- Custom categories have user_id set (visible only to that user)

ALTER TABLE public.vendor_categories ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Drop the global unique constraint on name
ALTER TABLE public.vendor_categories DROP CONSTRAINT IF EXISTS vendor_categories_name_key;

-- Add a unique constraint scoped to user (NULL user_id = global, so two users can each have "Hotel")
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_categories_name_user
  ON public.vendor_categories (name, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'));

-- Update RLS: users can see default categories (user_id IS NULL) + their own custom ones
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.vendor_categories;
CREATE POLICY "Users can view default and own categories"
  ON public.vendor_categories FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

-- Update INSERT policy: users can only insert categories with their own user_id
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.vendor_categories;
CREATE POLICY "Users can insert own categories"
  ON public.vendor_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own custom categories
CREATE POLICY "Users can delete own categories"
  ON public.vendor_categories FOR DELETE
  USING (auth.uid() = user_id);
