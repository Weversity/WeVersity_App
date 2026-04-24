-- =========================================================================
-- WEVERSITY - FINAL NOTIFICATION SYSTEM (CONSOLIDATED V3)
-- Includes: Webhook Helper, Social Interactions, and Live/Scheduled Class Alerts
-- =========================================================================

-- 1. Webhook Helper Function (Central Bridge to Vercel)
CREATE OR REPLACE FUNCTION public.send_push_webhook(payload JSONB)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
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


-- 2. Social Interactions (TikTok Style: Likes, Comments, Replies)
-- Table naming checks (defensive)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reactions') THEN
        RAISE NOTICE 'Table public.reactions found.';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
        RAISE NOTICE 'Table public.comments found.';
    END IF;
END $$;

-- Reaction Trigger Function
CREATE OR REPLACE FUNCTION public.handle_video_like_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_owner_id UUID;
BEGIN
    SELECT instructor_id INTO v_owner_id FROM public.shorts WHERE id = NEW.video_id;
    IF v_owner_id IS NOT NULL AND v_owner_id != NEW.user_id THEN
        PERFORM public.send_push_webhook(jsonb_build_object(
            'table', 'reactions', 'type', 'video_like',
            'record', to_jsonb(NEW) || jsonb_build_object('recipient_id', v_owner_id)
        ));
    END IF;
    RETURN NEW;
END;
$$;

-- Comment & Reply Trigger Function
CREATE OR REPLACE FUNCTION public.handle_video_comment_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_recipient_id UUID;
BEGIN
    IF NEW.parent_id IS NULL THEN
        SELECT instructor_id INTO v_recipient_id FROM public.shorts WHERE id = NEW.video_id;
        IF v_recipient_id IS NOT NULL AND v_recipient_id != NEW.user_id THEN
            PERFORM public.send_push_webhook(jsonb_build_object(
                'table', 'comments', 'type', 'video_comment',
                'record', to_jsonb(NEW) || jsonb_build_object('recipient_id', v_recipient_id)
            ));
        END IF;
    ELSE
        SELECT user_id INTO v_recipient_id FROM public.comments WHERE id = NEW.parent_id;
        IF v_recipient_id IS NOT NULL AND v_recipient_id != NEW.user_id THEN
            PERFORM public.send_push_webhook(jsonb_build_object(
                'table', 'comments', 'type', 'comment_reply',
                'record', to_jsonb(NEW) || jsonb_build_object('recipient_id', v_recipient_id)
            ));
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Apply Social Triggers
DROP TRIGGER IF EXISTS on_video_like_insert ON public.reactions;
CREATE TRIGGER on_video_like_insert AFTER INSERT ON public.reactions FOR EACH ROW EXECUTE FUNCTION public.handle_video_like_notification();

DROP TRIGGER IF EXISTS on_video_comment_insert ON public.comments;
CREATE TRIGGER on_video_comment_insert AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_video_comment_notification();


-- 3. Live Classes & Meetings (Broadcast to All)
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

-- Apply Live Class Triggers
DROP TRIGGER IF EXISTS on_live_session_insert ON public.live_sessions;
CREATE TRIGGER on_live_session_insert AFTER INSERT ON public.live_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_live_session_notification();

DROP TRIGGER IF EXISTS on_live_session_update ON public.live_sessions;
CREATE TRIGGER on_live_session_update AFTER UPDATE OF status ON public.live_sessions FOR EACH ROW 
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'live') EXECUTE FUNCTION public.handle_live_session_notification();

DO $$ 
BEGIN 
    RAISE NOTICE 'Notification System Update Complete.'; 
END $$;
