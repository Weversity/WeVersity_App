import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Vercel Serverless Function to handle Expo Push Notifications.
 * This is triggered by a Supabase Webhook.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 1. Authorization Check (Optional but recommended)
  const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
  const authHeader = req.headers.authorization;
  if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
    console.error("Unauthorized: Invalid Webhook Secret");
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = req.body;
    console.log("[Vercel Push] Received Payload:", JSON.stringify(payload, null, 2));

    let pushTokens: string[] = [];
    let notificationTitle = "New Notification";
    let notificationBody = "You have a new activity.";
    let notificationData: any = {};

    // 2. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    if (payload.type === 'INSERT') {
      const { table, record } = payload;

      // --- CHAT MESSAGES LOGIC ---
      if (table === 'chat_messages') {
        const groupId = record.group_id;
        const senderId = record.sender_id;

        notificationTitle = "New Message";
        notificationBody = record.content || "Someone sent you a message.";
        notificationData = { screen: 'chat', id: groupId, type: 'message' };

        // Get other group members
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

      }
      // --- NOTIFICATIONS TABLE LOGIC ---
      else if (table === 'notifications') {
        const receiverId = record.recipient_id;

        notificationTitle = (record.type || "New Alert").replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        notificationBody = record.content || "Check your notifications.";

        // Deep linking logic alignment
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

          if (profile?.push_token) pushTokens.push(profile.push_token);
        }
      }
    }

    if (pushTokens.length === 0) {
      return res.status(200).json({ message: "No tokens found." });
    }

    // 3. Send to Expo Push API
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
    return res.status(200).json(result);

  } catch (err: any) {
    console.error("[Vercel Push Error]", err);
    return res.status(500).json({ error: err.message });
  }
}
