import React from 'react';
import { Modal } from 'react-native';
import ChatBox from './chat/ChatBox';

interface SupportChatProps {
    visible: boolean;
    onClose: () => void;
    initialMessage?: string; // Kept for compatibility, though ChatBox handles its own state
}

const suggestedQuestions = [
    'How can I reset my password?',
    'How can I upload a course?',
    'How do I get a certificate?',
    'What is the refund policy?',
    'How do I go live as an instructor?',
];

const SupportChat: React.FC<SupportChatProps> = ({ visible, onClose }) => {
    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
            onRequestClose={onClose}
            presentationStyle="fullScreen"
            statusBarTranslucent={true}
        >
            <ChatBox
                onClose={onClose}
                suggestedQuestions={suggestedQuestions}
            />
        </Modal>
    );
};

export default SupportChat;
