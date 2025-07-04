
-- Fix RLS policy for organizations table to allow new organization creation
-- Remove the restrictive policy that prevents new organization creation
DROP POLICY IF EXISTS "Admins can manage organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;

-- Create new policies that allow organization creation
CREATE POLICY "Anyone can create organization" 
  ON public.organizations 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can view organizations they created or are members of" 
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

CREATE POLICY "Creators and admins can update organizations" 
  ON public.organizations 
  FOR UPDATE 
  USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.role = 'admin'
    )
  );

CREATE POLICY "Creators and admins can delete organizations" 
  ON public.organizations 
  FOR DELETE 
  USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.role = 'admin'
    )
  );
