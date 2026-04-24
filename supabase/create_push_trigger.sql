-- Enable the pg_net extension to make HTTP requests from inside Postgres
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the function that will be called by our trigger (Fixed: SECURITY DEFINER added for auth.uid)
CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url TEXT := 'https://we-versity-app-chi.vercel.app/api/push';
  payload JSONB;
BEGIN
  -- Construct the payload matching the edge function format
  -- Fixed: Using to_jsonb(NEW) for correct JSONB merging
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', TG_TABLE_NAME, -- 'notifications' or 'chat_messages'
    'record', to_jsonb(NEW) || jsonb_build_object('sender_id', auth.uid())
  );

  -- Perform an asynchronous HTTP POST request to the Edge Function
  PERFORM net.http_post(
    url := webhook_url,
    body := payload,
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        -- Service Role key for authorization
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q' 
    )
  );

  RETURN NEW;
END;
$$;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS on_notification_insert ON public.notifications;

-- Create the trigger on the 'notifications' table
CREATE TRIGGER on_notification_insert
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_notification();

-- Enable the trigger on the 'chat_messages' table
DROP TRIGGER IF EXISTS on_chat_message_insert ON public.chat_messages;

CREATE TRIGGER on_chat_message_insert
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_notification();
