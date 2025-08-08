-- Create admin_users record for existing user
INSERT INTO admin_users (
  user_id, 
  organization_id, 
  role, 
  permissions, 
  is_email_verified,
  created_at
) VALUES (
  '5d26df3d-cba1-4ea8-95d1-1dd7d6f32ca7',
  '4e32c8ae-7560-47ee-869f-5618549d1d52',
  'admin',
  ARRAY['view_tickets', 'manage_users', 'view_stats', 'full_admin'],
  true,
  now()
);