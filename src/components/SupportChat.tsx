import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bubble, GiftedChat, IMessage, InputToolbar, Send } from 'react-native-gifted-chat';

interface SupportChatProps {
    visible: boolean;
    onClose: () => void;
    initialEmail?: string;
    initialMessage?: string;
}

const bot = {
    _id: 2,
    name: 'AI Assistant',
    avatar: 'https://res.cloudinary.com/dn93gd6yw/image/upload/v1764752399/WeVersity_Logo-T_yluiwx.png',
};

interface ChatSession {
    id: string;
    date: string; // ISO string
    messages: IMessage[];
    preview: string;
}

const user = {
    _id: 1,
    name: 'User',
};

const suggestedQuestions = [
    'How can I reset my password?',
    'How can I upload a course?',
    'How do I get a certificate?',
    'What is the refund policy?',
    'How do I go live as an instructor?',
];

const SupportChat: React.FC<SupportChatProps> = ({ visible, onClose, initialMessage }) => {
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [historyVisible, setHistoryVisible] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);

    useEffect(() => {
        if (visible) {
            const welcomeMessage: IMessage = {
                _id: new Date().getTime(),
                text: "Hi there! 👋 I am your AI Support Assistant. I can help with course refunds, technical issues, or account settings. What do you need help with?",
                createdAt: new Date(),
                user: bot,
            };

            if (initialMessage) {
                const initialUserMessage: IMessage = {
                    _id: new Date().getTime() + 1,
                    text: initialMessage,
                    createdAt: new Date(),
                    user: user,
                };
                setMessages([welcomeMessage, initialUserMessage]);
                handleBotResponse(initialMessage);
            } else {
                setMessages([welcomeMessage]);
            }
        }
    }, [visible, initialMessage]);

    const handleBotResponse = (messageText: string) => {
        setIsTyping(true);

        // Mock bot thinking
        setTimeout(() => {
            // Mock bot response based on user message
            let responseText = "I'm not sure how to help with that. Can you please rephrase?";
            const lowerMsg = messageText.toLowerCase();

            if (lowerMsg.match(/^(hi|hello|hey|greetings)/)) {
                responseText = "Hello! 👋 I am your AI Support Assistant. How can I help you today?";
            } else if (lowerMsg.includes('password')) {
                responseText = 'To reset your password, go to the profile settings and click on "Forgot Password".';
            } else if (lowerMsg.includes('certificate')) {
                responseText = "You can find your certificates in the 'My Courses' section, under the 'Completed' tab.";
            } else if (lowerMsg.includes('refund')) {
                responseText = 'Our refund policy allows for refunds within 14 days of purchase, provided you have not completed more than 25% of the course. Would you like me to initiate a refund request?';
            } else if (lowerMsg.includes('live')) {
                responseText = 'To go live, you need to be an instructor. From the instructor dashboard, click on the "Go Live" button.';
            } else if (lowerMsg.includes('upload') || lowerMsg.includes('course')) {
                responseText = 'To upload a course, you need to be an instructor. From the instructor dashboard, click on "My Courses" and then "Add New Course".';
            }

            const botMessage: IMessage = {
                _id: new Date().getTime(),
                text: responseText,
                createdAt: new Date(),
                user: bot,
            };

            setIsTyping(false);
            setMessages(previousMessages => GiftedChat.append(previousMessages, [botMessage]));
        }, 2000);
    }

    const saveCurrentSession = async () => {
        if (messages.length <= 1) return; // Don't save if only welcome message

        try {
            const historyJson = await AsyncStorage.getItem('support_chat_history');
            let history: ChatSession[] = historyJson ? JSON.parse(historyJson) : [];

            const newSession: ChatSession = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                messages: messages,
                preview: messages[0].text.substring(0, 50) + (messages[0].text.length > 50 ? '...' : '')
            };

            history = [newSession, ...history];
            await AsyncStorage.setItem('support_chat_history', JSON.stringify(history));
            setChatHistory(history);
        } catch (error) {
            console.error("Failed to save session", error);
        }
    };

    const handleNewChat = () => {
        saveCurrentSession();
        setMenuVisible(false);
        setMessages([
            {
                _id: new Date().getTime(),
                text: "Hi there! 👋 I am your AI Support Assistant. I can help with course refunds, technical issues, or account settings. What do you need help with?",
                createdAt: new Date(),
                user: bot,
            }
        ]);
    };

    const loadHistory = async () => {
        try {
            const historyJson = await AsyncStorage.getItem('support_chat_history');
            if (historyJson) {
                setChatHistory(JSON.parse(historyJson));
            }
        } catch (error) {
            console.error("Failed to load history", error);
        }
    };

    useEffect(() => {
        if (historyVisible) {
            loadHistory();
        }
    }, [historyVisible]);

    const deleteHistoryItem = async (id: string) => {
        try {
            const updatedHistory = chatHistory.filter(item => item.id !== id);
            setChatHistory(updatedHistory);
            await AsyncStorage.setItem('support_chat_history', JSON.stringify(updatedHistory));
        } catch (error) {
            console.error("Failed to delete item", error);
        }
    };

    const restoreSession = (session: ChatSession) => {
        setMessages(session.messages);
        setHistoryVisible(false);
        setMenuVisible(false);
    };

    const onSend = useCallback((messages: IMessage[] = []) => {
        setMessages(previousMessages => GiftedChat.append(previousMessages, messages));
        const message = messages[0].text;
        handleBotResponse(message);
    }, []);

    const handleSuggestedQuestionPress = (question: string) => {
        const message: IMessage = {
            _id: new Date().getTime(),
            text: question,
            createdAt: new Date(),
            user: user,
        };
        onSend([message]);
    };

    const renderBubble = (props: any) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: '#8A2BE2',
                    },
                    left: {
                        backgroundColor: '#f0f0f0',
                    },
                }}
                textStyle={{
                    right: {
                        color: '#fff',
                    },
                    left: {
                        color: '#333',
                    },
                }}
            />
        );
    };

    const renderInputToolbar = (props: any) => {
        return (
            <InputToolbar
                {...props}
                containerStyle={styles.inputContainer}
                primaryStyle={{ alignItems: 'center' }}
            />
        );
    };

    const renderSend = (props: any) => {
        return (
            <Send {...props} containerStyle={styles.sendContainer}>
                <Ionicons name="send" size={24} color="#8A2BE2" />
            </Send>
        );
    };

    const renderAvatar = (props: any) => {
        return <Image source={{ uri: props.currentMessage.user.avatar }} style={styles.avatar} />;
    };

    const renderAccessory = () => (
        isInputFocused ? null : (
            <View style={styles.suggestedQuestionsContainer}>
                <Text style={styles.suggestedQuestionsTitle}>Suggested Questions</Text>
                <FlatList
                    data={suggestedQuestions}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.suggestedQuestion} onPress={() => handleSuggestedQuestionPress(item)}>
                            <Text style={styles.suggestedQuestionText}>{item}</Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingLeft: 10 }}
                />
            </View>
        )
    );

    return (
        <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Image source={{ uri: bot.avatar }} style={styles.headerAvatar} />
                        <Text style={styles.headerTitle}>AI Assistant</Text>
                    </View>
                    <TouchableOpacity onPress={() => setMenuVisible(true)}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Chat Menu Modal */}
                <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
                    <TouchableOpacity style={styles.menuOverlay} onPress={() => setMenuVisible(false)} activeOpacity={1}>
                        <View style={styles.menuContainer}>
                            <TouchableOpacity style={styles.menuItem} onPress={handleNewChat}>
                                <Ionicons name="add-circle-outline" size={20} color="#333" />
                                <Text style={styles.menuItemText}>New Chat</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setHistoryVisible(true); }}>
                                <Ionicons name="time-outline" size={20} color="#333" />
                                <Text style={styles.menuItemText}>History</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* History Modal */}
                <Modal visible={historyVisible} animationType="slide" onRequestClose={() => setHistoryVisible(false)}>
                    <View style={styles.historyContainer}>
                        <View style={styles.historyHeader}>
                            <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.historyTitle}>Chat History</Text>
                            <View style={{ width: 28 }} />
                        </View>
                        <FlatList
                            data={chatHistory}
                            keyExtractor={item => item.id}
                            contentContainerStyle={{ padding: 20 }}
                            ListEmptyComponent={<Text style={styles.emptyHistoryText}>No past conversations found.</Text>}
                            renderItem={({ item }) => (
                                <View style={styles.historyItem}>
                                    <TouchableOpacity style={{ flex: 1 }} onPress={() => restoreSession(item)}>
                                        <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}</Text>
                                        <Text style={styles.historyPreview} numberOfLines={1}>{item.preview}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() =>
                                        Alert.alert("Delete", "Are you sure?",
                                            [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteHistoryItem(item.id) }])
                                    }>
                                        <Ionicons name="trash-outline" size={20} color="#FF5252" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    </View>
                </Modal>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    enabled={Platform.OS === "ios"}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                >
                    <GiftedChat
                        messages={messages}
                        onSend={onSend}
                        user={user}
                        isTyping={isTyping}
                        renderBubble={renderBubble}
                        renderInputToolbar={renderInputToolbar}
                        renderSend={renderSend}
                        renderAvatar={renderAvatar}
                        renderChatFooter={renderAccessory}
                        // @ts-ignore
                        alwaysShowSend
                        placeholder="Type your message..."
                        messagesContainerStyle={styles.messagesContainer}
                        textInputProps={{
                            onFocus: () => setIsInputFocused(true),
                            onBlur: () => setIsInputFocused(false),
                        }}
                    />
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 4,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    messagesContainer: {
        paddingBottom: 20,
    },
    inputContainer: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fff',
        paddingHorizontal: 10,
    },
    sendContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 44,
        width: 44,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    suggestedQuestionsContainer: {
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    suggestedQuestionsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        paddingHorizontal: 15,
    },
    suggestedQuestion: {
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginHorizontal: 5,
    },
    suggestedQuestionText: {
        fontSize: 12,
        color: '#333',
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    menuContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 5,
        marginTop: 60,
        marginRight: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        minWidth: 150,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    menuItemText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },
    historyContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    historyDate: {
        fontSize: 12,
        color: '#888',
        marginBottom: 5,
    },
    historyPreview: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    emptyHistoryText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
        fontStyle: 'italic',
    },
});

export default SupportChat;
