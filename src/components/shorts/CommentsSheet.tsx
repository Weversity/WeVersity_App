import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    GestureResponderEvent,
    Image,
    Keyboard,
    Modal,
    PanResponder,
    PanResponderGestureState,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { EmojiKeyboard } from 'rn-emoji-keyboard';
import { videoService } from '../../services/videoService';

// Use 'screen' to account for translucent bars and prevent layout jumps
const { height: SCREEN_HEIGHT } = Dimensions.get('screen');
const EMOJI_PANEL_HEIGHT = 320;

interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
}

interface Comment {
    id: string;
    content: string;
    image_url?: string;
    created_at: string;
    user: UserProfile;
    parent_id?: string | null;
}

interface CommentsSheetProps {
    videoId: string;
    videoOwnerId?: string;
    visible: boolean;
    onClose: () => void;
    currentUser: any;
}

const getRandomColor = (name: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export default function CommentsSheet({ videoId, videoOwnerId, visible, onClose, currentUser }: CommentsSheetProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [sending, setSending] = useState(false);

    // States
    const [replyingTo, setReplyingTo] = useState<{ id: string, username: string } | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // Animated value for smooth keyboard/emoji transitions
    const keyboardTranslateY = useRef(new Animated.Value(0)).current;

    const inputRef = useRef<TextInput>(null);
    const flatListRef = useRef<FlatList>(null);

    // Manual Keyboard Listeners with Buffer and Toggle Logic
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const onKeyboardShow = (e: any) => {
            // When keyboard opens, hide emoji picker to prevent overlap
            setShowEmojiPicker(false);
            Animated.timing(keyboardTranslateY, {
                toValue: -e.endCoordinates.height - 12, // Buffer maintained
                duration: Platform.OS === 'ios' ? 250 : 150,
                useNativeDriver: true,
            }).start();
        };

        const onKeyboardHide = () => {
            // FIX: If emoji picker is not opening, reset position to 0
            if (!showEmojiPicker) {
                Animated.timing(keyboardTranslateY, {
                    toValue: 0,
                    duration: Platform.OS === 'ios' ? 250 : 200,
                    useNativeDriver: true,
                }).start();
            }
        };

        const showSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
        const hideSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, [showEmojiPicker]);

    // Transition for Emoji Picker (TikTok style popup)
    useEffect(() => {
        if (showEmojiPicker) {
            Animated.timing(keyboardTranslateY, {
                toValue: -EMOJI_PANEL_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }).start();
        } else {
            // If showEmojiPicker becomes false and keyboard is NOT visible, reset to 0
            // This handles closing the picker manually
            const isKeyboardVisible = Keyboard.isVisible();
            if (!isKeyboardVisible) {
                Animated.timing(keyboardTranslateY, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }).start();
            }
        }
    }, [showEmojiPicker]);

    // Handle standard input focus (Hide emoji panel)
    const handleInputFocus = () => {
        setShowEmojiPicker(false);
    };

    // Toggle Emoji Panel with state matching animation
    const toggleEmojiPicker = () => {
        if (showEmojiPicker) {
            // Close picker -> opens keyboard
            inputRef.current?.focus();
        } else {
            // Open picker -> dismiss keyboard
            Keyboard.dismiss();
            setTimeout(() => {
                setShowEmojiPicker(true);
            }, 150);
        }
    };

    // Restricting PanResponder to handle only
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                return gestureState.dy > 10 && Math.abs(gestureState.dx) < 5;
            },
            onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                if (gestureState.dy > 150) {
                    onClose();
                }
            },
        })
    ).current;

    const organizeComments = (rawList: Comment[]) => {
        const roots = rawList.filter(c => !c.parent_id).sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        const replies = rawList.filter(c => c.parent_id);
        const result: Comment[] = [];

        roots.forEach(root => {
            result.push(root);
            const children = replies
                .filter(r => r.parent_id === root.id)
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            result.push(...children);
        });

        const addedIds = new Set(result.map(r => r.id));
        const orphans = rawList.filter(r => !addedIds.has(r.id));
        result.push(...orphans);

        return result;
    };

    useEffect(() => {
        if (visible) {
            loadComments();
        }
    }, [visible, videoId]);

    const loadComments = async () => {
        try {
            setLoading(true);
            const data = await videoService.fetchComments(videoId);
            setComments(organizeComments(data));
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Permission Denied: We need gallery permissions to post images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleSend = async () => {
        if ((!newComment.trim() && !selectedImage) || !currentUser) return;

        const tempId = Date.now().toString();
        const content = newComment.trim();
        const parentId = replyingTo?.id || null;

        const optimisticComment: Comment = {
            id: tempId,
            content: content,
            image_url: selectedImage || undefined,
            created_at: new Date().toISOString(),
            parent_id: parentId,
            user: {
                id: currentUser.id,
                first_name: currentUser.user_metadata?.first_name || 'Me',
                last_name: currentUser.user_metadata?.last_name || '',
                avatar_url: currentUser.user_metadata?.avatar_url
            }
        };

        setComments(prev => {
            if (parentId) {
                const parentIndex = prev.findIndex(c => c.id === parentId);
                if (parentIndex !== -1) {
                    const newComments = [...prev];
                    let insertionIndex = parentIndex + 1;
                    while (insertionIndex < newComments.length && newComments[insertionIndex].parent_id === parentId) {
                        insertionIndex++;
                    }
                    newComments.splice(insertionIndex, 0, optimisticComment);
                    setTimeout(() => {
                        flatListRef.current?.scrollToIndex({
                            index: insertionIndex,
                            animated: true,
                            viewPosition: 0.5
                        });
                    }, 100);
                    return newComments;
                }
            }
            return [optimisticComment, ...prev];
        });

        setNewComment('');
        const imgToUpload = selectedImage;
        setSelectedImage(null);
        setReplyingTo(null);
        setShowEmojiPicker(false);
        setSending(true);
        Keyboard.dismiss();

        try {
            let uploadedUrl = null;
            if (imgToUpload) {
                uploadedUrl = await videoService.uploadCommentImage(imgToUpload);
            }
            // @ts-ignore
            const savedComment = await videoService.addComment(videoId, currentUser.id, content, parentId, uploadedUrl);
            if (savedComment) {
                setComments(prev => prev.map(c => c.id === tempId ? savedComment : c));
            }
        } catch (error) {
            console.error("Failed to post comment", error);
            setComments(prev => prev.filter(c => c.id !== tempId));
            alert("Failed to post comment.");
        } finally {
            setSending(false);
        }
    };

    const handleEmojiSelect = (emoji: any) => {
        setNewComment(prev => prev + emoji.emoji);
    };

    const handleReply = (commentId: string, username: string, index: number) => {
        setReplyingTo({ id: commentId, username: username });
        setTimeout(() => {
            inputRef.current?.focus();
            if (flatListRef.current && index !== undefined) {
                flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
            }
        }, 100);
    };

    const renderAvatar = (user: UserProfile, isReply: boolean = false) => {
        const avatarStyle = isReply ? styles.avatarImageSmall : styles.avatarImage;
        const fallbackStyle = isReply ? styles.avatarFallbackSmall : styles.avatarFallback;
        const initialStyle = isReply ? styles.avatarInitialSmall : styles.avatarInitial;

        if (user.avatar_url) {
            return <Image source={{ uri: user.avatar_url }} style={avatarStyle} />;
        }
        const initial = ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase() || '?';
        const backgroundColor = getRandomColor(user.first_name || 'User');
        return (
            <View style={[fallbackStyle, { backgroundColor }]}>
                <Text style={initialStyle}>{initial}</Text>
            </View>
        );
    };

    const renderItem = ({ item, index }: { item: Comment, index: number }) => {
        const isReply = !!item.parent_id;
        return (
            <View style={[styles.commentItem, isReply && styles.replyIndentation]}>
                <View style={styles.avatarContainer}>{renderAvatar(item.user, isReply)}</View>
                <View style={styles.commentContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.username}>{item.user.first_name} {item.user.last_name}</Text>
                        {item.user.id === videoOwnerId && <Text style={styles.creatorBadge}> · Creator</Text>}
                    </View>
                    {item.content ? <Text style={styles.commentText}>{item.content}</Text> : null}
                    {item.image_url && <Image source={{ uri: item.image_url }} style={styles.commentImage} resizeMode="cover" />}
                    <View style={styles.commentMeta}>
                        <Text style={styles.timeAgo}>{new Date(item.created_at).toLocaleDateString()}</Text>
                        {!isReply && (
                            <TouchableOpacity onPress={() => handleReply(item.id, `${item.user.first_name} ${item.user.last_name}`, index)}>
                                <Text style={styles.replyText}>Reply</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={() => {
                    setShowEmojiPicker(false);
                    onClose();
                }}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                <View style={styles.sheetContainer}>
                    <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
                        <View style={styles.dragHandle} />
                    </View>

                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{comments.length} comments</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1 }} pointerEvents="auto">
                        {loading ? (
                            <View style={styles.loadingContainer}><ActivityIndicator color="#8A2BE2" /></View>
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                data={comments}
                                keyExtractor={item => item.id}
                                renderItem={renderItem}
                                contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="always"
                                nestedScrollEnabled={true}
                                ListEmptyComponent={
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }}>
                                        <Text style={styles.emptyText}>Be the first to comment!</Text>
                                    </View>
                                }
                                onScrollToIndexFailed={() => { }}
                            />
                        )}
                    </View>

                    {/* Bottom Section with Unified Transform */}
                    <Animated.View style={{ transform: [{ translateY: keyboardTranslateY }] }}>
                        {selectedImage && (
                            <View style={styles.imagePreviewBar}>
                                <View style={styles.previewThumbnailContainer}>
                                    <Image source={{ uri: selectedImage }} style={styles.previewThumbnail} />
                                    <TouchableOpacity style={styles.removeImageButton} onPress={() => setSelectedImage(null)}>
                                        <Ionicons name="close-circle" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {replyingTo && (
                            <View style={styles.replyBar}>
                                <Text style={styles.replyingToText}>Replying to @{replyingTo.username}</Text>
                                <TouchableOpacity onPress={() => setReplyingTo(null)}><Ionicons name="close-circle" size={20} color="#666" /></TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.outerInputContainer}>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    ref={inputRef}
                                    style={styles.input}
                                    placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : "Add comment..."}
                                    placeholderTextColor="#888"
                                    value={newComment}
                                    onChangeText={setNewComment}
                                    multiline
                                    maxLength={200}
                                    onFocus={handleInputFocus}
                                />
                                <View style={styles.inputActions}>
                                    {/* 1. Gallery Icon */}
                                    <TouchableOpacity onPress={pickImage} style={styles.actionIcon}>
                                        <Ionicons name="image-outline" size={24} color="#000" />
                                    </TouchableOpacity>

                                    {/* 2. Emoji Icon (Toggle Logic) */}
                                    <TouchableOpacity onPress={toggleEmojiPicker} style={styles.actionIcon}>
                                        <Ionicons name={showEmojiPicker ? "keypad-outline" : "happy-outline"} size={26} color="#000" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={(!newComment.trim() && !selectedImage) || sending}
                                style={[styles.sendButton, { opacity: (!newComment.trim() && !selectedImage) ? 0.3 : 1 }]}
                            >
                                <Ionicons name="arrow-up-circle" size={42} color="#8A2BE2" />
                            </TouchableOpacity>
                        </View>

                        {/* TikTok Style Emoji Panel */}
                        {showEmojiPicker && (
                            <View style={styles.emojiPickerContainer}>
                                <EmojiKeyboard
                                    onEmojiSelected={handleEmojiSelect}
                                    hideHeader={false}
                                    categoryPosition="top"
                                    enableSearchBar={true}
                                    emojiSize={28}
                                    styles={{
                                        container: {
                                            backgroundColor: '#f8f8f8',
                                            height: EMOJI_PANEL_HEIGHT,
                                            borderTopLeftRadius: 15,
                                            borderTopRightRadius: 15,
                                        },
                                        header: {
                                            backgroundColor: '#f8f8f8',
                                            paddingVertical: 10,
                                        },
                                        searchBar: {
                                            container: {
                                                backgroundColor: '#eee',
                                                marginHorizontal: 15,
                                                borderRadius: 20,
                                            }
                                        }
                                    }}
                                />
                            </View>
                        )}
                    </Animated.View>
                </View>
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
        height: SCREEN_HEIGHT * 0.8,
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        zIndex: 999,
        elevation: 10,
        overflow: 'hidden',
    },
    dragHandleContainer: {
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#eee',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f0f0f0',
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
        top: 0,
        zIndex: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 350, // Ensures last comment is scrollable above panel
        flexGrow: 1,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    replyIndentation: {
        marginLeft: 20,
        marginBottom: 15,
        borderLeftWidth: 1.5,
        borderLeftColor: '#f0f0f0',
        paddingLeft: 12,
        marginTop: -5,
    },
    avatarContainer: {
        marginRight: 10,
    },
    avatarImage: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#f0f0f0',
    },
    avatarImageSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
    },
    avatarFallback: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarFallbackSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    avatarInitialSmall: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 10,
    },
    commentContent: {
        flex: 1,
        paddingRight: 10,
    },
    username: {
        fontSize: 12,
        fontWeight: '700',
        color: '#111',
        marginBottom: 2,
    },
    commentText: {
        fontSize: 14,
        color: '#222',
        marginBottom: 4,
        lineHeight: 18,
    },
    commentImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginTop: 6,
        marginBottom: 8,
        backgroundColor: '#f8f8f8',
    },
    commentMeta: {
        flexDirection: 'row',
        gap: 15,
    },
    timeAgo: {
        fontSize: 12,
        color: '#888',
    },
    replyText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '700',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    },
    imagePreviewBar: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderTopWidth: 0.5,
        borderTopColor: '#f0f0f0',
    },
    previewThumbnailContainer: {
        width: 60,
        height: 60,
        position: 'relative',
    },
    previewThumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 10,
    },
    replyBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderTopWidth: 0.5,
        borderTopColor: '#f0f0f0',
    },
    replyingToText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
    },
    outerInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 15,
        paddingVertical: 12,
        paddingBottom: 30, // Stylish margin maintained
        backgroundColor: '#fff',
        borderTopWidth: 0.5,
        borderTopColor: '#f0f0f0',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 25,
        paddingHorizontal: 15,
        minHeight: 48,
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#111',
        paddingVertical: 10,
        maxHeight: 120,
    },
    inputActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        marginLeft: 15,
    },
    sendButton: {
        marginBottom: 6,
    },
    creatorBadge: {
        fontSize: 11,
        color: '#8A2BE2',
        fontWeight: 'bold',
        marginLeft: 4,
        marginBottom: 2,
    },
    emojiPickerContainer: {
        backgroundColor: '#f8f8f8',
        borderTopWidth: 0.5,
        borderTopColor: '#eee',
    },
});
