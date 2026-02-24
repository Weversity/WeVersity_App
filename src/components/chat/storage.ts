import { supabase } from '../../lib/supabase';
import { Conversation, Message, MessageSender } from './types';

export const storage = {
    loadConversations: async (userId: string): Promise<Conversation[]> => {
        try {
            const { data, error } = await supabase
                .from('ai_conversations')
                .select(`
                    *,
                    ai_messages (*)
                `)
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(conv => ({
                id: conv.id,
                userId: conv.user_id,
                email: conv.email,
                title: conv.title,
                updatedAt: conv.updated_at,
                messages: (conv.ai_messages || [])
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((m: any) => ({
                        id: m.id,
                        text: m.text,
                        sender: m.sender as MessageSender,
                        createdAt: m.created_at
                    }))
            }));
        } catch (error) {
            console.error('Failed to load conversations from Supabase:', error);
            return [];
        }
    },

    createNewConversation: async (userId: string, email: string, title: string = 'New Chat'): Promise<Conversation | null> => {
        try {
            const { data, error } = await supabase
                .from('ai_conversations')
                .insert([{ user_id: userId, email, title }])
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                userId: data.user_id,
                email: data.email,
                title: data.title,
                updatedAt: data.updated_at,
                messages: []
            };
        } catch (error) {
            console.error('Failed to create conversation in Supabase:', error);
            return null;
        }
    },

    saveMessage: async (conversationId: string, text: string, sender: MessageSender): Promise<Message | null> => {
        try {
            // 1. Insert message
            const { data: msgData, error: msgError } = await supabase
                .from('ai_messages')
                .insert([{ conversation_id: conversationId, text, sender }])
                .select()
                .single();

            if (msgError) throw msgError;

            // 2. Update conversation updated_at
            await supabase
                .from('ai_conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', conversationId);

            return {
                id: msgData.id,
                text: msgData.text,
                sender: msgData.sender as MessageSender,
                createdAt: msgData.created_at
            };
        } catch (error) {
            console.error('Failed to save message to Supabase:', error);
            return null;
        }
    },

    deleteConversation: async (id: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from('ai_conversations')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Failed to delete conversation from Supabase:', error);
        }
    }
};

