-- Enable RLS on all tables
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qna_sessions ENABLE ROW LEVEL SECURITY;

-- Investor Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.investor_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.investor_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Uploads policies
CREATE POLICY "Users can view own uploads"
  ON public.uploads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads"
  ON public.uploads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads"
  ON public.uploads
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own uploads"
  ON public.uploads
  FOR DELETE
  USING (auth.uid() = user_id);

-- Briefings policies
CREATE POLICY "Users can view own briefings"
  ON public.briefings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own briefings"
  ON public.briefings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own briefings"
  ON public.briefings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own briefings"
  ON public.briefings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Summaries policies
CREATE POLICY "Users can view summaries of own briefings"
  ON public.summaries
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.briefings
    WHERE briefings.id = summaries.briefing_id
    AND briefings.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert summaries for own briefings"
  ON public.summaries
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.briefings
    WHERE briefings.id = briefing_id
    AND briefings.user_id = auth.uid()
  ));

-- QnA Sessions policies
CREATE POLICY "Users can view QnA sessions of own briefings"
  ON public.qna_sessions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.briefings
    WHERE briefings.id = qna_sessions.briefing_id
    AND briefings.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert QnA sessions for own briefings"
  ON public.qna_sessions
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.briefings
    WHERE briefings.id = briefing_id
    AND briefings.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own QnA sessions"
  ON public.qna_sessions
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.briefings
    WHERE briefings.id = qna_sessions.briefing_id
    AND briefings.user_id = auth.uid()
  )); 