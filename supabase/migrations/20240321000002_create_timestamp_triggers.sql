-- Create a function to automatically set updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for investor_profiles
CREATE TRIGGER set_updated_at_investor_profiles
  BEFORE UPDATE ON public.investor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create triggers for briefings
CREATE TRIGGER set_updated_at_briefings
  BEFORE UPDATE ON public.briefings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create triggers for qna_sessions
CREATE TRIGGER set_updated_at_qna_sessions
  BEFORE UPDATE ON public.qna_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at(); 