import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { videoService } from '../../services/videoService';

const { width, height } = Dimensions.get('window');

interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
}

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user: UserProfile;
}

interface CommentsSheetProps {
    videoId: string;
    visible: boolean;
    onClose: () => void;
    currentUser: any;
}

// Helper for random light background colors
const getRandomColor = (name: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export default function CommentsSheet({ videoId, visible, onClose, currentUser }: CommentsSheetProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (visible) {
            loadComments();
        }
    }, [visible, videoId]);

    const loadComments = async () => {
        try {
            setLoading(true);
            const data = await videoService.fetchComments(videoId);
            setComments(data);
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!newComment.trim() || !currentUser) return;

        const tempId = Date.now().toString();
        const content = newComment.trim();

        // Optimistic Update
        const optimisticComment: Comment = {
            id: tempId,
            content: content,
            created_at: new Date().toISOString(),
            user: {
                id: currentUser.id,
                first_name: currentUser.user_metadata?.first_name || 'Me',
                last_name: currentUser.user_metadata?.last_name || '',
                avatar_url: currentUser.user_metadata?.avatar_url
            }
        };

        setComments([optimisticComment, ...comments]);
        setNewComment('');
        setSending(true);
        Keyboard.dismiss();

        try {
            await videoService.addComment(videoId, currentUser.id, content);
            // Optionally fetch again to ensure consistency
        } catch (error) {
            console.error("Failed to post comment", error);
            setComments(prev => prev.filter(c => c.id !== tempId));
            alert("Failed to post comment.");
        } finally {
            setSending(false);
        }
    };

    const renderAvatar = (user: UserProfile) => {
        if (user.avatar_url) {
            return (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
            );
        }

        const initial = ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase() || '?';
        const backgroundColor = getRandomColor(user.first_name || 'User');

        return (
            <View style={[styles.avatarFallback, { backgroundColor }]}>
                <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
        );
    };

    const renderItem = ({ item }: { item: Comment }) => (
        <View style={styles.commentItem}>
            <View style={styles.avatarContainer}>
                {renderAvatar(item.user)}
            </View>
            <View style={styles.commentContent}>
                <Text style={styles.username}>
                    {item.user.first_name} {item.user.last_name}
                </Text>
                <Text style={styles.commentText}>{item.content}</Text>
                <View style={styles.commentMeta}>
                    <Text style={styles.timeAgo}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.sheetContainer}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{comments.length} comments</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* Comments List */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#8A2BE2" />
                        </View>
                    ) : (
                        <FlatList
                            data={comments}
                            keyExtractor={item => item.id}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>Be the first to comment!</Text>
                            }
                        />
                    )}

                    {/* Input Area */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Add comment..."
                            placeholderTextColor="#888"
                            value={newComment}
                            onChangeText={setNewComment}
                            multiline
                            maxLength={200}
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!newComment.trim() || sending}
                            style={[
                                styles.sendButton,
                                { opacity: !newComment.trim() ? 0.5 : 1 }
                            ]}
                        >
                            <Ionicons name="arrow-up-circle" size={34} color="#8A2BE2" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdrop: {
        flex: 1,
    },
    sheetContainer: {
        height: height * 0.7,
        backgroundColor: '#fff',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        right: 15,
        top: 15,
        zIndex: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    avatarContainer: {
        marginRight: 10,
    },
    avatarImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ccc',
    },
    avatarFallback: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    commentContent: {
        flex: 1,
        paddingRight: 10,
    },
    username: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 2,
    },
    commentText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
        lineHeight: 18,
    },
    commentMeta: {
        flexDirection: 'row',
        gap: 15,
    },
    timeAgo: {
        fontSize: 12,
        color: '#999',
    },
    replyText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    likeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#888',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#fff',
        paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F5F7',
        borderRadius: 25,
        paddingHorizontal: 18,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 15,
        color: '#000',
        marginRight: 8,
    },
    sendButton: {
        padding: 2,
    },
});
