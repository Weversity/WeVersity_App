import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Vercel Serverless Function: Mega Multi-Channel Notification System
 * Features: Broadcast (Courses/Shorts), Personalized (Quizzes/Enrollments), Smart Routing, 
 * Scheduled Reminders, and Chunking for global delivery.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    console.log("[Vercel Push] Incoming Activity:", JSON.stringify(payload, null, 2));

    let pushTokens: string[] = [];
    let notificationTitle = "WeVersity Alert";
    let notificationBody = "New activity on your account.";
    let notificationData: any = {};

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { table, record } = payload;

    // --- 1. CHAT MESSAGES LOGIC ---
    if (table === 'chat_messages') {
      const { group_id, sender_id, content } = record;
      notificationTitle = "New Message";
      notificationBody = content || "You have a new message.";
      notificationData = { screen: 'chat', id: group_id, type: 'message' };

      const { data: members } = await supabaseAdmin
        .from('group_members')
        .select('user_id')
        .eq('group_id', group_id)
        .neq('user_id', sender_id);

      const receiverIds = members?.map(m => m.user_id) || [];
      if (receiverIds.length > 0) {
        const { data: profiles } = await supabaseAdmin.from('profiles').select('push_token').in('id', receiverIds);
        pushTokens = profiles?.map(p => p.push_token).filter(Boolean) || [];
      }
    }

    // --- 2. BROADCAST: NEW COURSE / NEW SHORT ---
    else if (table === 'courses' || table === 'shorts') {
      const isCourse = table === 'courses';
      notificationTitle = isCourse ? "🚀 New Course Published!" : "🎥 New Short Added!";
      notificationBody = isCourse
        ? `"${record.title}" is now live. Start learning today!`
        : `Check out the latest short video: "${record.title || 'New Short'}"`;

      notificationData = {
        screen: isCourse ? 'courseDetails' : 'shorts',
        id: record.id,
        type: isCourse ? 'course' : 'short'
      };

      // Broadcast to ALL users with a push token
      const { data: profiles } = await supabaseAdmin.from('profiles').select('push_token').not('push_token', 'is', null);
      pushTokens = profiles?.map(p => p.push_token) || [];
    }

    // --- 3. STUDENT ACTIVITY: ENROLLMENTS / QUIZZES ---
    else if (table === 'enrollments' || table === 'quiz_attempts') {
      const isEnrollment = table === 'enrollments';
      const userId = isEnrollment ? record.student_id : record.user_id;

      notificationTitle = isEnrollment ? "🎓 Enrollment Confirmed!" : "📝 Quiz Completed!";
      notificationBody = isEnrollment
        ? "Welcome to the course! You can now start your first lesson."
        : `Congratulations! You've finished the quiz. Check your score now.`;

      notificationData = {
        screen: isEnrollment ? 'learning' : 'courseDetails',
        id: record.course_id,
        type: 'activity'
      };

      const { data: profile } = await supabaseAdmin.from('profiles').select('push_token').eq('id', userId).single();
      if (profile?.push_token) pushTokens.push(profile.push_token);
    }

    // --- 4. GENERAL NOTIFICATIONS TABLE (Follows, Reminders, Rewards) ---
    else if (table === 'notifications') {
      const { type, recipient_id, sender_id, content, target_id } = record;

      const titleMap: Record<string, string> = {
        'follow': '👥 New Follower',
        'follow_back': '👥 New Follower Back',
        'live_class': '🔴 Live Class Started',
        'class_schedule': '📅 New Class Scheduled',
        'daily_reward': '💰 Reward Ready!',
        'chat_request_accepted': '✅ Chat Request Accepted'
      };

      notificationTitle = titleMap[type] || "New Update";
      notificationBody = content || "Check your notifications for details.";

      if (type === 'daily_reward') {
        notificationTitle = "💰 Reward Ready!";
        notificationBody = "Your daily reward is ready! Claim your coins now. 🪙";
      }

      notificationData = {
        screen: type === 'follow' || type === 'follow_back' ? 'viewProfile' : (type === 'live_class' ? 'live' : 'notifications'),
        id: target_id || record.id,
        type: 'notification'
      };

      if (recipient_id && (recipient_id !== sender_id || type === 'daily_reward')) {
        const { data: profile } = await supabaseAdmin.from('profiles').select('push_token').eq('id', recipient_id).single();
        if (profile?.push_token) pushTokens.push(profile.push_token);
      }
    }

    // --- 5. SOCIAL INTERACTIONS (TikTok Style: Likes, Comments, Replies) ---
    else if (table === 'video_reactions' || (table === 'comments' && payload.type)) {
      const type = payload.type; // video_like, video_comment, comment_reply
      const { user_id, recipient_id, content } = record;

      // Fetch the sender's name for the "Personalized" message
      const { data: senderProfile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user_id)
        .single();

      const senderName = senderProfile ? `${senderProfile.first_name} ${senderProfile.last_name}`.trim() : "Someone";

      if (type === 'video_like') {
        notificationTitle = "❤️ New Like";
        notificationBody = `${senderName} liked your video.`;
        notificationData = { screen: 'shorts', id: record.video_id, type: 'like' };
      }
      else if (type === 'video_comment') {
        notificationTitle = "💬 New Comment";
        notificationBody = `${senderName} commented: "${content?.substring(0, 50)}${content?.length > 50 ? '...' : ''}"`;
        notificationData = { screen: 'shorts', id: record.video_id, type: 'comment' };
      }
      else if (type === 'comment_reply') {
        notificationTitle = "↪️ New Reply";
        notificationBody = `${senderName} replied to your comment: "${content?.substring(0, 50)}${content?.length > 50 ? '...' : ''}"`;
        notificationData = { screen: 'shorts', id: record.video_id, type: 'reply' };
      }

      if (recipient_id) {
        const { data: profile } = await supabaseAdmin.from('profiles').select('push_token').eq('id', recipient_id).single();
        if (profile?.push_token) pushTokens.push(profile.push_token);
      }
    }

    if (pushTokens.length === 0) return res.status(200).json({ message: "No tokens found." });

    // --- 5. EXPO CHUNKING LOGIC ---
    // Expo allows max 100 messages per request
    const uniqueTokens = Array.from(new Set(pushTokens));
    const chunks = [];
    const tempTokens = [...uniqueTokens];
    while (tempTokens.length > 0) {
      chunks.push(tempTokens.splice(0, 100));
    }

    console.log(`[Vercel Push] Sending to ${uniqueTokens.length} devices in ${chunks.length} chunks.`);

    const results = [];
    for (const chunk of chunks) {
      const messages = chunk.map(token => ({
        to: token,
        sound: 'default',
        priority: 'high',
        title: notificationTitle,
        body: notificationBody,
        data: notificationData,
      }));

      const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });

      const chunkResult = await expoResponse.json();
      results.push(chunkResult);
    }

    return res.status(200).json({ success: true, chunks: results.length });

  } catch (err: any) {
    console.error("[Vercel Push Error]", err);
    return res.status(500).json({ error: err.message });
  }
}
