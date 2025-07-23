-- Fix admin_users RLS policies to allow admin user creation during registration

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view their own record" ON admin_users;

-- Create proper RLS policies for admin_users table
CREATE POLICY "Anyone can create admin users during registration" 
  ON admin_users 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can view their own record" 
  ON admin_users 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update their own record" 
  ON admin_users 
  FOR UPDATE 
  USING (auth.uid() = user_id);