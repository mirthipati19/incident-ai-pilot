
-- Fix RLS policy for organizations to allow authenticated users to create organizations
DROP POLICY IF EXISTS "Anyone can create organization" ON public.organizations;

-- Create a more specific policy that allows authenticated users to create organizations
CREATE POLICY "Authenticated users can create organizations" 
  ON public.organizations 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Also ensure the policy for viewing organizations works correctly
DROP POLICY IF EXISTS "Users can view organizations they created or are members of" ON public.organizations;

CREATE POLICY "Users can view their organizations" 
  ON public.organizations 
  FOR SELECT 
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );
