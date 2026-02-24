export type MessageSender = 'user' | 'ai';

export interface Message {
    id: string; // UUID from Supabase
    text: string;
    sender: MessageSender;
    createdAt: string; // ISO timestamp
}

export interface Conversation {
    id: string; // UUID from Supabase
    userId: string;
    email: string;
    title: string;
    messages: Message[];
    updatedAt: string; // ISO timestamp
}

export interface SupportChatProps {
    isVisible: boolean;
    onClose: () => void;
}
