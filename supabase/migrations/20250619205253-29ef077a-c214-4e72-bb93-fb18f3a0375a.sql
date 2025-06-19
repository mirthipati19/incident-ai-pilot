
-- Insert admin user into admin_users table
INSERT INTO public.admin_users (user_id, role, permissions)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'mirthipatioffcial@gmail.com' LIMIT 1),
  'admin',
  ARRAY['view_tickets', 'manage_users', 'view_stats', 'admin_dashboard']
)
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions;

-- Add some sample AI resolution data for visualization
INSERT INTO public.ai_resolution_stats (
  incident_id,
  resolution_method,
  resolution_time_minutes,
  user_satisfaction_score,
  ai_confidence_score,
  resolved_at
) VALUES
(
  (SELECT id FROM public.incidents ORDER BY created_at DESC LIMIT 1),
  'auto',
  15,
  5,
  0.95,
  now() - INTERVAL '1 hour'
),
(
  (SELECT id FROM public.incidents ORDER BY created_at DESC LIMIT 1 OFFSET 1),
  'escalated',
  45,
  4,
  0.75,
  now() - INTERVAL '2 hours'
),
(
  (SELECT id FROM public.incidents ORDER BY created_at DESC LIMIT 1 OFFSET 2),
  'auto',
  8,
  5,
  0.98,
  now() - INTERVAL '3 hours'
),
(
  (SELECT id FROM public.incidents ORDER BY created_at DESC LIMIT 1 OFFSET 3),
  'auto',
  12,
  4,
  0.88,
  now() - INTERVAL '4 hours'
),
(
  (SELECT id FROM public.incidents ORDER BY created_at DESC LIMIT 1 OFFSET 4),
  'escalated',
  60,
  3,
  0.65,
  now() - INTERVAL '5 hours'
);

-- Update some incidents to have better test data
UPDATE public.incidents 
SET status = 'Resolved', 
    assignee = 'AI Assistant',
    updated_at = now()
WHERE id IN (
  SELECT id FROM public.incidents 
  ORDER BY created_at DESC 
  LIMIT 3
);
