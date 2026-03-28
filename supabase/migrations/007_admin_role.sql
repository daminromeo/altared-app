-- Add admin flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set admin for damin.romeo@gmail.com
UPDATE profiles SET is_admin = true WHERE email = 'damin.romeo@gmail.com';
