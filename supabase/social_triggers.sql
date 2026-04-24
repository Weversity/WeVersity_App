-- ==========================================
-- TIKTOK-STYLE SOCIAL NOTIFICATION TRIGGERS (REFINED)
-- ==========================================

-- 1. Video Reaction Trigger Function
-- Handles Likes/Reactions on Videos
-- We will dynamically check if the table exists to avoid relation errors
DO $$ 
BEGIN
    -- Check if 'reactions' table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reactions') THEN
        RAISE NOTICE 'Table public.reactions found. Creating trigger...';
    ELSE
        RAISE WARNING 'Table public.reactions NOT found. Please ensure your likes table is named exactly "reactions".';
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_video_like_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_video_owner_id UUID;
BEGIN
    -- Look up the video owner (instructor_id) from the shorts table
    -- Confirming: shorts table uses instructor_id
    SELECT instructor_id INTO v_video_owner_id FROM public.shorts WHERE id = NEW.video_id;
    
    -- Only send if the reactor is NOT the owner
    IF v_video_owner_id IS NOT NULL AND v_video_owner_id != NEW.user_id THEN
        PERFORM public.send_push_webhook(jsonb_build_object(
            'table', 'reactions',
            'type', 'video_like',
            'record', to_jsonb(NEW) || jsonb_build_object('recipient_id', v_video_owner_id)
        ));
    END IF;
    
    RETURN NEW;
END;
$$;

-- Apply trigger to 'reactions' table (Drop old faulty ones first)
DROP TRIGGER IF EXISTS on_video_like_insert ON public.reactions;
CREATE TRIGGER on_video_like_insert 
AFTER INSERT ON public.reactions 
FOR EACH ROW EXECUTE FUNCTION public.handle_video_like_notification();


-- 2. Video Comment & Reply Trigger Function
-- Handles both new comments (to owner) and replies (to original commenter)
DO $$ 
BEGIN
    -- Check if 'comments' table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
        RAISE NOTICE 'Table public.comments found. Creating trigger...';
    ELSE
        RAISE WARNING 'Table public.comments NOT found. Please ensure your comments table is named exactly "comments".';
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_video_comment_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_recipient_id UUID;
BEGIN
    IF NEW.parent_id IS NULL THEN
        -- Case A: New Comment on Video -> Notify Video Owner (Instructor)
        SELECT instructor_id INTO v_recipient_id FROM public.shorts WHERE id = NEW.video_id;
        
        -- Only notify if commenter is NOT the owner
        IF v_recipient_id IS NOT NULL AND v_recipient_id != NEW.user_id THEN
            PERFORM public.send_push_webhook(jsonb_build_object(
                'table', 'comments',
                'type', 'video_comment',
                'record', to_jsonb(NEW) || jsonb_build_object('recipient_id', v_recipient_id)
            ));
        END IF;
    ELSE
        -- Case B: Reply to Comment -> Notify Original Commenter
        SELECT user_id INTO v_recipient_id FROM public.comments WHERE id = NEW.parent_id;
        
        -- Only notify if replier is NOT the original commenter
        IF v_recipient_id IS NOT NULL AND v_recipient_id != NEW.user_id THEN
            PERFORM public.send_push_webhook(jsonb_build_object(
                'table', 'comments',
                'type', 'comment_reply',
                'record', to_jsonb(NEW) || jsonb_build_object('recipient_id', v_recipient_id)
            ));
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Apply trigger to 'comments' table
DROP TRIGGER IF EXISTS on_video_comment_insert ON public.comments;
CREATE TRIGGER on_video_comment_insert 
AFTER INSERT ON public.comments 
FOR EACH ROW EXECUTE FUNCTION public.handle_video_comment_notification();
