
-- Create admin_sessions table for session management
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(user_id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create admin_mfa_tokens table for MFA functionality
CREATE TABLE IF NOT EXISTS public.admin_mfa_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(user_id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'login', -- 'login', 'email_verification'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add organization_id to admin_users table if not exists
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Add is_email_verified to admin_users table
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false;

-- Add email_verification_token to admin_users table
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS email_verification_token TEXT;

-- Create RLS policies for admin_sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage their own sessions" ON public.admin_sessions
  FOR ALL USING (admin_user_id = auth.uid());

-- Create RLS policies for admin_mfa_tokens
ALTER TABLE public.admin_mfa_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage their own MFA tokens" ON public.admin_mfa_tokens
  FOR ALL USING (admin_user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_user ON public.admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_mfa_tokens_admin_user ON public.admin_mfa_tokens(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_mfa_tokens_token ON public.admin_mfa_tokens(token);

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_admin_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up expired sessions
  DELETE FROM public.admin_sessions 
  WHERE expires_at < now() OR is_active = false;
  
  -- Clean up expired MFA tokens
  DELETE FROM public.admin_mfa_tokens 
  WHERE expires_at < now() OR is_used = true;
END;
$$;
