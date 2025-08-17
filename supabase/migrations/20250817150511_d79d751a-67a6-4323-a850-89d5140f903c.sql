-- Secure admin_password_resets by removing overly permissive public access
-- 1) Ensure RLS is enabled (defensive)
ALTER TABLE public.admin_password_resets ENABLE ROW LEVEL SECURITY;

-- 2) Drop permissive policies that expose tokens to everyone
DROP POLICY IF EXISTS "Anyone can create password reset tokens" ON public.admin_password_resets;
DROP POLICY IF EXISTS "Anyone can update password reset tokens" ON public.admin_password_resets;
DROP POLICY IF EXISTS "Anyone can view their password reset tokens" ON public.admin_password_resets;

-- 3) Do NOT add new public policies.
--    Edge functions run with the service role key and bypass RLS,
--    so password reset functionality via server remains intact.
--    Clients can no longer read, insert, or update reset tokens directly.
