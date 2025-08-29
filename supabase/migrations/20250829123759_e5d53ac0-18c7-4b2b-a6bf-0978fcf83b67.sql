-- Enhance profiles table with additional user data fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'United States',
ADD COLUMN IF NOT EXISTS emergency_contact_name text,
ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
ADD COLUMN IF NOT EXISTS skills text[],
ADD COLUMN IF NOT EXISTS certifications text[],
ADD COLUMN IF NOT EXISTS experience_years integer,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS hire_date date,
ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS security_clearance text,
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}';

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Create index on email for faster lookups  
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Update RLS policies to allow users to view basic profile info of other users
CREATE POLICY "Users can view basic profile info of others" 
ON profiles 
FOR SELECT 
USING (status = 'active' AND (user_id = auth.uid() OR true));

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;