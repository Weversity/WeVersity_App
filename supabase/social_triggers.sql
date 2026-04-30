-- ==========================================
-- TIKTOK-STYLE SOCIAL NOTIFICATION TRIGGERS (V4 - ROBUST)
-- ==========================================

-- 0. Webhook Helper Function (Updated to point to Supabase Edge Function)
CREATE OR REPLACE FUNCTION public.send_push_webhook(payload JSONB)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- This calls the 'expo-push' Supabase Edge Function
    PERFORM net.http_post(
        url := 'https://api.weversity.org/functions/v1/expo-push',
        body := payload,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q' -- Service role key for auth
        )
    );
END;
$$;

-- 1. Video Reaction Trigger Function
-- Handles Likes/Reactions with Threshold Logic (Multiples of 5)
CREATE OR REPLACE FUNCTION public.handle_video_like_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_video_owner_id UUID;
    v_like_count INT;
    v_actor_name TEXT;
BEGIN
    -- 1. Fetch the video owner (instructor_id)
    SELECT instructor_id INTO v_video_owner_id FROM public.shorts WHERE id = NEW.video_id;
    
    -- 2. Only proceed if owner exists and is NOT the person who liked
    IF v_video_owner_id IS NOT NULL AND v_video_owner_id != NEW.user_id THEN
        
        -- 3. Check Threshold: Count total likes for this video
        SELECT COUNT(*) INTO v_like_count FROM public.reactions WHERE video_id = NEW.video_id;
        
        -- 4. Only notify on multiples of 5 (5, 10, 15...)
        IF v_like_count % 5 = 0 THEN
            -- Fetch the name of the user who just liked it
            SELECT COALESCE(first_name || ' ' || last_name, 'Someone') INTO v_actor_name 
            FROM public.profiles WHERE id = NEW.user_id;

            PERFORM public.send_push_webhook(jsonb_build_object(
                'table', 'reactions',
                'type', 'video_like',
                'recipient_id', v_video_owner_id,
                'record', jsonb_build_object(
                    'video_id', NEW.video_id,
                    'actor_name', v_actor_name,
                    'like_count', v_like_count
                )
            ));
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Apply trigger to 'reactions' table
DROP TRIGGER IF EXISTS on_video_like_insert ON public.reactions;
CREATE TRIGGER on_video_like_insert 
AFTER INSERT ON public.reactions 
FOR EACH ROW EXECUTE FUNCTION public.handle_video_like_notification();


-- 2. Video Comment Trigger Function
-- Handles immediate notifications for comments, targeted to owner only
CREATE OR REPLACE FUNCTION public.handle_video_comment_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_recipient_id UUID;
    v_actor_name TEXT;
BEGIN
    -- Case: New Comment on Video -> Notify Video Owner (Instructor)
    SELECT instructor_id INTO v_recipient_id FROM public.shorts WHERE id = NEW.video_id;
    
    -- Only notify if commenter is NOT the owner
    IF v_recipient_id IS NOT NULL AND v_recipient_id != NEW.user_id THEN
        -- Fetch the name of the commenter
        SELECT COALESCE(first_name || ' ' || last_name, 'Someone') INTO v_actor_name 
        FROM public.profiles WHERE id = NEW.user_id;

        PERFORM public.send_push_webhook(jsonb_build_object(
            'table', 'comments',
            'type', 'video_comment',
            'recipient_id', v_recipient_id,
            'record', jsonb_build_object(
                'video_id', NEW.video_id,
                'actor_name', v_actor_name,
                'content', NEW.content
            )
        ));
    END IF;
    
    RETURN NEW;
END;
$$;

-- Apply trigger to 'comments' table
DROP TRIGGER IF EXISTS on_video_comment_insert ON public.comments;
CREATE TRIGGER on_video_comment_insert 
AFTER INSERT ON public.comments 
FOR EACH ROW EXECUTE FUNCTION public.handle_video_comment_notification();
