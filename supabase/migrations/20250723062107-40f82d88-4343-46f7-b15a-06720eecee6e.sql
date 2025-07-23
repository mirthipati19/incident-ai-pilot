-- Create remote session chat system

-- Table for chat messages during remote sessions
CREATE TABLE public.remote_session_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.remote_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('support_engineer', 'target_user', 'system')),
  message_content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'screenshot', 'system_notification', 'quick_response')),
  file_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for session timing and coordination
CREATE TABLE public.remote_session_timing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.remote_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('session_started', 'first_response', 'user_response', 'engineer_response', 'escalation_triggered', 'session_paused', 'session_resumed', 'session_ended')),
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_time_seconds INTEGER,
  total_session_duration_seconds INTEGER,
  triggered_by UUID,
  notes TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Table for quick response templates
CREATE TABLE public.quick_response_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('greeting', 'troubleshooting', 'escalation', 'resolution', 'general')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for session escalation rules
CREATE TABLE public.session_escalation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  trigger_condition TEXT NOT NULL CHECK (trigger_condition IN ('response_time_exceeded', 'session_duration_exceeded', 'manual_escalation', 'user_inactivity', 'engineer_request')),
  threshold_minutes INTEGER,
  escalation_action TEXT NOT NULL CHECK (escalation_action IN ('notify_supervisor', 'auto_escalate', 'end_session', 'send_reminder')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_remote_session_messages_session_id ON public.remote_session_messages(session_id);
CREATE INDEX idx_remote_session_messages_created_at ON public.remote_session_messages(created_at);
CREATE INDEX idx_remote_session_timing_session_id ON public.remote_session_timing(session_id);
CREATE INDEX idx_remote_session_timing_event_type ON public.remote_session_timing(event_type);

-- Enable RLS
ALTER TABLE public.remote_session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_session_timing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_escalation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for remote_session_messages
CREATE POLICY "Session participants can view messages" 
ON public.remote_session_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM remote_sessions rs 
  WHERE rs.id = remote_session_messages.session_id 
  AND (rs.target_user_id = auth.uid() OR 
       rs.support_engineer_id IN (
         SELECT se.id FROM support_engineers se WHERE se.user_id = auth.uid()
       ))
));

CREATE POLICY "Session participants can send messages" 
ON public.remote_session_messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM remote_sessions rs 
  WHERE rs.id = remote_session_messages.session_id 
  AND (rs.target_user_id = auth.uid() OR 
       rs.support_engineer_id IN (
         SELECT se.id FROM support_engineers se WHERE se.user_id = auth.uid()
       ))
) AND sender_id = auth.uid());

CREATE POLICY "Admins can view all session messages" 
ON public.remote_session_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.user_id = auth.uid()
));

-- RLS Policies for remote_session_timing
CREATE POLICY "Session participants can view timing" 
ON public.remote_session_timing 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM remote_sessions rs 
  WHERE rs.id = remote_session_timing.session_id 
  AND (rs.target_user_id = auth.uid() OR 
       rs.support_engineer_id IN (
         SELECT se.id FROM support_engineers se WHERE se.user_id = auth.uid()
       ))
));

CREATE POLICY "Support engineers can add timing events" 
ON public.remote_session_timing 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM remote_sessions rs 
  WHERE rs.id = remote_session_timing.session_id 
  AND rs.support_engineer_id IN (
    SELECT se.id FROM support_engineers se WHERE se.user_id = auth.uid()
  )
));

-- RLS Policies for quick_response_templates
CREATE POLICY "Support engineers can view templates" 
ON public.quick_response_templates 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM support_engineers 
  WHERE support_engineers.user_id = auth.uid()
));

CREATE POLICY "Support engineers can create templates" 
ON public.quick_response_templates 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM support_engineers 
  WHERE support_engineers.user_id = auth.uid()
) AND created_by = auth.uid());

-- RLS Policies for session_escalation_rules
CREATE POLICY "Admins can manage escalation rules" 
ON public.session_escalation_rules 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.user_id = auth.uid()
));

-- Insert default quick response templates
INSERT INTO public.quick_response_templates (title, content, category) VALUES
('Welcome Greeting', 'Hello! I''m here to help you with your technical issue. I can see your screen and will guide you through the resolution.', 'greeting'),
('Permission Request', 'I need to take control of your screen to help resolve this issue. Is that okay with you?', 'troubleshooting'),
('Status Update', 'I''m working on your issue now. Please give me a moment to investigate.', 'troubleshooting'),
('Escalation Notice', 'I''m going to escalate this to our senior support team for additional assistance.', 'escalation'),
('Issue Resolved', 'Great! It looks like we''ve resolved your issue. Is everything working correctly now?', 'resolution'),
('Session Ending', 'Thank you for your patience. I''m going to end our session now. Please let us know if you need any further assistance.', 'resolution');

-- Insert default escalation rules
INSERT INTO public.session_escalation_rules (rule_name, trigger_condition, threshold_minutes, escalation_action) VALUES
('Long Response Time', 'response_time_exceeded', 5, 'notify_supervisor'),
('Extended Session', 'session_duration_exceeded', 30, 'notify_supervisor'),
('User Inactivity', 'user_inactivity', 10, 'send_reminder');

-- Create triggers for updating timestamps
CREATE TRIGGER update_remote_session_messages_updated_at
BEFORE UPDATE ON public.remote_session_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quick_response_templates_updated_at
BEFORE UPDATE ON public.quick_response_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();