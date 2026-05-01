-- =========================================================================
-- 1. MASTER WEBHOOK FIX (Replace YOUR_ACTUAL_SERVICE_ROLE_KEY)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.send_push_webhook(payload JSONB)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://api.weversity.org/functions/v1/expo-push',
        body := payload,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q' 
        )
    );
END;
$$;

-- =========================================================================
-- 2. RESTORE UNIVERSAL GLOBAL NOTIFIER (For Courses, Shorts, Quizzes)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.tr_universal_notifier() 
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    PERFORM public.send_push_webhook(jsonb_build_object(
        'table', TG_TABLE_NAME, 
        'record', to_jsonb(NEW)
    ));
    RETURN NEW;
END;
$$;

-- Apply Universal Triggers
DROP TRIGGER IF EXISTS on_course_insert ON public.courses;
CREATE TRIGGER on_course_insert AFTER INSERT ON public.courses FOR EACH ROW EXECUTE FUNCTION public.tr_universal_notifier();

DROP TRIGGER IF EXISTS on_short_insert ON public.shorts;
CREATE TRIGGER on_short_insert AFTER INSERT ON public.shorts FOR EACH ROW EXECUTE FUNCTION public.tr_universal_notifier();

DROP TRIGGER IF EXISTS on_quiz_insert ON public.quiz_attempts;
CREATE TRIGGER on_quiz_insert AFTER INSERT ON public.quiz_attempts FOR EACH ROW EXECUTE FUNCTION public.tr_universal_notifier();


-- =========================================================================
-- 3. RESTORE CHAT & IN-APP ALERTS
-- =========================================================================
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


-- =========================================================================
-- 4. RESTORE LIVE SESSIONS (Class Scheduled / Live Now)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_live_session_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    PERFORM public.send_push_webhook(jsonb_build_object(
        'table', 'live_sessions',
        'record', to_jsonb(NEW)
    ));
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_live_session_insert ON public.live_sessions;
CREATE TRIGGER on_live_session_insert AFTER INSERT ON public.live_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_live_session_notification();

DROP TRIGGER IF EXISTS on_live_session_update ON public.live_sessions;
CREATE TRIGGER on_live_session_update AFTER UPDATE OF status ON public.live_sessions FOR EACH ROW 
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'live')
EXECUTE FUNCTION public.handle_live_session_notification();

-- Note: Social Triggers (Likes/Comments) and Enrollment Triggers are already fine.
-- This new webhook will fix all of them!
