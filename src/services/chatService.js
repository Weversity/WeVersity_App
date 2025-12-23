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
    }
};
