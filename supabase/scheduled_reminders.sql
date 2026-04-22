-- Enable pg_cron expansion (requires superuser access, usually available in Supabase/Docker)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a procedure or function to check for upcoming classes
CREATE OR REPLACE FUNCTION public.check_upcoming_classes_and_notify()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Find live sessions starting in exactly 15-16 minutes
  -- This ensures we catch them in a 1-minute window
  INSERT INTO public.notifications (recipient_id, content, type, target_id)
  SELECT 
    e.student_id,
    'Your class "' || c.title || '" starts in 15 minutes! Get ready.',
    'live_class',
    c.id
  FROM public.live_sessions ls
  JOIN public.courses c ON ls.course_id = c.id
  JOIN public.enrollments e ON e.course_id = c.id
  WHERE 
    ls.start_time >= (now() + interval '14 minutes')
    AND ls.start_time < (now() + interval '16 minutes')
    -- Avoid duplicate notifications for the same session within this window
    AND NOT EXISTS (
       antiquity SELECT 1 FROM public.notifications n 
      WHERE n.recipient_id = e.student_id 
      AND n.target_id = c.id 
      AND n.type = 'live_class'
      AND n.created_at > (now() - interval '20 minutes')
    );
END;
$$;

-- Schedule the job to run every minute
-- (Adjust the schedule string if your pg_cron version expects different syntax)
SELECT cron.schedule('class-reminder-job', '* * * * *', 'SELECT public.check_upcoming_classes_and_notify()');
