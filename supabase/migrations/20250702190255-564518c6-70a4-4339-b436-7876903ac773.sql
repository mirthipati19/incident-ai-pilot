
-- Create organizations table (enhanced)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create admin_users table (completely new structure)
CREATE TABLE IF NOT EXISTS public.admin_users_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions TEXT[] DEFAULT ARRAY['view_tickets', 'manage_users', 'view_stats', 'full_admin'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.admin_users_new(id)
);

-- Create admin_sessions table for session management
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID REFERENCES public.admin_users_new(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create user_invitations table for admin-created users
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES public.admin_users_new(id) ON DELETE CASCADE,
  invitation_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create password_policies table
CREATE TABLE IF NOT EXISTS public.password_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  min_length INTEGER NOT NULL DEFAULT 12,
  require_uppercase INTEGER NOT NULL DEFAULT 1,
  require_lowercase INTEGER NOT NULL DEFAULT 1,
  require_numbers INTEGER NOT NULL DEFAULT 4,
  require_special INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Organizations can be viewed by their admins"
  ON public.organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM public.admin_users_new 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage organizations"
  ON public.organizations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users_new 
      WHERE id = auth.uid() AND 'super_admin' = ANY(permissions)
    )
  );

-- RLS Policies for admin_users_new
CREATE POLICY "Admins can view users in their organization"
  ON public.admin_users_new FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.admin_users_new 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can create users in their organization"
  ON public.admin_users_new FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.admin_users_new 
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for admin_sessions
CREATE POLICY "Admins can manage their own sessions"
  ON public.admin_sessions FOR ALL
  USING (admin_user_id = auth.uid());

-- RLS Policies for user_invitations
CREATE POLICY "Admins can manage invitations in their organization"
  ON public.user_invitations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.admin_users_new 
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for password_policies
CREATE POLICY "Admins can view their organization's password policy"
  ON public.password_policies FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.admin_users_new 
      WHERE id = auth.uid()
    )
  );

-- Functions for password validation
CREATE OR REPLACE FUNCTION public.validate_password_strength(
  password TEXT,
  policy_id UUID DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  policy RECORD;
  uppercase_count INTEGER;
  lowercase_count INTEGER;
  number_count INTEGER;
  special_count INTEGER;
BEGIN
  -- Get password policy (default if none specified)
  IF policy_id IS NULL THEN
    SELECT * INTO policy FROM public.password_policies LIMIT 1;
  ELSE
    SELECT * INTO policy FROM public.password_policies WHERE id = policy_id;
  END IF;
  
  -- Use default policy if none found
  IF policy IS NULL THEN
    policy.min_length := 12;
    policy.require_uppercase := 1;
    policy.require_lowercase := 1;
    policy.require_numbers := 4;
    policy.require_special := 1;
  END IF;
  
  -- Check minimum length
  IF LENGTH(password) < policy.min_length THEN
    RETURN FALSE;
  END IF;
  
  -- Count character types
  uppercase_count := LENGTH(password) - LENGTH(REGEXP_REPLACE(password, '[A-Z]', '', 'g'));
  lowercase_count := LENGTH(password) - LENGTH(REGEXP_REPLACE(password, '[a-z]', '', 'g'));
  number_count := LENGTH(password) - LENGTH(REGEXP_REPLACE(password, '[0-9]', '', 'g'));
  special_count := LENGTH(password) - LENGTH(REGEXP_REPLACE(password, '[^A-Za-z0-9]', '', 'g'));
  
  -- Validate requirements
  RETURN (
    uppercase_count >= policy.require_uppercase AND
    lowercase_count >= policy.require_lowercase AND
    number_count >= policy.require_numbers AND
    special_count >= policy.require_special
  );
END;
$$;

-- Function to generate secure passwords
CREATE OR REPLACE FUNCTION public.generate_secure_password()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  password TEXT := '';
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
BEGIN
  FOR i IN 1..16 LOOP
    password := password || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN password;
END;
$$;

-- Insert default organization for system
INSERT INTO public.organizations (name, domain, is_active) 
VALUES ('Authexa System', 'authexa.me', true)
ON CONFLICT (domain) DO NOTHING;

-- Insert default password policy
INSERT INTO public.password_policies (organization_id, min_length, require_uppercase, require_lowercase, require_numbers, require_special)
SELECT id, 12, 1, 1, 4, 1 FROM public.organizations WHERE domain = 'authexa.me'
ON CONFLICT DO NOTHING;
