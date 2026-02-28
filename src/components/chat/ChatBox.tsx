import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../../lib/supabase';
import ChatHeaderMenu from './ChatHeaderMenu';
import ChatInput from './ChatInput';
import MessageList from './MessageList';
import SuggestedQuestions from './SuggestedQuestions';
import { storage } from './storage';
import { Conversation, Message, MessageSender } from './types';

interface ChatBoxProps {
    onClose: () => void;
    suggestedQuestions: string[];
    initialEmail?: string;
    initialMessage?: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ onClose, suggestedQuestions, initialEmail, initialMessage }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [email, setEmail] = useState('');
    const [showEmailInput, setShowEmailInput] = useState(false);

    // Initial auth and data load
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            setUser(user);

            const history = await storage.loadConversations(user.id);
            setConversations(history);

            if (initialEmail) {
                setEmail(initialEmail);
                setShowEmailInput(false);
                if (history.length > 0) {
                    setCurrentConversation(history[0]);
                }
            } else if (history.length > 0) {
                // Auto-fetch email from most recent history
                const recentConv = history[0];
                setEmail(recentConv.email);
                setCurrentConversation(recentConv);
                setShowEmailInput(false);
            } else {
                // No history and no initial email, we will need to ask for email on first message
                setShowEmailInput(true);
            }
            setLoading(false);
        };
        init();
    }, [initialEmail]);

    const handleNewChat = useCallback(async () => {
        if (!user) return;

        // If we already have an email, create immediately
        if (email) {
            const newConv = await storage.createNewConversation(user.id, email);
            if (newConv) {
                setCurrentConversation(newConv);
                setConversations(prev => [newConv, ...prev]);
                setShowEmailInput(false);
            }
        } else {
            setCurrentConversation(null);
            setShowEmailInput(true);
        }
    }, [user, email]);

    const handleSelectConversation = (id: string) => {
        const selected = conversations.find(c => c.id === id);
        if (selected) {
            setCurrentConversation(selected);
            setEmail(selected.email);
            setShowEmailInput(false);
        }
    };

    const handleDeleteConversation = async (id: string) => {
        await storage.deleteConversation(id);
        const updated = conversations.filter(c => c.id !== id);
        setConversations(updated);
        if (currentConversation?.id === id) {
            if (updated.length > 0) {
                handleSelectConversation(updated[0].id);
            } else {
                handleNewChat();
            }
        }
    };

    const addMessage = useCallback(async (text: string, sender: MessageSender) => {
        if (!user) {
            Alert.alert('Error', 'Please login to use the chat.');
            return;
        }

        let targetConv = currentConversation;

        // If no conversation exists (first message), we need to create one
        if (!targetConv) {
            if (!email) {
                Alert.alert('Email Required', 'Please provide your email to start.');
                return;
            }
            targetConv = await storage.createNewConversation(user.id, email, text.substring(0, 30));
            if (!targetConv) return;
            setCurrentConversation(targetConv);
            setConversations(prev => [targetConv!, ...prev]);
            setShowEmailInput(false);
        }

        // 1. Optimistic UI update for user message
        const optimisticMsg: Message = {
            id: 'temp-' + Date.now(),
            text,
            sender,
            createdAt: new Date().toISOString()
        };

        const updatedMessages = [optimisticMsg, ...targetConv.messages];
        setCurrentConversation({ ...targetConv, messages: updatedMessages });

        // 2. Save User Message to Supabase
        const realMsg = await storage.saveMessage(targetConv.id, text, sender);

        if (realMsg) {
            // Replace optimistic with real
            const finalMessages = [realMsg, ...targetConv.messages];
            setCurrentConversation(prev => prev ? { ...prev, messages: finalMessages } : null);
        }

        if (sender === 'user') {
            // Trigger AI response (simulated logic as before, but saved to DB)
            const lowerMsg = text.toLowerCase();
            let responseText = "I'm not sure how to help with that. Can you please rephrase?";

            if (lowerMsg.match(/^(hi|hello|hey|greetings)/)) {
                responseText = "Hello! 👋 I am your AI Support Assistant. How can I help you today?";
            } else if (lowerMsg.includes('password')) {
                responseText = 'To reset your password, go to the profile settings and click on "Forgot Password".';
            } else if (lowerMsg.includes('certificate')) {
                responseText = "You can find your certificates in the 'My Courses' section, under the 'Completed' tab.";
            } else if (lowerMsg.includes('refund')) {
                responseText = 'Our refund policy allows for refunds within 14 days of purchase, provided you have not completed more than 25% of the course.';
            } else if (lowerMsg.includes('live')) {
                responseText = 'To go live, you need to be an instructor. From the instructor dashboard, click on the "Go Live" button.';
            } else if (lowerMsg.includes('upload') || lowerMsg.includes('course')) {
                responseText = 'To upload a course, you need to be an instructor. From the instructor dashboard, click on "My Courses" and then "Add New Course".';
            }

            setTimeout(async () => {
                const botMsg = await storage.saveMessage(targetConv!.id, responseText, 'ai');
                if (botMsg) {
                    setCurrentConversation(prev => {
                        if (!prev || prev.id !== targetConv!.id) return prev;
                        return { ...prev, messages: [botMsg, ...prev.messages] };
                    });
                    // Refresh history list to update timestamps/order
                    const history = await storage.loadConversations(user.id);
                    setConversations(history);
                }
            }, 1000);
        }
    }, [user, email, currentConversation]);


    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#8A2BE2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>AI Support</Text>
                        <Text style={styles.headerSubtitle}>
                            {currentConversation?.messages.length || 0} messages
                        </Text>
                    </View>
                </View>

                <ChatHeaderMenu
                    conversations={conversations}
                    onSelectConversation={handleSelectConversation}
                    onNewChat={handleNewChat}
                    onDeleteConversation={handleDeleteConversation}
                />
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
            >
                <View style={styles.chatContainer}>
                    {showEmailInput && !currentConversation ? (
                        <View style={styles.emailContainer}>
                            <Ionicons name="chatbubbles-outline" size={60} color="#8A2BE2" style={{ marginBottom: 20 }} />
                            <Text style={styles.welcomeTitle}>Welcome to Support!</Text>
                            <Text style={styles.welcomeText}>Please enter your email to start a conversation.</Text>
                            <TextInput
                                style={styles.emailInput}
                                placeholder="Your email address"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Text style={styles.noticeText}>We'll use this to track your support requests.</Text>
                        </View>
                    ) : (
                        <MessageList messages={currentConversation?.messages || []} />
                    )}

                    {currentConversation?.messages.length === 0 && !isInputFocused && !showEmailInput && (
                        <SuggestedQuestions
                            questions={suggestedQuestions}
                            onPress={(q) => addMessage(q, 'user')}
                        />
                    )}

                    <ChatInput
                        onSend={(text) => addMessage(text, 'user')}
                        placeholder={showEmailInput && !currentConversation ? "Enter email first..." : "Ask anything..."}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                    />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
        paddingBottom: 15,
        backgroundColor: '#8A2BE2',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
    keyboardView: {
        flex: 1,
        backgroundColor: '#fff',
    },
    chatContainer: {
        flex: 1,
    },
    emailContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    welcomeText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    emailInput: {
        width: '100%',
        height: 50,
        backgroundColor: '#f6f0ff',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e2d5ff',
    },
    noticeText: {
        fontSize: 12,
        color: '#999',
    }
});

export default ChatBox;


