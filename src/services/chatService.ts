import { supabase } from '../lib/supabase';

// Environment variable safety check
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
    console.warn('chatService: EXPO_PUBLIC_SUPABASE_URL is not defined. Network requests will fail.');
}
export const chatService = {
    // Fetch inbox conversations (chat groups)
    // Note: Instructors fetch created groups; Students fetch groups they are members of.
    async fetchInboxConversations(currentUserId: string, role: string = 'student'): Promise<any[]> {
        try {
            let groups = [];

            if (role === 'instructor') {
                // Instructor: Fetch groups where creator_id is current user, include course details
                const { data, error } = await supabase
                    .from('chat_groups')
                    .select('*, courses(title, image_url)')
                    .eq('creator_id', currentUserId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                groups = data || [];

            } else {
                // Student: Fetch groups via group_members junction table
                const { data, error } = await supabase
                    .from('group_members')
                    .select(`
                        group:chat_groups(
                            *,
                            courses(title, image_url)
                        )
                    `)
                    .eq('user_id', currentUserId);

                if (error) throw error;
                groups = data ? data.map(item => item.group).filter(Boolean) : [];
            }

            // Map groups to a standard format for the Inbox
            return groups.map(group => {
                // Determine Name: Course Title > Group Name > Fallback
                const displayName = group.courses?.title || group.name || 'Community Chat';

                // Determine Avatar: Course Image > Group Image > Fallback
                const displayAvatar = group.courses?.image_url || group.image || null;

                return {
                    id: group.id,
                    name: displayName,
                    avatar: displayAvatar,
                    last_message: {
                        content: 'Tap to join the discussion',
                        created_at: group.created_at || new Date().toISOString()
                    },
                    isGroup: true
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
    }


};
