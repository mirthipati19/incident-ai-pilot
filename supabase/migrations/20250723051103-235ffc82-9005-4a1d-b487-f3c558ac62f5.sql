-- Update the existing admin user record to link to the organization
UPDATE admin_users 
SET organization_id = '4e32c8ae-7560-47ee-869f-5618549d1d52'
WHERE user_id = '666f8e41-9c4c-44fb-80ff-a5ebeee540a9';

-- Add forgot password functionality by adding a password reset tokens table
CREATE TABLE IF NOT EXISTS admin_password_resets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_password_resets ENABLE ROW LEVEL SECURITY;

-- Create policy for password reset tokens
CREATE POLICY "Anyone can create password reset tokens" 
  ON admin_password_resets 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can view their password reset tokens" 
  ON admin_password_resets 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can update password reset tokens" 
  ON admin_password_resets 
  FOR UPDATE 
  USING (true);