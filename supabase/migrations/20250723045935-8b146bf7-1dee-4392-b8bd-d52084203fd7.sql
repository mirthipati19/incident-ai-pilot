-- Drop all existing policies for organizations table
DROP POLICY IF EXISTS "Allow organization creation" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Creators and admins can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "Creators and admins can delete organizations" ON public.organizations;

-- Create simple, working policies
CREATE POLICY "Anyone can create organization" 
  ON public.organizations 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can view organizations" 
  ON public.organizations 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can update organizations" 
  ON public.organizations 
  FOR UPDATE 
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete organizations" 
  ON public.organizations 
  FOR DELETE 
  USING (created_by = auth.uid());