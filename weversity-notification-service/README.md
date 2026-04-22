# WeVersity Notification Service

This is a standalone Next.js microservice designed exclusively to handle push notifications for WeVersity via Supabase Webhooks and Expo Push Notifications.

## How it works
1. When a new row is inserted into `chat_messages` or `notifications` in Supabase, a Database Webhook triggers a POST request to this service.
2. This service validates the Webhook Secret (`SUPABASE_WEBHOOK_SECRET`) to ensure security.
3. It fetches the relevant users and their `push_token` from the `profiles` table using the Supabase Service Role Key.
4. It sends the notification payload to Expo's Push API (`https://exp.host/--/api/v2/push/send`).
5. It _always_ returns a `200 OK` status, even on validation or processing errors. This is to guarantee that Supabase Webhooks mark the delivery as successful and do not infinitely retry failed deliveries.

## Deployment to Vercel

To deploy this microservice to Vercel, push this folder to a GitHub repository, then link it to Vercel.

### Required Environment Variables

You must add the following Environment Variables in your Vercel Project Settings:

- **`NEXT_PUBLIC_SUPABASE_URL`**: Your Supabase Project URL (e.g., `https://[PROJECT-ID].supabase.co`).
- **`SUPABASE_SERVICE_ROLE_KEY`**: Your Supabase Service Role Secret Key. **Do not** use the `anon` key, because this service needs to bypass Row Level Security to look up user push tokens.
- **`SUPABASE_WEBHOOK_SECRET`**: A completely custom, randomly generated secret string of your choosing (e.g., `my_ultra_secure_secret_12345`). This same string must be used in the `Authorization` header in your Supabase Webhook trigger.

## Setting up Supabase SQL Triggers

Run this SQL payload in your Supabase Dashboard SQL Editor once you have deployed the app to Vercel:

```sql
CREATE OR REPLACE FUNCTION public.trigger_expo_push_on_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    -- REPLACE THIS WITH YOUR DEPLOYED VERCEL DOMAIN
    url := 'https://weversity-notification-service.vercel.app/api/push',
    
    -- Replace 'YOUR_WEBHOOK_SECRET' with the exact value you set in Vercel for SUPABASE_WEBHOOK_SECRET
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_WEBHOOK_SECRET"}'::jsonb,
    
    body := json_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW)
    )::jsonb,
    timeout_milliseconds := 2000
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to 'chat_messages' table
DROP TRIGGER IF EXISTS "on_new_message_send_push" ON public.chat_messages;
CREATE TRIGGER "on_new_message_send_push"
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.trigger_expo_push_on_message();

-- Attach trigger to 'notifications' table
DROP TRIGGER IF EXISTS "on_new_notification_send_push" ON public.notifications;
CREATE TRIGGER "on_new_notification_send_push"
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.trigger_expo_push_on_message();
```
