import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req: Request) => {
  try {
    // 1. Parse the payload coming from the Database Webhook (Trigger)
    const payload = await req.json();
    console.log("[Webhook Triggered] Received Payload:", JSON.stringify(payload, null, 2));

    let pushTokens: string[] = [];
    let notificationTitle = "New Notification";
    let notificationBody = "You have a new activity.";
    let notificationData: any = {};

    // 2. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Extract logic based on the Table that triggered the event
    if (payload.type === 'INSERT') {
      const { table, record } = payload;

      if (table === 'chat_messages') {
        const groupId = record.group_id;
        const senderId = record.sender_id;

        notificationTitle = "New Message";
        notificationBody = record.content || "Someone sent you a message.";
        // Deep linking data for chat
        notificationData = { screen: 'chat', id: groupId, type: 'message' };

        // Fetch other group members to notify
        const { data: members, error: membersError } = await supabaseAdmin
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId)
          .neq('user_id', senderId);

        if (membersError) throw membersError;

        const receiverIds = members?.map((m: any) => m.user_id) || [];
        if (receiverIds.length > 0) {
          const { data: profiles, error: pError } = await supabaseAdmin
            .from('profiles')
            .select('push_token')
            .in('id', receiverIds);

          if (pError) throw pError;
          pushTokens = profiles?.map((p: any) => p.push_token).filter(Boolean) || [];
        }

      } else if (table === 'notifications') {
        const receiverId = record.recipient_id;

        notificationTitle = (record.type || "New Alert").replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        notificationBody = record.content || "Check your notifications.";

        // Deep linking data for notifications (navigate to course or generic notifications)
        // We assume 'target_id' or 'course_id' might exist in the record if applicable
        const targetId = record.target_id || record.id;
        notificationData = {
          screen: record.type === 'course_update' ? 'course' : 'notification',
          id: targetId,
          type: 'notification'
        };

        if (receiverId) {
          const { data: profile, error: pError } = await supabaseAdmin
            .from('profiles')
            .select('push_token')
            .eq('id', receiverId)
            .single();

          if (pError) console.warn("Profile not found or error:", pError);
          if (profile?.push_token) pushTokens.push(profile.push_token);
        }
      }
    }

    if (pushTokens.length === 0) {
      return new Response(JSON.stringify({ message: "No push tokens found." }), { status: 200 });
    }

    // 4. Send to Expo Push API
    const messages = pushTokens.map(token => ({
      to: token,
      sound: 'default',
      priority: 'high',
      title: notificationTitle,
      body: notificationBody,
      data: notificationData,
    }));

    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await expoResponse.json();
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });

  } catch (err: any) {
    console.error("[Error]", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
