-- Drop the previous policy that only allowed authenticated users
DROP POLICY IF EXISTS "Users can insert MFA tokens for their email" ON public.mfa_tokens;

-- Allow anyone (including anon) to insert MFA tokens
-- This is safe because:
-- 1. MFA tokens are random and unpredictable
-- 2. They expire in 10 minutes
-- 3. Nobody can read them (no SELECT policy)
-- 4. The verification function handles validation securely
CREATE POLICY "Allow MFA token insertion"
  ON public.mfa_tokens
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to delete their own expired tokens
CREATE POLICY "Allow deletion of expired MFA tokens"
  ON public.mfa_tokens
  FOR DELETE
  TO anon, authenticated
  USING (expires_at < now());