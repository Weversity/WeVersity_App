import { supabase } from '../lib/supabase';

// Environment variable safety check
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
    console.warn('chatService: EXPO_PUBLIC_SUPABASE_URL is not defined. Network requests will fail.');
}

export const chatService = {
    // Fetch shared messages (common group)
    async fetchMessages() {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error in fetchMessages:', error.message);
            throw error;
        }
    },

    // Subscribe to real-time chat (Global common room)
    subscribeToGlobalChat(callback) {
        const channel = supabase
            .channel('public:chat_messages')
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

    // Send a message
    async sendMessage(senderId, content) {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .insert([{ sender_id: senderId, content }])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error in sendMessage:', error.message);
            throw error;
        }
    },

    // === CONVERSATION-BASED METHODS (1-on-1 Chats) ===

    // Fetch messages for a specific conversation
    async fetchConversationMessages(conversationId) {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
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
    subscribeToConversation(conversationId, callback) {
        const channel = supabase
            .channel(`conversation:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `conversation_id=eq.${conversationId}`
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
