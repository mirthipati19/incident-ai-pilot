-- Create VisionAssist database schema

-- Vision sessions table to track user sessions
CREATE TABLE public.vision_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  intent_description TEXT,
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 1,
  privacy_mode BOOLEAN DEFAULT true,
  auto_control_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Vision session steps - individual steps in a task
CREATE TABLE public.vision_session_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.vision_sessions(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  screenshot_url TEXT,
  ai_analysis JSONB DEFAULT '{}',
  ui_elements JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  user_action TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Chat messages for the vision assistant
CREATE TABLE public.vision_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.vision_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'instruction', 'screenshot', 'overlay')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Privacy settings for users
CREATE TABLE public.vision_privacy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  mask_sensitive_fields BOOLEAN DEFAULT true,
  auto_redact_passwords BOOLEAN DEFAULT true,
  store_screenshots BOOLEAN DEFAULT false,
  allow_ai_control BOOLEAN DEFAULT false,
  session_retention_days INTEGER DEFAULT 7,
  consent_given_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_vision_sessions_user_id ON public.vision_sessions(user_id);
CREATE INDEX idx_vision_sessions_status ON public.vision_sessions(status);
CREATE INDEX idx_vision_session_steps_session_id ON public.vision_session_steps(session_id);
CREATE INDEX idx_vision_chat_messages_session_id ON public.vision_chat_messages(session_id);

-- Enable RLS
ALTER TABLE public.vision_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_session_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vision_sessions
CREATE POLICY "Users can view their own vision sessions" 
ON public.vision_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vision sessions" 
ON public.vision_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vision sessions" 
ON public.vision_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vision sessions" 
ON public.vision_sessions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.user_id = auth.uid()
));

-- RLS Policies for vision_session_steps
CREATE POLICY "Users can manage steps in their sessions" 
ON public.vision_session_steps 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM vision_sessions 
  WHERE vision_sessions.id = vision_session_steps.session_id 
  AND vision_sessions.user_id = auth.uid()
));

-- RLS Policies for vision_chat_messages
CREATE POLICY "Users can manage messages in their sessions" 
ON public.vision_chat_messages 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM vision_sessions 
  WHERE vision_sessions.id = vision_chat_messages.session_id 
  AND vision_sessions.user_id = auth.uid()
));

-- RLS Policies for vision_privacy_settings
CREATE POLICY "Users can manage their own privacy settings" 
ON public.vision_privacy_settings 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_vision_sessions_updated_at
BEFORE UPDATE ON public.vision_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vision_privacy_settings_updated_at
BEFORE UPDATE ON public.vision_privacy_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();