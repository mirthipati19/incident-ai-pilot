
-- Create incidents table connected to users
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')) DEFAULT 'Open',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  category TEXT NOT NULL DEFAULT 'other',
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assignee TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_incidents_user_id ON public.incidents(user_id);
CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incidents_priority ON public.incidents(priority);

-- Enable Row Level Security
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own incidents
CREATE POLICY "Users can view their own incidents" 
  ON public.incidents 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Create policy for users to create incidents
CREATE POLICY "Users can create incidents" 
  ON public.incidents 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Create policy for users to update their own incidents
CREATE POLICY "Users can update their own incidents" 
  ON public.incidents 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Create policy for users to delete their own incidents
CREATE POLICY "Users can delete their own incidents" 
  ON public.incidents 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
