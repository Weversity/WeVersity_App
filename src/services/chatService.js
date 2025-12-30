import { supabase } from '../lib/supabase';

// Environment variable safety check
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
    console.warn('chatService: EXPO_PUBLIC_SUPABASE_URL is not defined. Network requests will fail.');
}
export const chatService = {
    // Fetch inbox conversations (latest message per conversation)
    async fetchInboxConversations(currentUserId) {
        try {
            // 1. Fetch messages with explicit profile join via sender_id
            const { data: messages, error } = await supabase
                .from('chat_messages')
                .select(`
                    *,
                    sender:profiles!sender_id (id, first_name, last_name, avatar_url)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // 2. Group by group_id or conversation_id
            const conversationsMap = new Map();

            messages.forEach(msg => {
                const chatId = msg.group_id || msg.conversation_id;
                if (!chatId) return;

                if (!conversationsMap.has(chatId)) {
                    // partner info logic: if I sent it, the partner is the other messages' sender?
                    // For inbox, we show the sender's name if it's not us.
                    const isMe = msg.sender_id === currentUserId;

                    conversationsMap.set(chatId, {
                        id: chatId,
                        name: isMe ? 'Me' : (msg.sender ? `${msg.sender.first_name || ''} ${msg.sender.last_name || ''}`.trim() : 'User'),
                        avatar: isMe ? null : msg.sender?.avatar_url,
                        last_message: msg,
                    });
                }
            });

            return Array.from(conversationsMap.values());
        } catch (error) {
            console.error('Error in fetchInboxConversations:', error.message);
            throw error;
        }
    },

    // Subscribe to real-time chat (global updates)
    subscribeToGlobalChat(callback) {
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

    // Fetch messages for a specific conversation with explicit join
    async fetchConversationMessages(conversationId) {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select(`
                    *,
                    sender:profiles!sender_id (id, first_name, last_name, avatar_url)
                `)
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error in fetchConversationMessages:', error.message);
            throw error;
        }
    },

    // Subscribe to real-time updates for a specific conversation
    subscribeToConversation(id, type = 'conversation', callback) {
        // type can be 'conversation_id' or 'group_id'
        const filter = type === 'group' ? `group_id=eq.${id}` : `conversation_id=eq.${id}`;

        const channel = supabase
            .channel(`conversation:${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: filter
                },
                (payload) => {
                    callback(payload.new);
                }
            )
            .subscribe();

        return channel;
    },

    // Send a message to a specific conversation
    async sendConversationMessage(conversationId, senderId, content) {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .insert([{
                    conversation_id: conversationId,
                    sender_id: senderId,
                    content
                }])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error in sendConversationMessage:', error.message);
            throw error;
        }
    },

    // Fetch chat partner profile info
    async fetchChatPartner(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, avatar_url, role')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error in fetchChatPartner:', error.message);
            return null;
        }
    }
};
