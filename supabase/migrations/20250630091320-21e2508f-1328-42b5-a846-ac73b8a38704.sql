
-- Create user_sessions table for session management
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create mfa_tokens table for email-based MFA
CREATE TABLE public.mfa_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(user_id, is_active);
CREATE INDEX idx_mfa_tokens_email_token ON public.mfa_tokens(email, token);
CREATE INDEX idx_mfa_tokens_expires ON public.mfa_tokens(expires_at);

-- Enable RLS on both tables
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_sessions (users can only see their own sessions)
CREATE POLICY "Users can view their own sessions" 
  ON public.user_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" 
  ON public.user_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
  ON public.user_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS policies for mfa_tokens (no direct user access needed, service role only)
CREATE POLICY "Service role can manage MFA tokens" 
  ON public.mfa_tokens 
  FOR ALL 
  USING (false);
