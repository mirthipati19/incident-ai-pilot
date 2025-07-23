-- Create support engineer roles and remote session management

-- Create enum for support engineer roles
CREATE TYPE public.support_role AS ENUM ('support_engineer', 'senior_support', 'admin_support');

-- Create enum for session status
CREATE TYPE public.session_status AS ENUM ('pending', 'approved', 'active', 'completed', 'denied', 'cancelled');

-- Create support_engineers table
CREATE TABLE public.support_engineers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role support_role NOT NULL DEFAULT 'support_engineer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  can_request_sessions BOOLEAN NOT NULL DEFAULT true,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create remote_sessions table
CREATE TABLE public.remote_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_code TEXT NOT NULL UNIQUE,
  support_engineer_id UUID REFERENCES public.support_engineers(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status session_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  purpose TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Session tracking
  duration_minutes INTEGER,
  connection_quality TEXT,
  resolution TEXT,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session_activities table for audit logging
CREATE TABLE public.session_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.remote_sessions(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'mouse_click', 'keyboard_input', 'screen_capture', 'file_access', etc.
  description TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX idx_support_engineers_user_id ON public.support_engineers(user_id);
CREATE INDEX idx_support_engineers_active ON public.support_engineers(is_active);
CREATE INDEX idx_remote_sessions_support_engineer ON public.remote_sessions(support_engineer_id);
CREATE INDEX idx_remote_sessions_target_user ON public.remote_sessions(target_user_id);
CREATE INDEX idx_remote_sessions_status ON public.remote_sessions(status);
CREATE INDEX idx_remote_sessions_created_at ON public.remote_sessions(created_at DESC);
CREATE INDEX idx_session_activities_session_id ON public.session_activities(session_id);
CREATE INDEX idx_session_activities_timestamp ON public.session_activities(timestamp DESC);

-- Enable RLS on all tables
ALTER TABLE public.support_engineers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_engineers
CREATE POLICY "Admins can manage all support engineers" 
  ON public.support_engineers 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  ));

CREATE POLICY "Support engineers can view their own record" 
  ON public.support_engineers 
  FOR SELECT 
  USING (user_id = auth.uid());

-- RLS policies for remote_sessions
CREATE POLICY "Support engineers can manage their sessions" 
  ON public.remote_sessions 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.support_engineers 
    WHERE support_engineers.id = remote_sessions.support_engineer_id 
    AND support_engineers.user_id = auth.uid()
  ));

CREATE POLICY "Target users can view and update their sessions" 
  ON public.remote_sessions 
  FOR SELECT 
  USING (target_user_id = auth.uid());

CREATE POLICY "Target users can update session status" 
  ON public.remote_sessions 
  FOR UPDATE 
  USING (target_user_id = auth.uid());

CREATE POLICY "Admins can view all sessions" 
  ON public.remote_sessions 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  ));

-- RLS policies for session_activities
CREATE POLICY "Session participants can view activities" 
  ON public.session_activities 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.remote_sessions rs
    WHERE rs.id = session_activities.session_id 
    AND (rs.support_engineer_id IN (
      SELECT se.id FROM public.support_engineers se 
      WHERE se.user_id = auth.uid()
    ) OR rs.target_user_id = auth.uid())
  ));

CREATE POLICY "System can insert activities" 
  ON public.session_activities 
  FOR INSERT 
  WITH CHECK (true);

-- Create function to generate unique session codes
CREATE OR REPLACE FUNCTION public.generate_session_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    new_code := UPPER(
      substr(md5(random()::text), 1, 4) || 
      substr(md5(random()::text), 1, 4)
    );
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM public.remote_sessions 
      WHERE session_code = new_code
    ) INTO code_exists;
    
    -- If code doesn't exist, we can use it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Create trigger to auto-generate session codes
CREATE OR REPLACE FUNCTION public.set_session_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.session_code IS NULL OR NEW.session_code = '' THEN
    NEW.session_code = generate_session_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_session_code
  BEFORE INSERT ON public.remote_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_session_code();

-- Create trigger to update timestamps
CREATE TRIGGER update_support_engineers_updated_at
  BEFORE UPDATE ON public.support_engineers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_remote_sessions_updated_at
  BEFORE UPDATE ON public.remote_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();