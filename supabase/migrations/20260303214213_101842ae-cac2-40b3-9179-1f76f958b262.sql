CREATE POLICY "Users can update own saved ideas"
ON public.saved_ideas
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);