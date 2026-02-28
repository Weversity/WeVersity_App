import React from 'react';
import { Modal } from 'react-native';
import ChatBox from './chat/ChatBox';

interface SupportChatProps {
    visible: boolean;
    onClose: () => void;
    initialEmail?: string;
    initialMessage?: string;
}

const suggestedQuestions = [
    'How can I reset my password?',
    'How can I upload a course?',
    'How do I get a certificate?',
    'What is the refund policy?',
    'How do I go live as an instructor?',
];

const SupportChat: React.FC<SupportChatProps> = ({ visible, onClose, initialEmail, initialMessage }) => {
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
                initialEmail={initialEmail}
                initialMessage={initialMessage}
            />
        </Modal>
    );
};

export default SupportChat;
