import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Conversation } from './types';

interface ChatHeaderMenuProps {
    conversations: Conversation[];
    onSelectConversation: (id: string) => void;
    onNewChat: () => void;
    onDeleteConversation?: (id: string) => void;
}

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

const ChatHeaderMenu: React.FC<ChatHeaderMenuProps> = ({
    conversations,
    onSelectConversation,
    onNewChat,
    onDeleteConversation
}) => {
    const [visible, setVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: -DRAWER_WIDTH,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: -DRAWER_WIDTH,
            duration: 250,
            useNativeDriver: true,
        }).start(() => setVisible(false));
    };

    const handleSelect = (id: string) => {
        onSelectConversation(id);
        handleClose();
    };

    const handleNewChat = () => {
        onNewChat();
        handleClose();
    };

    return (
        <View>
            <TouchableOpacity onPress={() => setVisible(true)} style={styles.menuIcon}>
                <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>

            <Modal
                transparent
                visible={visible}
                animationType="none"
                onRequestClose={handleClose}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={handleClose}
                    />

                    <Animated.View
                        style={[
                            styles.drawerContainer,
                            { transform: [{ translateX: slideAnim }] }
                        ]}
                    >
                        <View style={styles.drawerHeader}>
                            <Text style={styles.drawerTitle}>WeVersity AI</Text>
                            <TouchableOpacity onPress={handleClose}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.menuItem} onPress={handleNewChat}>
                            <Ionicons name="add-circle-outline" size={24} color="#8A2BE2" />
                            <Text style={styles.menuText}>New Chat</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <Text style={styles.historyTitle}>Recents</Text>
                        <FlatList
                            data={conversations}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.historyItemContainer}>
                                    <TouchableOpacity
                                        style={styles.historyItem}
                                        onPress={() => handleSelect(item.id)}
                                    >
                                        <Text style={styles.historyText} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        <Text style={styles.historyDate}>
                                            {new Date(item.updatedAt).toLocaleDateString()}
                                        </Text>
                                    </TouchableOpacity>
                                    {onDeleteConversation && (
                                        <TouchableOpacity
                                            style={styles.deleteIcon}
                                            onPress={() => onDeleteConversation(item.id)}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#ff4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No history yet</Text>
                            }
                            style={styles.historyList}
                        />
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    menuIcon: {
        padding: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
    },
    backdrop: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    drawerContainer: {
        width: DRAWER_WIDTH,
        height: '100%',
        backgroundColor: '#fff',
        padding: 20,
        paddingTop: 60,
        elevation: 16,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    drawerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    drawerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#8A2BE2',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        backgroundColor: '#f6f0ff',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 10,
    },
    menuText: {
        fontSize: 16,
        marginLeft: 12,
        color: '#333',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 15,
    },
    historyTitle: {
        fontSize: 14,
        color: '#999',
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    historyList: {
        flexGrow: 1,
    },
    historyItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f0f0f0',
    },
    historyItem: {
        flex: 1,
    },
    historyText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    historyDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    deleteIcon: {
        padding: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#ccc',
        textAlign: 'center',
        marginTop: 40,
    },
});

export default ChatHeaderMenu;

