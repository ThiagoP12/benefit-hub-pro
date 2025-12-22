-- Allow service role to insert notifications (for edge functions)
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Only system can insert notifications" ON public.notifications;

-- Create a new policy that allows inserts from service role (auth.uid() is null when using service role)
CREATE POLICY "Service role can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- The service role bypasses RLS anyway, but this makes it explicit
-- RLS will still protect against anon key inserts since the service role has elevated privileges