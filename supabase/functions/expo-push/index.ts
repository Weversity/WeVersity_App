import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

 serve(async (req: Request) => {
  try {
    // 1. Parse the payload coming from the Database Webhook (Trigger)
    const payload = await req.json();

    // 2. We only care about INSERT events
    if (payload.type === 'INSERT') {
      const { table, record } = payload;
      
      let pushTokens: string[] = [];
      let notificationTitle = "New Notification";
      let notificationBody = "You have a new activity.";
      let notificationData = {};

      // 3. Initialize Supabase Client with the Service Role Key to bypass RLS
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // --- HANDLE chat_messages TABLE ---
      if (table === 'chat_messages') {
        const groupId = record.group_id;
        const senderId = record.sender_id;
        
        notificationTitle = "New Message";
        notificationBody = record.content || "Someone sent you a message.";
        notificationData = { type: 'message', messageId: record.id, groupId: groupId };

        // We need to find all other members of this group
        const { data: members, error: membersError } = await supabaseAdmin
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId)
          .neq('user_id', senderId); // DON'T send to the sender

        if (membersError) {
          console.error("Error fetching group members:", membersError);
          return new Response(JSON.stringify({ error: "Failed to fetch group members." }), { status: 500 });
        }

        const receiverIds = members?.map((m: any) => m.user_id) || [];
        
        if (receiverIds.length === 0) {
            return new Response(JSON.stringify({ message: "No other members to notify." }), { status: 200 });
        }

        // Fetch their push tokens
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('push_token')
          .in('id', receiverIds);

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          return new Response(JSON.stringify({ error: "Failed to fetch profiles." }), { status: 500 });
        }

        pushTokens = profiles?.map((p: any) => p.push_token).filter(Boolean) || [];

      } 
      // --- HANDLE notifications TABLE ---
      else if (table === 'notifications') {
        const receiverId = record.recipient_id;
        
        // Capitalize the type for the title, e.g. "chat_invitation" -> "Chat Invitation"
        notificationTitle = (record.type || "New Alert").replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        notificationBody = record.content || "Check your notifications.";
        notificationData = { type: 'notification', notificationId: record.id };

        if (!receiverId) {
          return new Response(JSON.stringify({ error: "No recipient ID found in the database record" }), { status: 400 });
        }

        // Fetch the receiver's push_token from the 'profiles' table
        const { data: profile, error } = await supabaseAdmin
          .from('profiles')
          .select('push_token')
          .eq('id', receiverId)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return new Response(JSON.stringify({ error: "Failed to fetch profile." }), { status: 500 });
        }

        if (profile?.push_token) {
            pushTokens.push(profile.push_token);
        }
      }

      if (pushTokens.length === 0) {
        console.log(`No valid push tokens found for this event.`);
        return new Response(JSON.stringify({ message: "No push tokens found to send to." }), { status: 200 });
      }

      // Filter out invalid token formats just in case
      const validPushTokens = pushTokens.filter(t => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['));

      if (validPushTokens.length === 0) {
        console.log(`Push tokens found but they are invalid formats.`);
        return new Response(JSON.stringify({ message: "Invalid push tokens." }), { status: 400 });
      }

      // 5. Send the payload to Expo's Push API
      // We map the valid tokens into multiple messages because expo expects an array of messages
      const pushMessages = validPushTokens.map(token => ({
          to: token,
          sound: 'default',
          title: notificationTitle,
          body: notificationBody,
          data: notificationData,
      }));

      const expoPushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pushMessages),
      });

      const expoPushResult = await expoPushResponse.json();

      return new Response(
        JSON.stringify({ success: true, expoResult: expoPushResult }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ message: "Not an INSERT event. Ignored." }), { status: 200 });

  } catch (err: any) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
