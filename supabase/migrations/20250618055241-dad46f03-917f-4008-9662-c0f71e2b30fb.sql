
-- Create admin users table (if not exists)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions TEXT[] DEFAULT ARRAY['view_tickets', 'manage_users', 'view_stats'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create admin policies (drop existing if any)
DROP POLICY IF EXISTS "Admins can view their own record" ON public.admin_users;
CREATE POLICY "Admins can view their own record" 
  ON public.admin_users 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create AI resolution statistics table
CREATE TABLE IF NOT EXISTS public.ai_resolution_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
  resolution_method TEXT NOT NULL,
  resolution_time_minutes INTEGER,
  user_satisfaction_score INTEGER CHECK (user_satisfaction_score >= 1 AND user_satisfaction_score <= 5),
  ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for ai_resolution_stats
ALTER TABLE public.ai_resolution_stats ENABLE ROW LEVEL SECURITY;

-- Create AI stats policy
DROP POLICY IF EXISTS "Admins can view resolution stats" ON public.ai_resolution_stats;
CREATE POLICY "Admins can view resolution stats" 
  ON public.ai_resolution_stats 
  FOR SELECT 
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Create CAPTCHA verification table
CREATE TABLE IF NOT EXISTS public.captcha_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  challenge TEXT NOT NULL,
  solution TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for captcha_verifications
ALTER TABLE public.captcha_verifications ENABLE ROW LEVEL SECURITY;

-- Create CAPTCHA policies
DROP POLICY IF EXISTS "Anyone can create captcha" ON public.captcha_verifications;
CREATE POLICY "Anyone can create captcha" 
  ON public.captcha_verifications 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can verify captcha" ON public.captcha_verifications;
CREATE POLICY "Anyone can verify captcha" 
  ON public.captcha_verifications 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Anyone can update captcha verification" ON public.captcha_verifications;
CREATE POLICY "Anyone can update captcha verification" 
  ON public.captcha_verifications 
  FOR UPDATE 
  USING (true);

-- Add admin policies for incidents (drop existing if any)
DROP POLICY IF EXISTS "Admins can view all incidents" ON public.incidents;
CREATE POLICY "Admins can view all incidents" 
  ON public.incidents 
  FOR SELECT 
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update all incidents" ON public.incidents;
CREATE POLICY "Admins can update all incidents" 
  ON public.incidents 
  FOR UPDATE 
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Create new indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_ai_resolution_stats_created_at ON public.ai_resolution_stats(created_at);
CREATE INDEX IF NOT EXISTS idx_captcha_expires_at ON public.captcha_verifications(expires_at);
