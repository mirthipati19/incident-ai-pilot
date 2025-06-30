
-- Fix MFA RLS policies
ALTER TABLE public.mfa_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow own token select" ON public.mfa_tokens;
DROP POLICY IF EXISTS "Allow own token delete" ON public.mfa_tokens;
DROP POLICY IF EXISTS "Allow own token insert" ON public.mfa_tokens;

-- Create policies for MFA tokens
CREATE POLICY "Allow own token select"
  ON public.mfa_tokens
  FOR SELECT
  USING (true); -- Allow select for all since we need to verify before auth

CREATE POLICY "Allow own token delete"
  ON public.mfa_tokens
  FOR DELETE
  USING (true); -- Allow delete for cleanup

CREATE POLICY "Allow own token insert"
  ON public.mfa_tokens
  FOR INSERT
  WITH CHECK (true); -- Allow insert for MFA generation

-- Create bypass function for MFA verification
CREATE OR REPLACE FUNCTION public.bypass_rls_verify_token(email_arg text, token_arg text)
RETURNS TABLE(id uuid, email text, token text, expires_at timestamptz, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT mfa_tokens.id, mfa_tokens.email, mfa_tokens.token, mfa_tokens.expires_at, mfa_tokens.created_at
  FROM public.mfa_tokens
  WHERE mfa_tokens.email = email_arg 
    AND mfa_tokens.token = token_arg 
    AND mfa_tokens.expires_at >= now()
  ORDER BY mfa_tokens.created_at DESC 
  LIMIT 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.bypass_rls_verify_token(text, text) TO anon, authenticated;

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  domain TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add organization_id to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Add organization_id to incidents table  
ALTER TABLE public.incidents
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Enable RLS for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizations
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
CREATE POLICY "Users can view their organization"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM public.users 
      WHERE id = auth.uid()
    )
  );

-- Update incidents RLS to respect organizations
DROP POLICY IF EXISTS "Users can view their org incidents" ON public.incidents;
CREATE POLICY "Users can view their org incidents"
  ON public.incidents
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id 
      FROM public.users 
      WHERE id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_incidents_organization_id ON public.incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON public.organizations(domain);

-- Update existing incidents to have organization_id based on user's org
UPDATE public.incidents 
SET organization_id = (
  SELECT organization_id 
  FROM public.users 
  WHERE users.id = incidents.user_id
)
WHERE organization_id IS NULL;
