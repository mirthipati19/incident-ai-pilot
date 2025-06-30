
-- Create organizations table with proper structure
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  domain TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add organization_id to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'organization_id') THEN
    ALTER TABLE public.users ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add organization_id to incidents table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'incidents' AND column_name = 'organization_id') THEN
    ALTER TABLE public.incidents ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Fix MFA RLS policies with proper bypass function
DROP POLICY IF EXISTS "Allow MFA access" ON public.mfa_tokens;
DROP POLICY IF EXISTS "Allow own token select" ON public.mfa_tokens;
DROP POLICY IF EXISTS "Allow own token delete" ON public.mfa_tokens;
DROP POLICY IF EXISTS "Allow own token insert" ON public.mfa_tokens;

-- Create comprehensive MFA policies
CREATE POLICY "Allow MFA token operations"
  ON public.mfa_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create or update bypass function for MFA verification
CREATE OR REPLACE FUNCTION public.verify_mfa_token_bypass(email_arg text, token_arg text)
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

-- Grant execute permissions for bypass function
GRANT EXECUTE ON FUNCTION public.verify_mfa_token_bypass(text, text) TO anon, authenticated;

-- Enable RLS for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizations
CREATE POLICY "Users can view their organization"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM public.users 
      WHERE id = auth.uid()
    ) OR
    created_by = auth.uid()
  );

CREATE POLICY "Admins can manage organizations"
  ON public.organizations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Update incidents RLS to respect organizations
DROP POLICY IF EXISTS "Users can view their own incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users can view their org incidents" ON public.incidents;

CREATE POLICY "Users can view organization incidents"
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
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);

-- Update existing incidents to have organization_id based on user's org
UPDATE public.incidents 
SET organization_id = (
  SELECT organization_id 
  FROM public.users 
  WHERE users.id = incidents.user_id
)
WHERE organization_id IS NULL;
