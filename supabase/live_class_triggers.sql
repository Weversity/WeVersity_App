-- ==========================================
-- LIVE CLASS & MEETING NOTIFICATIONS
-- ==========================================

-- Trigger Function for Live Sessions / Meetings
-- Handles both "Live Now" and "Scheduled" broadcasts
CREATE OR REPLACE FUNCTION public.handle_live_session_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- We send the NEW record to Vercel.
    -- Vercel will handle:
    -- 1. Fetching Instructor Name
    -- 2. Formatting the message (Live Now vs Scheduled)
    -- 3. Broadcasting to ALL users
    
    PERFORM public.send_push_webhook(jsonb_build_object(
        'table', 'live_sessions',
        'record', to_jsonb(NEW)
    ));
    
    RETURN NEW;
END;
$$;

-- Apply trigger to 'live_sessions' table
DROP TRIGGER IF EXISTS on_live_session_insert ON public.live_sessions;

CREATE TRIGGER on_live_session_insert
AFTER INSERT ON public.live_sessions
FOR EACH ROW EXECUTE FUNCTION public.handle_live_session_notification();

-- Also handle UPDATES (e.g., when a scheduled class actually goes LIVE)
DROP TRIGGER IF EXISTS on_live_session_update ON public.live_sessions;

CREATE TRIGGER on_live_session_update
AFTER UPDATE OF status ON public.live_sessions
FOR EACH ROW 
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'live')
EXECUTE FUNCTION public.handle_live_session_notification();
