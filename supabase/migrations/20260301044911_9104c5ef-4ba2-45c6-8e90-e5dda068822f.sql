
CREATE TABLE public.voice_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  tone_descriptor TEXT NOT NULL DEFAULT 'warm-empathetic',
  vocabulary_level TEXT NOT NULL DEFAULT 'everyday',
  catchphrases TEXT DEFAULT '',
  audience_address TEXT NOT NULL DEFAULT 'families',
  pacing_style TEXT NOT NULL DEFAULT 'mixed',
  humor_comfort TEXT NOT NULL DEFAULT 'no-humor',
  sample_script TEXT DEFAULT '',
  cta_style TEXT NOT NULL DEFAULT 'soft-ask',
  funeral_home_name TEXT DEFAULT '',
  years_experience TEXT DEFAULT '',
  specialties TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own voice profile"
  ON public.voice_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice profile"
  ON public.voice_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice profile"
  ON public.voice_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice profile"
  ON public.voice_profiles FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can read voice profiles"
  ON public.voice_profiles FOR SELECT
  USING (true);
