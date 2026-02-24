
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can reserve slots" ON public.time_slots;

-- Create a tighter policy: users can only update status to 'reserved' for available slots
CREATE POLICY "Authenticated users can reserve available slots"
ON public.time_slots
FOR UPDATE
TO authenticated
USING (status = 'available' OR (status = 'reserved' AND reserved_by = auth.uid()))
WITH CHECK (status IN ('available', 'reserved'));
