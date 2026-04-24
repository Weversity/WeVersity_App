-- 1. Webhook Helper Function (Fixed with JSONB & Correct Headers)
CREATE OR REPLACE FUNCTION public.send_push_webhook(payload JSONB)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://we-versity-app-chi.vercel.app/api/push',
        body := payload,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
        )
    );
END;
$$;

-- 2. Universal Notifier (Fixed: Using to_jsonb for merging)
CREATE OR REPLACE FUNCTION public.tr_universal_notifier() 
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM public.send_push_webhook(jsonb_build_object('table', TG_TABLE_NAME, 'record', to_jsonb(NEW)));
    RETURN NEW;
END;
$$;

-- Triggers for Courses, Shorts, Enrollments, Quizzes
DROP TRIGGER IF EXISTS on_course_insert ON public.courses;
CREATE TRIGGER on_course_insert AFTER INSERT ON public.courses FOR EACH ROW EXECUTE FUNCTION public.tr_universal_notifier();

DROP TRIGGER IF EXISTS on_short_insert ON public.shorts;
CREATE TRIGGER on_short_insert AFTER INSERT ON public.shorts FOR EACH ROW EXECUTE FUNCTION public.tr_universal_notifier();

DROP TRIGGER IF EXISTS on_enroll_insert ON public.enrollments;
CREATE TRIGGER on_enroll_insert AFTER INSERT ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.tr_universal_notifier();

DROP TRIGGER IF EXISTS on_quiz_insert ON public.quiz_attempts;
CREATE TRIGGER on_quiz_insert AFTER INSERT ON public.quiz_attempts FOR EACH ROW EXECUTE FUNCTION public.tr_universal_notifier();

-- 3. Notifications/Chat Trigger (Fixed: SECURITY DEFINER added for auth.uid)
CREATE OR REPLACE FUNCTION public.handle_new_notification() 
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM public.send_push_webhook(jsonb_build_object(
    'table', TG_TABLE_NAME, 
    'record', to_jsonb(NEW) || jsonb_build_object('sender_id', auth.uid())
  ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_notification_insert ON public.notifications;
CREATE TRIGGER on_notification_insert AFTER INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.handle_new_notification();

DROP TRIGGER IF EXISTS on_chat_message_insert ON public.chat_messages;
CREATE TRIGGER on_chat_message_insert AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.handle_new_notification();

-- 4. Daily Reward & Cron Setup
CREATE OR REPLACE FUNCTION public.automated_daily_reward_push() 
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO public.notifications (recipient_id, content, type)
    SELECT id, 'Claim your coins!', 'daily_reward' FROM public.profiles WHERE push_token IS NOT NULL;
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.unschedule('daily-reward-job') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-reward-job'); 
SELECT cron.schedule('daily-reward-job', '0 12 * * *', 'SELECT public.automated_daily_reward_push()');
