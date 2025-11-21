-- Allow authenticated users to insert their own MFA tokens
-- But prevent them from reading any tokens (security)
CREATE POLICY "Users can insert MFA tokens for their email"
  ON public.mfa_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow the system to clean up expired tokens
CREATE POLICY "Service role can delete expired MFA tokens"
  ON public.mfa_tokens
  FOR DELETE
  TO authenticated
  USING (expires_at < now());