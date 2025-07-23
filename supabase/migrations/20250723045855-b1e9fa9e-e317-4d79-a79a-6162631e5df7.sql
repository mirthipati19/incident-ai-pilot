-- Fix the RLS policy to allow organization creation properly
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

-- Create a more permissive policy for organization creation
CREATE POLICY "Allow organization creation" 
  ON public.organizations 
  FOR INSERT 
  WITH CHECK (true);

-- Keep the existing view policy
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;

CREATE POLICY "Users can view their organizations" 
  ON public.organizations 
  FOR SELECT 
  USING (
    created_by = auth.uid() OR 
    id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );