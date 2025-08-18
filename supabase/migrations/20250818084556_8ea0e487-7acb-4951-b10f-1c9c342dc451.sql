-- Secure admin_password_resets table to prevent token leakage
-- 1) Enable and force RLS (defense-in-depth)
ALTER TABLE public.admin_password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_password_resets FORCE ROW LEVEL SECURITY;

-- 2) Remove any permissive/public policies if they exist
DROP POLICY IF EXISTS "Anyone can create password reset tokens" ON public.admin_password_resets;
DROP POLICY IF EXISTS "Anyone can update password reset tokens" ON public.admin_password_resets;
DROP POLICY IF EXISTS "Anyone can view their password reset tokens" ON public.admin_password_resets;

-- Note: Edge functions use the service role key and bypass RLS, so functionality remains intact.
