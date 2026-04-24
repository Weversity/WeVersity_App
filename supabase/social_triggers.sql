-- ==========================================
-- TIKTOK-STYLE SOCIAL NOTIFICATION TRIGGERS
-- ==========================================

-- 1. Video Like Trigger Function
-- Triggers when someone likes a video (Table: video_reactions)
CREATE OR REPLACE FUNCTION public.handle_video_like_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_recipient_id UUID;
    v_video_owner_id UUID;
BEGIN
    -- Look up the video owner (instructor_id) from the shorts table
    SELECT instructor_id INTO v_video_owner_id FROM public.shorts WHERE id = NEW.video_id;
    
    -- Only send if the liker is NOT the owner
    IF v_video_owner_id IS NOT NULL AND v_video_owner_id != NEW.user_id THEN
        PERFORM public.send_push_webhook(jsonb_build_object(
            'table', 'video_reactions',
            'type', 'video_like',
            'record', to_jsonb(NEW) || jsonb_build_object('recipient_id', v_video_owner_id)
        ));
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_video_like_insert ON public.video_reactions;
CREATE TRIGGER on_video_like_insert 
AFTER INSERT ON public.video_reactions 
FOR EACH ROW EXECUTE FUNCTION public.handle_video_like_notification();


-- 2. Video Comment & Reply Trigger Function
-- Handles both new comments (to owner) and replies (to original commenter)
CREATE OR REPLACE FUNCTION public.handle_video_comment_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_recipient_id UUID;
BEGIN
    IF NEW.parent_id IS NULL THEN
        -- Case A: New Comment on Video -> Notify Video Owner
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

DROP TRIGGER IF EXISTS on_video_comment_insert ON public.comments;
CREATE TRIGGER on_video_comment_insert 
AFTER INSERT ON public.comments 
FOR EACH ROW EXECUTE FUNCTION public.handle_video_comment_notification();
