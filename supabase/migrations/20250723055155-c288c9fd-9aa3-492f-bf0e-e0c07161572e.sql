-- Create a test admin user with known credentials
-- First, let's create the auth user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@authexa.me',
  crypt('AdminPass123!', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"email": "admin@authexa.me", "name": "Test Admin", "role": "admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Now create the admin_users record linked to this auth user
INSERT INTO admin_users (
  user_id,
  organization_id,
  role,
  permissions,
  is_email_verified
)
SELECT 
  au.id,
  '4e32c8ae-7560-47ee-869f-5618549d1d52',
  'admin',
  ARRAY['view_tickets', 'manage_users', 'view_stats', 'full_admin'],
  true
FROM auth.users au 
WHERE au.email = 'admin@authexa.me'
AND NOT EXISTS (
  SELECT 1 FROM admin_users WHERE user_id = au.id
);