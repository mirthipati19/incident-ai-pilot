
-- Add missing columns to incidents table for tracking response and resolution times
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS resolution_time_minutes INTEGER;

-- Create user feedback table for satisfaction ratings
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5) NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user_feedback
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for user_feedback
CREATE POLICY "Users can create feedback for their incidents" 
  ON public.user_feedback 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.incidents 
      WHERE id = incident_id AND user_id = user_feedback.user_id
    )
  );

CREATE POLICY "Users can view their own feedback" 
  ON public.user_feedback 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents 
      WHERE id = incident_id AND user_id = user_feedback.user_id
    )
  );

CREATE POLICY "Admins can view all feedback" 
  ON public.user_feedback 
  FOR SELECT 
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Update ai_resolution_stats table structure to match incidents
ALTER TABLE public.ai_resolution_stats 
ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- Create system_metrics table for tracking uptime and system performance
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  metric_unit TEXT NOT NULL DEFAULT 'count',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for system_metrics
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for system_metrics
CREATE POLICY "Admins can view system metrics" 
  ON public.system_metrics 
  FOR SELECT 
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

CREATE POLICY "System can insert metrics" 
  ON public.system_metrics 
  FOR INSERT 
  WITH CHECK (true);

-- Insert initial system uptime metric
INSERT INTO public.system_metrics (metric_name, metric_value, metric_unit, metadata)
VALUES ('system_uptime', 99.8, 'percentage', '{"last_updated": "2024-01-01T00:00:00Z"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Create function to automatically calculate response and resolution times
CREATE OR REPLACE FUNCTION calculate_incident_times()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate response time when first_response_at is set
  IF NEW.first_response_at IS NOT NULL AND OLD.first_response_at IS NULL THEN
    NEW.response_time_minutes = EXTRACT(EPOCH FROM (NEW.first_response_at - NEW.created_at)) / 60;
  END IF;
  
  -- Calculate resolution time when status changes to 'Resolved' or 'Closed'
  IF NEW.status IN ('Resolved', 'Closed') AND OLD.status NOT IN ('Resolved', 'Closed') THEN
    NEW.resolved_at = COALESCE(NEW.resolved_at, now());
    NEW.resolution_time_minutes = EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.created_at)) / 60;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic time calculations
DROP TRIGGER IF EXISTS trigger_calculate_incident_times ON public.incidents;
CREATE TRIGGER trigger_calculate_incident_times
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION calculate_incident_times();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_incidents_resolved_at ON public.incidents(resolved_at);
CREATE INDEX IF NOT EXISTS idx_user_feedback_incident_id ON public.user_feedback(incident_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_satisfaction ON public.user_feedback(satisfaction_rating);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_recorded ON public.system_metrics(metric_name, recorded_at);
