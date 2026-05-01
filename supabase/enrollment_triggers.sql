-- ==========================================
-- 3-TIER NOTIFICATION SYSTEM FOR ENROLLMENTS
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_course_enrollment_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_course_name TEXT;
    v_instructor_id UUID;
    v_student_name TEXT;
    v_enrollment_count INT;
BEGIN
    -- 1. Fetch Course Details (using COALESCE to handle either title or course_name if schema varies)
    -- Typically, courses have a 'title', but aliasing just in case
    SELECT COALESCE(title, 'a course'), instructor_id 
    INTO v_course_name, v_instructor_id 
    FROM public.courses 
    WHERE id = NEW.course_id;
    
    -- 2. Fetch Latest Student's First Name
    SELECT COALESCE(first_name, 'A student') 
    INTO v_student_name 
    FROM public.profiles 
    WHERE id = NEW.student_id;

    -- SCENARIO A: Immediate to Student
    PERFORM public.send_push_webhook(jsonb_build_object(
        'table', 'enrollments',
        'type', 'student_confirm',
        'recipient_id', NEW.student_id,
        'record', jsonb_build_object(
            'course_id', NEW.course_id,
            'course_name', v_course_name,
            'actor_name', v_student_name
        )
    ));

    -- SCENARIO B: Threshold to Instructor & Global (Every 4 enrollments)
    SELECT COUNT(*) INTO v_enrollment_count 
    FROM public.enrollments 
    WHERE course_id = NEW.course_id;

    IF v_enrollment_count > 0 AND v_enrollment_count % 4 = 0 THEN
        
        -- Send to Instructor (if not null)
        IF v_instructor_id IS NOT NULL THEN
            PERFORM public.send_push_webhook(jsonb_build_object(
                'table', 'enrollments',
                'type', 'instructor_alert',
                'recipient_id', v_instructor_id,
                'record', jsonb_build_object(
                    'course_id', NEW.course_id,
                    'course_name', v_course_name,
                    'actor_name', v_student_name
                )
            ));
        END IF;

        -- Send Global Social Proof
        -- We pass instructor_id and student_id so the Edge function can exclude them from the broadcast
        PERFORM public.send_push_webhook(jsonb_build_object(
            'table', 'enrollments',
            'type', 'global_social_proof',
            'record', jsonb_build_object(
                'course_id', NEW.course_id,
                'course_name', v_course_name,
                'actor_name', v_student_name,
                'sender_id', NEW.student_id,
                'instructor_id', v_instructor_id
            )
        ));
    END IF;

    RETURN NEW;
END;
$$;

-- Apply trigger to 'enrollments' table
-- First, drop the old generic trigger so you don't get duplicate notifications
DROP TRIGGER IF EXISTS on_enroll_insert ON public.enrollments;

-- Then apply the new sophisticated trigger
DROP TRIGGER IF EXISTS on_enrollment_notification_insert ON public.enrollments;
CREATE TRIGGER on_enrollment_notification_insert
AFTER INSERT ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.handle_course_enrollment_notification();
