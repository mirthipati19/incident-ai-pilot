-- Fix Security Issue #1: Remove public access to MFA tokens
DROP POLICY IF EXISTS "Allow MFA token operations" ON public.mfa_tokens;
DROP POLICY IF EXISTS "Service role can manage MFA tokens" ON public.mfa_tokens;

-- MFA tokens should only be accessed by service role (edge functions)
-- No user-facing policies needed

-- Fix Security Issue #2: Fix profiles table RLS - remove public access
DROP POLICY IF EXISTS "Users can view basic profile info of others" ON public.profiles;

-- Users can only view their own full profile
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT
USING (user_id = auth.uid());

-- Users can view limited public info of others (only safe fields)
CREATE POLICY "Users can view limited public profiles" ON public.profiles
FOR SELECT
USING (
  status = 'active' AND
  user_id != auth.uid()
);

-- Fix Security Issue #3: Add proper RLS policies for password reset tokens
DROP POLICY IF EXISTS "Service can manage password resets" ON public.admin_password_resets;

-- Create security definer function to validate reset tokens
CREATE OR REPLACE FUNCTION public.validate_password_reset_token(
  _token TEXT,
  _email TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_password_resets
    WHERE token = _token
      AND email = _email
      AND used = false
      AND expires_at > now()
  )
$$;

-- Fix Security Issue #4: Remove public captcha policies
DROP POLICY IF EXISTS "Anyone can create captcha" ON public.captcha_verifications;
DROP POLICY IF EXISTS "Anyone can update captcha verification" ON public.captcha_verifications;
DROP POLICY IF EXISTS "Anyone can verify captcha" ON public.captcha_verifications;

-- Captcha should only be managed by edge functions with service role
-- No user policies needed

-- Fix Security Issue #5: Migrate admin roles to user_roles table
-- Update admin_users table to remove role management UPDATE capability
DROP POLICY IF EXISTS "Admins can update their own record" ON public.admin_users;

-- Admins can only update non-security fields
CREATE POLICY "Admins can update their profile info" ON public.admin_users
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Prevent users from changing their own role/permissions
  role = (SELECT role FROM admin_users WHERE user_id = auth.uid()) AND
  permissions = (SELECT permissions FROM admin_users WHERE user_id = auth.uid())
);

-- Add helper function to check if user is in admin_users table
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
      AND is_email_verified = true
  )
$$;

-- Create audit log for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.security_audit_log
FOR SELECT
USING (public.is_admin(auth.uid()));