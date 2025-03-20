-- This script fixes authentication and user profile trigger issues
-- Run this in your Supabase SQL Editor if you're having trouble with user registration

-- 1. First check if the table exists, if not, create it
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT,
  height_cm INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Drop existing trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- 3. Replace the function with a more robust version
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract metadata from auth user if available
  INSERT INTO user_profiles (
    id, 
    first_name, 
    last_name, 
    bio, 
    height_cm
  )
  VALUES (
    NEW.id, 
    COALESCE((NEW.raw_user_meta_data->>'first_name')::TEXT, (NEW.raw_user_meta_data->>'firstName')::TEXT, ''),
    COALESCE((NEW.raw_user_meta_data->>'last_name')::TEXT, (NEW.raw_user_meta_data->>'lastName')::TEXT, ''),
    'A fitness enthusiast',
    170
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the transaction
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger again
CREATE TRIGGER create_profile_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_user();

-- 5. Fix Row Level Security if needed
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Make sure RLS policies exist - Use a more compatible approach
-- Create policies directly instead of checking if they exist
DO $$
BEGIN
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Users can view their own profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update their own profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Users can insert their own profiles" ON user_profiles;
  
  -- Create new policies
  CREATE POLICY "Users can view their own profiles"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);
  
  CREATE POLICY "Users can update their own profiles"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);
  
  CREATE POLICY "Users can insert their own profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
END
$$;

-- 7. Create or replace the get_auth_uid function to fix auth.uid issues
-- This function helps test if auth.uid is working
DROP FUNCTION IF EXISTS get_auth_uid();

CREATE OR REPLACE FUNCTION get_auth_uid()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_id uuid;
BEGIN
  -- Use auth.uid() in a safer way
  BEGIN
    auth_id := auth.uid();
    RETURN auth_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error accessing auth.uid: %', SQLERRM;
    RETURN NULL;
  END;
END;
$$;

-- 8. Fix permissions on the function to ensure it can be executed by authenticated users
ALTER FUNCTION get_auth_uid() SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION get_auth_uid() TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_uid() TO anon; 