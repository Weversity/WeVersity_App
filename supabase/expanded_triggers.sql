-- ==========================================
-- MEGA EXPANDED NOTIFICATION TRIGGERS
-- ==========================================

-- 1. UTILITY FUNCTION: Send Webhook
CREATE OR REPLACE FUNCTION public.send_push_webhook(payload JSONB)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://we-versity-app-chi.vercel.app/api/push',
        body := payload,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            -- Same Service Role Key for consistency
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
        )
    );
END; $$;

-- 2. COURSES TRIGGER (Broadcast)
CREATE OR REPLACE FUNCTION public.tr_course_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM public.send_push_webhook(jsonb_build_object('table', 'courses', 'record', row_to_json(NEW)));
    RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_course_insert ON public.courses;
CREATE TRIGGER on_course_insert AFTER INSERT ON public.courses FOR EACH ROW EXECUTE FUNCTION public.tr_course_insert();

-- 3. SHORTS TRIGGER (Broadcast)
CREATE OR REPLACE FUNCTION public.tr_short_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM public.send_push_webhook(jsonb_build_object('table', 'shorts', 'record', row_to_json(NEW)));
    RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_short_insert ON public.shorts;
CREATE TRIGGER on_short_insert AFTER INSERT ON public.shorts FOR EACH ROW EXECUTE FUNCTION public.tr_short_insert();

-- 4. ENROLLMENTS TRIGGER (Personalized)
CREATE OR REPLACE FUNCTION public.tr_enrollment_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM public.send_push_webhook(jsonb_build_object('table', 'enrollments', 'record', row_to_json(NEW)));
    RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_enrollment_insert ON public.enrollments;
CREATE TRIGGER on_enrollment_insert AFTER INSERT ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.tr_enrollment_insert();

-- 5. QUIZ ATTEMPTS TRIGGER (Personalized)
CREATE OR REPLACE FUNCTION public.tr_quiz_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM public.send_push_webhook(jsonb_build_object('table', 'quiz_attempts', 'record', row_to_json(NEW)));
    RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_quiz_attempt_insert ON public.quiz_attempts;
CREATE TRIGGER on_quiz_attempt_insert AFTER INSERT ON public.quiz_attempts FOR EACH ROW EXECUTE FUNCTION public.tr_quiz_insert();

-- 6. CHAT & GENERAL NOTIFICATIONS (Original Function Updated)
CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM public.send_push_webhook(jsonb_build_object(
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW) || jsonb_build_object('sender_id', auth.uid())
  ));
  RETURN NEW;
END; $$;

-- 7. DAILY REWARD REMINDER (CRON JOB)
CREATE OR REPLACE FUNCTION public.automated_daily_reward_push()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    -- This inserts a proxy notification that triggers the push logic
    INSERT INTO public.notifications (recipient_id, content, type)
    SELECT id, 'Claim your coins!', 'daily_reward'
    FROM public.profiles
    WHERE push_token IS NOT NULL;
END; $$;

-- Enable pg_cron and schedule for daily reward (12 PM)
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('daily-reward-job', '0 12 * * *', 'SELECT public.automated_daily_reward_push()');
