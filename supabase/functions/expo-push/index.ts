import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req: Request) => {
  try {
    // 1. Parse the payload
    // This function handles both custom Webhook calls (from SQL) and standard Supabase DB Webhooks
    const payload = await req.json();
    console.log("[Expo Push] Received Payload:", JSON.stringify(payload, null, 2));

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let pushTokens: string[] = [];
    let notificationTitle = "WeVersity Alert";
    let notificationBody = "You have a new activity.";
    let notificationData: any = {};
    let recipientId: string | null = null;

    const { type, table, record, recipient_id } = payload;

    // --- CASE A1: COURSE ENROLLMENT NOTIFICATIONS ---
    if (type === 'student_confirm') {
      const { course_name } = record;
      recipientId = recipient_id;
      notificationTitle = "🎉 Enrollment Confirmed!";
      notificationBody = `Welcome to the course! You have successfully enrolled in ${course_name}. Your learning journey starts now!`;
      notificationData = { screen: 'course', id: record.course_id, type: 'enrollment' };

    } else if (type === 'instructor_alert') {
      const { actor_name, course_name } = record;
      recipientId = recipient_id;
      notificationTitle = "📈 New Students Joined!";
      notificationBody = `${actor_name} and 3 others have successfully enrolled in your ${course_name} course. Your community is growing!`;
      notificationData = { screen: 'course', id: record.course_id, type: 'enrollment' };

    } else if (type === 'global_social_proof') {
      const { actor_name, course_name, sender_id, instructor_id } = record;
      notificationTitle = "🚀 People are joining!";
      notificationBody = `${actor_name} and 3 others just started their journey in ${course_name}. Don't miss out, join them now!`;
      notificationData = { screen: 'course', id: record.course_id, type: 'enrollment' };

      // Fetch all tokens excluding the sender and instructor
      let query = supabaseAdmin
        .from('profiles')
        .select('push_token')
        .not('push_token', 'is', null)
        .neq('id', sender_id);
      
      if (instructor_id) {
        query = query.neq('id', instructor_id);
      }

      const { data: profiles } = await query;
      pushTokens = profiles?.map((p: any) => p.push_token).filter(Boolean) || [];

    }
    // --- CASE A2: CUSTOM SOCIAL INTERACTIONS (From social_triggers.sql) ---
    else if (type === 'video_like') {
      const { actor_name, like_count, video_id } = record;
      recipientId = recipient_id;
      notificationTitle = "❤️ New Like";
      
      if (like_count > 1) {
        notificationBody = `${actor_name} and ${like_count - 1} others liked your video.`;
      } else {
        notificationBody = `${actor_name} liked your video.`;
      }
      
      notificationData = { screen: 'shorts', id: video_id, type: 'like' };

    } else if (type === 'video_comment') {
      const { actor_name, content, video_id } = record;
      recipientId = recipient_id;
      notificationTitle = "💬 New Comment";
      notificationBody = `${actor_name} commented: "${content?.substring(0, 50)}${content?.length > 50 ? '...' : ''}"`;
      notificationData = { screen: 'shorts', id: video_id, type: 'comment' };

    } 
    // --- CASE B: STANDARD DB WEBHOOKS (INSERT events) ---
    else if (type === 'INSERT') {
      if (table === 'chat_messages') {
        const { group_id, sender_id, content } = record;
        notificationTitle = "New Message";
        notificationBody = content || "Someone sent you a message.";
        notificationData = { screen: 'chat', id: group_id, type: 'message' };

        // Fetch other group members
        const { data: members } = await supabaseAdmin
          .from('group_members')
          .select('user_id')
          .eq('group_id', group_id)
          .neq('user_id', sender_id);

        const receiverIds = members?.map((m: any) => m.user_id) || [];
        if (receiverIds.length > 0) {
          const { data: profiles } = await supabaseAdmin.from('profiles').select('push_token').in('id', receiverIds);
          pushTokens = profiles?.map((p: any) => p.push_token).filter(Boolean) || [];
        }
      } else if (table === 'notifications') {
        recipientId = record.recipient_id;
        notificationTitle = (record.type || "New Alert").replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        notificationBody = record.content || "Check your notifications.";
        notificationData = { screen: 'notification', id: record.id, type: 'notification' };
      }
    }

    // --- 2. FETCH PUSH TOKEN FOR SINGLE RECIPIENT ---
    if (recipientId && pushTokens.length === 0) {
      console.log(`[Expo Push] Fetching token for recipient: ${recipientId}`);
      const { data: profile, error: pError } = await supabaseAdmin
        .from('profiles')
        .select('push_token')
        .eq('id', recipientId)
        .single();

      if (pError) {
        console.error("[Expo Push] Profile fetch error:", pError);
      } else if (profile?.push_token) {
        pushTokens.push(profile.push_token);
      } else {
        console.warn("[Expo Push] No push token found for user (User might be logged out).");
      }
    }

    if (pushTokens.length === 0) {
      return new Response(JSON.stringify({ message: "No push tokens available. Notification not sent." }), { status: 200 });
    }

    // --- 3. SEND TO EXPO PUSH API ---
    const messages = pushTokens.map(token => ({
      to: token,
      sound: 'default',
      priority: 'high',
      title: notificationTitle,
      body: notificationBody,
      data: notificationData,
    }));

    console.log(`[Expo Push] Sending ${messages.length} messages to Expo...`);

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
    console.error("[Expo Push Critical Error]", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
