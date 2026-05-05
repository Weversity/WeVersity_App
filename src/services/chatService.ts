import { supabase } from '../lib/supabase';

// Environment variable safety check
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
    console.warn('chatService: EXPO_PUBLIC_SUPABASE_URL is not defined. Network requests will fail.');
}
export const chatService = {
    // Fetch inbox conversations (chat groups)
    // Instructors see only communities for courses they own.
    // Students see only communities for courses they are enrolled in.
    async fetchInboxConversations(currentUserId: string, role: string = 'student'): Promise<any[]> {
        try {
            let groups: any[] = [];

            // Fetch groups via group_members junction table
            // instructor_id is fetched from courses so we can filter by ownership
            const { data, error } = await supabase
                .from('group_members')
                .select(`
                    group:chat_groups(
                        *,
                        courses(title, image_url, instructor_id),
                        members:group_members(
                            user:profiles(id, first_name, last_name, avatar_url)
                        )
                    )
                `)
                .eq('user_id', currentUserId);

            if (error) throw error;
            groups = data ? data.map((item: any) => item.group).filter(Boolean) : [];

            // ── Role-Based Filter ──────────────────────────────────────────────
            if (role === 'instructor') {
                // Instructor: only see communities of courses they OWN
                groups = groups.filter((g: any) =>
                    g.courses?.instructor_id === currentUserId
                );
                console.log(`[chatService] Instructor filter → ${groups.length} group(s)`);
            } else {
                // Student: only see communities of courses they are ENROLLED in
                const { data: enrollments, error: enrollErr } = await supabase
                    .from('enrollments')
                    .select('course_id')
                    .eq('student_id', currentUserId);

                if (enrollErr) {
                    console.warn('chatService: Failed to fetch enrollments.', enrollErr);
                }

                const enrolledCourseIds = new Set(
                    (enrollments || []).map((e: any) => e.course_id)
                );

                groups = groups.filter((g: any) =>
                    g.course_id && enrolledCourseIds.has(g.course_id)
                );
                console.log(`[chatService] Student filter → ${groups.length} group(s) from ${enrolledCourseIds.size} enrolled course(s)`);
            }
            // ──────────────────────────────────────────────────────────────────

            // 1. Fetch unread counts for all these groups using the RPC
            const { data: unreadData, error: unreadError } = await supabase
                .rpc('get_unread_counts', { p_user_id: currentUserId });

            if (unreadError) {
                console.warn('chatService: Failed to fetch unread counts.', unreadError);
            }

            // Create a lookup map for quick access
            const unreadCountsMap = new Map();
            if (unreadData) {
                unreadData.forEach((row: any) => {
                    unreadCountsMap.set(row.group_id, row.unread_count);
                });
            }

            // Map groups to a standard format for the Inbox
            return groups.map((group: any) => {
                let displayName = group.courses?.title || (group as any).name;
                let displayAvatar = group.courses?.image_url || (group as any).image;

                // If not a course chat, it's a 1-on-1 chat
                if (!group.courses && group.members) {
                    const otherMember = group.members.find((m: any) =>
                        m.user?.id && m.user.id !== currentUserId
                    )?.user;
                    if (otherMember) {
                        displayName = `${otherMember.first_name || ''} ${otherMember.last_name || ''}`.trim() || 'User';
                        displayAvatar = otherMember.avatar_url;
                    }
                }

                displayName = displayName || 'Chat';
                displayAvatar = displayAvatar || null;

                return {
                    id: group.id,
                    name: displayName,
                    avatar: displayAvatar,
                    last_message: {
                        content: 'Tap to join the discussion',
                        created_at: group.created_at || new Date().toISOString()
                    },
                    isGroup: !!group.courses, // It's a group if it belongs to a course
                    unread_count: unreadCountsMap.get(group.id) || 0 // Map the unread count
                };
            });

        } catch (error: any) {
            console.error('Error in fetchInboxConversations:', error.message);
            throw error;
        }
    },

    // Subscribe to real-time chat (global updates)
    subscribeToGlobalChat(callback: (payload: any) => void) {
        const channel = supabase
            .channel('global-chat-updates')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    callback(payload.new);
                }
            )
            .subscribe();

        return channel;
    },

    // Fetch messages for a specific group using group_id
    async fetchConversationMessages(groupId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select(`
                    *,
                    sender:profiles!sender_id (id, first_name, last_name, avatar_url)
                `)
                .eq('group_id', groupId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            console.error('Error: ', error.message);
            throw error;
        }
    },

    // Subscribe to real-time updates for a specific group
    subscribeToConversation(id: string, type: string = 'conversation', callback: (payload: any) => void) {
        // Listen for all changes (INSERT, UPDATE, DELETE) for this group
        const channel = supabase
            .channel(`group:${id}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen for all events
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `group_id=eq.${id}`
                },
                (payload) => {
                    callback(payload);
                }
            )
            .subscribe();

        return channel;
    },

    // Mark a chat group as read for the current user
    async markChatAsRead(groupId: string, userId: string): Promise<boolean> {
        try {
            const { error } = await supabase.rpc('mark_chat_read', {
                p_group_id: groupId,
                p_user_id: userId
            });

            if (error) {
                console.error('Error in markChatAsRead API call:', error.message);
                return false;
            }
            return true;
        } catch (error: any) {
            console.error('Error in markChatAsRead:', error.message);
            return false;
        }
    },

    // Delete a message
    async deleteMessage(messageId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('chat_messages')
                .delete()
                .eq('id', messageId);

            if (error) throw error;
            return true;
        } catch (error: any) {
            console.error('Error in deleteMessage:', error.message);
            throw error;
        }
    },

    // Send a message to a specific group
    async sendConversationMessage(groupId: string, senderId: string, content: string): Promise<any> {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .insert([{
                    group_id: groupId,
                    sender_id: senderId,
                    content // Can be text or JSON/URL string
                }])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error: any) {
            console.error('Error in sendConversationMessage:', error.message);
            throw error;
        }
    },

    // Fetch specific group details
    async fetchGroupDetails(groupId: string): Promise<any> {
        try {
            const { data, error } = await supabase
                .from('chat_groups')
                .select('*, courses(title, image_url)')
                .eq('id', groupId)
                .single();

            if (error) throw error;

            // Map keys to prioritize Course details
            return {
                ...data,
                name: data.courses?.title || data.name || 'Community Chat',
                image: data.courses?.image_url || data.image || null
            };
        } catch (error: any) {
            console.error('Error in fetchGroupDetails:', error.message);
            return null;
        }
    },

    // Fetch members of a group
    async fetchGroupMembers(groupId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('group_members')
                .select(`
                    *,
                    profile:profiles(*)
                `)
                .eq('group_id', groupId);

            if (error) throw error;

            // Map to a cleaner format
            return data.map(member => ({
                id: member.user_id,
                name: member.profile ? `${member.profile.first_name || ''} ${member.profile.last_name || ''}`.trim() : 'Unknown',
                role: member.role || member.profile?.role || 'Student', // Fallback to profile role if group role is missing
                avatar: member.profile?.avatar_url,
                joined_at: member.joined_at
            }));
        } catch (error: any) {
            console.error('Error in fetchGroupMembers:', error.message);
            return [];
        }
    },

    // Leave a group
    async leaveGroup(groupId: string, userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('user_id', userId);

            if (error) throw error;
            return true;
        } catch (error: any) {
            console.error('Error in leaveGroup:', error.message);
            return false;
        }
    },

    // Fetch chat partner profile info 
    // (Used in ChatScreen, though for Groups it might be less relevant, kept for compatibility)
    async fetchChatPartner(userId: string): Promise<any> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, avatar_url, role')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('Error in fetchChatPartner:', error.message);
            return null;
        }
    },

    // Upload attachment (image/video) to Cloudinary
    async uploadAttachment(uri: string): Promise<string | null> {
        try {
            if (!uri) return null;

            // 1. Normalize URI for Android (FormData expects file:// for local files)
            const normalizedUri = uri.startsWith('content://') || uri.startsWith('file://')
                ? uri
                : `file://${uri}`;

            console.log('Starting upload for URI (Cloudinary):', normalizedUri);

            // 2. Get filename and extension
            const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            // 3. Determine resource type (image vs video)
            const isVideo = uri.toLowerCase().match(/\.(mp4|mov|m4v)$/i);
            const resourceType = isVideo ? 'video' : 'image';
            const mimeType = isVideo ? `video/${fileExt}` : `image/${fileExt}`;

            // 4. Create FormData
            const formData = new FormData();
            formData.append('file', {
                uri: normalizedUri,
                name: fileName,
                type: mimeType,
            } as any);
            formData.append('upload_preset', 'weversity_unsigned');

            const cloudName = 'dn93gd6yw';
            const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

            console.log(`Uploading to ${uploadUrl}`);

            // 5. Upload to Cloudinary
            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = await response.json();

            if (data.error) {
                console.error('Cloudinary Error:', data.error);
                throw new Error(data.error.message);
            }

            if (!data.secure_url) {
                throw new Error('No secure_url returned from Cloudinary');
            }

            console.log('Upload successful. Cloudinary URL:', data.secure_url);
            return data.secure_url;

        } catch (error: any) {
            console.error('Error in uploadAttachment:', error.message);
            return null;
        }
    },

    // ==========================================
    // 1-on-1 Chat Requests
    // ==========================================

    async checkChatRequestStatus(userId1: string, userId2: string): Promise<any> {
        try {
            const { data, error } = await supabase
                .from('chat_requests')
                .select('*')
                .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
                .single();
            if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
                throw error;
            }
            return data;
        } catch (error: any) {
            console.error('Error in checkChatRequestStatus:', error.message);
            return null;
        }
    },

    async sendChatRequest(senderId: string, receiverId: string): Promise<boolean> {
        try {
            // Upsert request: if exists, reset to pending and update timestamp
            const { error: reqError } = await supabase
                .from('chat_requests')
                .upsert(
                    {
                        sender_id: senderId,
                        receiver_id: receiverId,
                        status: 'pending',
                        created_at: new Date().toISOString()
                    },
                    { onConflict: 'sender_id, receiver_id' }
                );

            if (reqError) throw reqError;

            // 1. Delete old notification if exists to ensure receiver gets a fresh alert
            await supabase
                .from('notifications')
                .delete()
                .eq('recipient_id', receiverId)
                .eq('actor_id', senderId)
                .eq('type', 'chat_invitation');

            // 2. Insert new notification
            await supabase
                .from('notifications')
                .insert([{
                    recipient_id: receiverId,
                    actor_id: senderId,
                    type: 'chat_invitation',
                    content: 'sent you a chat request'
                }]);

            return true;
        } catch (error: any) {
            console.error('Error in sendChatRequest:', error.message);
            return false;
        }
    },

    async updateChatRequestStatus(status: 'accepted' | 'declined', senderId: string, receiverId: string): Promise<boolean> {
        try {
            const { error: updateError } = await supabase
                .from('chat_requests')
                .update({ status })
                .eq('sender_id', senderId)
                .eq('receiver_id', receiverId);

            if (updateError) throw updateError;

            const dateStr = new Date().toLocaleDateString();

            // Send Notification back to original sender
            await supabase
                .from('notifications')
                .insert([{
                    recipient_id: senderId,
                    actor_id: receiverId,
                    type: status === 'accepted' ? 'request_accepted' : 'request_declined',
                    content: `has ${status} your chat request sent on ${dateStr}`
                }]);

            return true;
        } catch (error: any) {
            console.error('Error in updateChatRequestStatus:', error.message);
            return false;
        }
    },

    // Get the total unread count across all conversations for a user
    async getTotalUnreadCount(userId: string, role: string = 'student'): Promise<number> {
        try {
            // Re-use fetchInboxConversations to ensure we only count what the user actually sees as "Groups"
            const convs = await this.fetchInboxConversations(userId, role);
            const total = convs.filter((c: any) => c.isGroup).reduce((sum: number, c: any) => sum + (Number(c.unread_count) || 0), 0);
            console.log(`[getTotalUnreadCount] Role: ${role}, Convs Length: ${convs.length}, Total Unread: ${total}`);
            return total;
        } catch (error: any) {
            console.error('Error in getTotalUnreadCount:', error.message);
            return 0;
        }
    }
};
