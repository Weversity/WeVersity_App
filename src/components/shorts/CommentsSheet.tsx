import { Ionicons } from '@expo/vector-icons';
import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Keyboard,
    KeyboardEvent,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { EmojiKeyboard } from 'rn-emoji-keyboard';
import { videoService } from '../../services/videoService';

const { height: SCREEN_HEIGHT } = Dimensions.get('screen');
const INITIAL_EMOJI_HEIGHT = Math.round(SCREEN_HEIGHT * 0.38);

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
    likes_count: number;
    user_has_liked: boolean;
}

type CommentListItem = Comment | {
    isToggle: true;
    parentId: string;
    expanded: boolean;
    remainingCount: number;
};

interface CommentsSheetProps {
    videoId: string;
    currentUser: any;
    onClose: () => void;
    onChange?: (index: number) => void;
    animatedIndex?: SharedValue<number>;
    videoOwnerId?: string;
}

const getRandomColor = (name: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const formatCommentTime = (dateString: string) => {
    try {
        if (!dateString) return 'Just now';
        const now = new Date();
        const createdDate = new Date(dateString);
        const diffInSeconds = Math.floor((now.getTime() - createdDate.getTime()) / 1000);
        if (diffInSeconds < 60) return 'Just now';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 48) return 'Yesterday';
        const day = createdDate.getDate();
        const month = createdDate.getMonth() + 1;
        const year = createdDate.getFullYear().toString().slice(-2);
        return `${day}/${month < 10 ? '0' + month : month}/${year}`;
    } catch (e) {
        return 'Just now';
    }
};

const CommentsSheet = forwardRef<BottomSheetModal, CommentsSheetProps>(({ videoId, currentUser, onClose, onChange, animatedIndex, videoOwnerId }, ref) => {
    const [rawComments, setRawComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [sending, setSending] = useState(false);
    const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
    const [replyingTo, setReplyingTo] = useState<{ id: string, username: string } | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [fullImageUri, setFullImageUri] = useState<string | null>(null);
    const [reMountKey, setReMountKey] = useState(0);
    const router = useRouter();

    const snapPoints = useMemo(() => ['75%'], []);
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => ({
        dismiss: () => bottomSheetRef.current?.dismiss(),
        present: () => bottomSheetRef.current?.present(),
    } as any));
    const inputRef = useRef<TextInput>(null);

    const handleDismiss = useCallback(() => {
        setReMountKey(prev => prev + 1);
        onClose();
    }, [onClose]);

    const handleClose = useCallback(() => {
        Keyboard.dismiss();
        bottomSheetRef.current?.dismiss();
    }, []);

    const checkAuth = () => {
        if (!currentUser) {
            Keyboard.dismiss();
            Alert.alert(
                'Login Required',
                'Please login to comment and interact with videos.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Go to Profile',
                        onPress: () => {
                            onClose();
                            router.push('/profile');
                        }
                    }
                ]
            );
            return false;
        }
        return true;
    };

    const [dynamicPadding, setDynamicPadding] = useState(100);
    const keyboardHeightRef = useRef(INITIAL_EMOJI_HEIGHT);
    const isKeyboardVisibleRef = useRef(false);
    const wantsEmojiRef = useRef(false);
    const isEmojiPickerVisibleRef = useRef(false);
    const keyboardTranslateY = useRef(new Animated.Value(0)).current;

    const organizedList = useMemo(() => {
        const roots = rawComments.filter(c => !c.parent_id).sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const replies = rawComments.filter(c => c.parent_id);
        const result: CommentListItem[] = [];

        roots.forEach(root => {
            result.push(root);
            const children = replies
                .filter(r => r.parent_id === root.id)
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            if (children.length === 0) return;
            if (children.length === 1) {
                result.push(children[0]);
                return;
            }

            if (expandedParents.has(root.id)) {
                result.push(...children);
                result.push({ isToggle: true, parentId: root.id, expanded: true, remainingCount: 0 });
            } else {
                result.push(children[0]);
                result.push({ isToggle: true, parentId: root.id, expanded: false, remainingCount: children.length - 1 });
            }
        });
        return result;
    }, [rawComments, expandedParents]);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const onKeyboardShow = (e: KeyboardEvent) => {
            isKeyboardVisibleRef.current = true;
            wantsEmojiRef.current = false;
            keyboardHeightRef.current = e.endCoordinates.height;
            isEmojiPickerVisibleRef.current = false;
            setShowEmojiPicker(false);
            setDynamicPadding(keyboardHeightRef.current + 120);

            Animated.timing(keyboardTranslateY, {
                toValue: -keyboardHeightRef.current - 12,
                duration: Platform.OS === 'ios' ? 250 : 180,
                useNativeDriver: true,
            }).start();
        };

        const onKeyboardHide = () => {
            isKeyboardVisibleRef.current = false;
            if (wantsEmojiRef.current) {
                wantsEmojiRef.current = false;
                isEmojiPickerVisibleRef.current = true;
                setShowEmojiPicker(true);
                setDynamicPadding(keyboardHeightRef.current + 120);
                Animated.timing(keyboardTranslateY, {
                    toValue: -keyboardHeightRef.current,
                    duration: 250,
                    useNativeDriver: true,
                }).start();
            } else if (!isEmojiPickerVisibleRef.current) {
                setDynamicPadding(100);
                Animated.timing(keyboardTranslateY, {
                    toValue: 0,
                    duration: Platform.OS === 'ios' ? 250 : 180,
                    useNativeDriver: true,
                }).start();
            }
        };

        const s1 = Keyboard.addListener(showEvent, onKeyboardShow);
        const s2 = Keyboard.addListener(hideEvent, onKeyboardHide);
        return () => { s1.remove(); s2.remove(); };
    }, []);

    useEffect(() => {
        // Ensure videoId is a string if it's coming from query params
        const idToFetch = Array.isArray(videoId) ? videoId[0] : videoId;

        if (idToFetch) {
            console.log(`🎬 CommentsSheet: Fetching for videoId: ${idToFetch}`);
            setLoading(true);
            videoService.fetchComments(idToFetch, currentUser?.id).then(data => {
                console.log(`🎬 CommentsSheet: Received ${data?.length || 0} comments`);
                setRawComments(data);
                setLoading(false);
            }).catch((err) => {
                console.error('🎬 CommentsSheet: Fetch Error:', err);
                setLoading(false);
            });
        } else {
            console.warn('🎬 CommentsSheet: No videoId provided');
        }
    }, [videoId, currentUser?.id]);

    const toggleEmojiPicker = useCallback(() => {
        if (showEmojiPicker) {
            inputRef.current?.focus();
        } else {
            if (isKeyboardVisibleRef.current) {
                wantsEmojiRef.current = true;
                Keyboard.dismiss();
            } else {
                isEmojiPickerVisibleRef.current = true;
                setShowEmojiPicker(true);
                setDynamicPadding(keyboardHeightRef.current + 120);
                Animated.timing(keyboardTranslateY, { toValue: -keyboardHeightRef.current, duration: 250, useNativeDriver: true }).start();
            }
        }
    }, [showEmojiPicker]);

    const handleSend = async () => {
        if (!checkAuth() || (!newComment.trim() && !selectedImage)) return;

        setSending(true);
        const tempId = Date.now().toString();
        const optimisticComment: Comment = {
            id: tempId,
            content: newComment.trim(),
            created_at: new Date().toISOString(),
            image_url: selectedImage || undefined,
            user: {
                id: currentUser?.id || '',
                first_name: currentUser?.user_metadata?.first_name || 'You',
                last_name: currentUser?.user_metadata?.last_name || '',
                avatar_url: currentUser?.user_metadata?.avatar_url || ''
            },
            likes_count: 0,
            user_has_liked: false
        };

        if (replyingTo) {
            // This part assumes organizedList is a state variable, but it's a useMemo.
            // This will cause a runtime error if not adjusted elsewhere in the code.
            // Applying faithfully as per instructions.
            // setOrganizedList(prev => {
            //     const parentIndex = prev.findIndex(item => !('isToggle' in item) && item.id === replyingTo.id);
            //     if (parentIndex === -1) return prev;
            //     const newList = [...prev];
            //     newList.splice(parentIndex + 1, 0, { ...optimisticComment, parent_id: replyingTo.id });
            //     return newList;
            // });
            // For now, we'll optimistically add to rawComments and let useMemo re-calculate.
            setRawComments(prev => [{ ...optimisticComment, parent_id: replyingTo.id }, ...prev]);
            setExpandedParents(prev => new Set(prev).add(replyingTo.id)); // Ensure parent is expanded
        } else {
            setRawComments(prev => [optimisticComment, ...prev]);
        }

        const currentMessage = newComment;
        const currentImage = selectedImage;
        const currentReplyTo = replyingTo;

        setNewComment('');
        setSelectedImage(null);
        setReplyingTo(null);
        Keyboard.dismiss();

        try {
            let uploadedImageUrl = undefined;
            if (currentImage) {
                console.log('📤 Uploading image for comment...');
                uploadedImageUrl = await videoService.uploadCommentImage(currentImage);

                if (!uploadedImageUrl) {
                    throw new Error('Upload failed: No URL returned from server');
                }
            }

            const savedComment = await videoService.addComment(
                videoId,
                currentUser!.id,
                currentMessage,
                (currentReplyTo?.id as any) || null,
                uploadedImageUrl
            );

            // Update the rawComments with the actual saved comment
            setRawComments(prev => prev.map(item => item.id === tempId ? savedComment : item));
        } catch (error: any) {
            console.error('Failed to send comment:', error);
            // Revert optimistic update if sending fails
            setRawComments(prev => prev.filter(item => item.id !== tempId));
            Alert.alert('Error', error.message || 'Failed to post comment. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        Alert.alert(
            'Delete Comment?',
            'Are you sure you want to remove this comment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        // Optimistic update
                        const originalComments = [...rawComments];
                        setRawComments(prev => prev.filter(c => c.id !== commentId));

                        try {
                            await videoService.deleteComment(commentId);
                        } catch (error: any) {
                            console.error('Failed to delete comment:', error);
                            setRawComments(originalComments);
                            Alert.alert('Error', 'Failed to delete comment. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleToggleLike = async (comment: Comment) => {
        if (!checkAuth()) {
            console.log('🎬 handleToggleLike: Auth check failed');
            return;
        }

        const commentId = comment.id;
        const userId = currentUser?.id;
        const wasLiked = comment.user_has_liked;

        console.log(`🎬 handleToggleLike: Starting for ID: ${commentId}, currently liked: ${wasLiked}`);

        // Optimistic Update
        setRawComments(prev => prev.map(c => {
            if (c.id === commentId) {
                return {
                    ...c,
                    user_has_liked: !wasLiked,
                    likes_count: Math.max(0, (c.likes_count || 0) + (wasLiked ? -1 : 1))
                };
            }
            return c;
        }));

        try {
            if (!userId) throw new Error('User ID is missing');

            const result = await videoService.toggleCommentLike(commentId, userId);
            console.log('🎬 handleToggleLike: Success from server:', result);

            // Sync with actual result from server
            setRawComments(prev => prev.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        user_has_liked: result.liked,
                        likes_count: result.likes_count
                    };
                }
                return c;
            }));
        } catch (error: any) {
            console.error('🎬 handleToggleLike: Error caught:', error.message || error);

            // Revert on error
            setRawComments(prev => prev.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        user_has_liked: wasLiked,
                        likes_count: comment.likes_count
                    };
                }
                return c;
            }));

            Alert.alert(
                'Action Failed',
                'Something went wrong while liking. If this persists, the system might be updating. Please try again.',
                [{ text: 'OK' }]
            );
        }
    };

    const renderItem = ({ item }: { item: CommentListItem }) => {
        if ('isToggle' in item) {
            return (
                <TouchableOpacity onPress={() => setExpandedParents(prev => {
                    const next = new Set(prev);
                    if (next.has(item.parentId)) next.delete(item.parentId);
                    else next.add(item.parentId);
                    return next;
                })} style={styles.toggleRow}>
                    <View style={styles.toggleLine} /><Text style={styles.toggleText}>
                        {item.expanded ? 'Show less' : `View ${item.remainingCount} more replies`}
                    </Text><Ionicons name={item.expanded ? "chevron-up" : "chevron-down"} size={14} color="#888" />
                </TouchableOpacity>
            );
        }
        return (
            <View style={[styles.commentItem, !!item.parent_id && styles.replyIndentation]}>
                <View style={styles.avatarContainer}>
                    {item.user.avatar_url ? (<Image source={{ uri: item.user.avatar_url }} style={!!item.parent_id ? styles.avatarSmall : styles.avatar} />) : (
                        <View style={[!!item.parent_id ? styles.avatarFallbackSmall : styles.avatarFallback, { backgroundColor: getRandomColor(item.user.first_name) }]}>
                            <Text style={styles.avatarInitial}>{item.user.first_name[0]}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.commentContent}>
                    <View style={styles.commentHeaderRow}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.username}>{item.user.first_name} {item.user.last_name}</Text>
                            <Text style={styles.timeLabel}>{formatCommentTime(item.created_at)}</Text>
                        </View>
                        <View style={styles.headerRightGroup}>
                            {(currentUser?.id === item.user.id || currentUser?.id === videoOwnerId) && (
                                <TouchableOpacity
                                    onPress={() => handleDeleteComment(item.id)}
                                    style={styles.deleteButtonHeader}
                                >
                                    <Ionicons name="trash-outline" size={16} color="rgba(255, 77, 77, 0.7)" />
                                </TouchableOpacity>
                            )}
                            <View style={styles.likeContainer}>
                                <TouchableOpacity
                                    onPress={() => handleToggleLike(item as Comment)}
                                    style={styles.likeButton}
                                >
                                    <Ionicons
                                        name={item.user_has_liked ? "heart" : "heart-outline"}
                                        size={18}
                                        color={item.user_has_liked ? "#FF4D4D" : "#888"}
                                    />
                                </TouchableOpacity>
                                <Text style={styles.likeCount}>{item.likes_count || 0}</Text>
                            </View>
                        </View>
                    </View>

                    {item.content ? <Text style={styles.commentText}>{item.content}</Text> : null}
                    {item.image_url && (
                        <TouchableOpacity
                            onPress={() => {
                                setFullImageUri(item.image_url!);
                                setIsModalVisible(true);
                            }}
                            activeOpacity={0.8}
                        >
                            <Image source={{ uri: item.image_url }} style={styles.commentImage} />
                        </TouchableOpacity>
                    )}

                    <View style={styles.commentMeta}>
                        {!item.parent_id && (
                            <TouchableOpacity onPress={() => {
                                if (!checkAuth()) return;
                                setReplyingTo({ id: item.id, username: item.user.first_name });
                                inputRef.current?.focus();
                            }}>
                                <Text style={styles.replyLink}>Reply</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            key={`${videoId}-${reMountKey}`}
            snapPoints={snapPoints}
            animateOnMount={false}
            overDragResistanceFactor={2.5}
            enablePanDownToClose
            enableDynamicSizing={false}
            onDismiss={handleDismiss}
            onChange={onChange}
            animatedIndex={animatedIndex}
            handleIndicatorStyle={styles.dragHandle}
            backgroundStyle={styles.sheetBackground}
        >
            <View style={{ flex: 1 }} pointerEvents="box-none">
                <View style={styles.header}>
                    <View style={{ width: 40 }} />
                    <Text style={styles.headerTitle}>{rawComments.length} comments</Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        onPress={handleClose}
                    >
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                    {loading ? <ActivityIndicator style={{ marginTop: 50 }} color="#8A2BE2" /> : (
                        <BottomSheetFlatList
                            data={organizedList}
                            keyExtractor={(item: CommentListItem, index: number) => 'isToggle' in item ? `toggle-${item.parentId}-${index}` : item.id}
                            renderItem={renderItem}
                            contentContainerStyle={[styles.listContent, { paddingBottom: dynamicPadding }]}
                            keyboardShouldPersistTaps="always"
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>

                <View style={styles.interactionWrapper}>
                    <Animated.View style={[styles.inputLiftWrapper, { transform: [{ translateY: keyboardTranslateY }] }]}>
                        {replyingTo && (
                            <View style={styles.replyBar}>
                                <Text style={styles.replyingToText}>Replying to @{replyingTo.username}</Text>
                                <TouchableOpacity onPress={() => setReplyingTo(null)}><Ionicons name="close-circle" size={20} color="#666" /></TouchableOpacity>
                            </View>
                        )}
                        {selectedImage && (
                            <View style={styles.imagePreviewWrapper}>
                                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => setSelectedImage(null)}
                                >
                                    <Ionicons name="close-circle" size={24} color="rgba(0,0,0,0.6)" />
                                </TouchableOpacity>
                                {sending && (
                                    <View style={styles.uploadOverlay}>
                                        <ActivityIndicator color="#fff" />
                                    </View>
                                )}
                            </View>
                        )}
                        <View style={styles.outerInputContainer}>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    ref={inputRef}
                                    style={styles.input}
                                    placeholder="Add comment..."
                                    placeholderTextColor="#888"
                                    value={newComment}
                                    onChangeText={setNewComment}
                                    onFocus={() => {
                                        if (!checkAuth()) return;
                                        wantsEmojiRef.current = false;
                                    }}
                                    multiline
                                    autoCorrect={false}
                                    spellCheck={false}
                                    autoCapitalize="none"
                                    keyboardType="default"
                                />
                                <View style={styles.inputActions}>
                                    <TouchableOpacity onPress={async () => {
                                        const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
                                        if (!res.canceled) setSelectedImage(res.assets[0].uri);
                                    }} style={styles.actionIcon}><Ionicons name="image-outline" size={24} color="#000" /></TouchableOpacity>
                                    <TouchableOpacity onPress={toggleEmojiPicker} style={styles.actionIcon}>
                                        <Ionicons name={showEmojiPicker ? "keypad-outline" : "happy-outline"} size={26} color="#000" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleSend} disabled={sending}>
                                {sending ? (
                                    <ActivityIndicator size="small" color="#8A2BE2" style={{ marginHorizontal: 10 }} />
                                ) : (
                                    <Ionicons name="arrow-up-circle" size={42} color={newComment.trim() || selectedImage ? "#8A2BE2" : "#ccc"} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {showEmojiPicker && (
                        <View style={[styles.emojiAreaStable, { height: keyboardHeightRef.current }]}>
                            <EmojiKeyboard
                                onEmojiSelected={(e) => setNewComment(p => p + e.emoji)}
                                hideHeader={false} categoryPosition="top" enableSearchBar={true}
                                styles={{
                                    container: { backgroundColor: '#f8f8f8', height: keyboardHeightRef.current, borderTopLeftRadius: 15, borderTopRightRadius: 15 },
                                    searchBar: { container: { backgroundColor: '#eee', marginHorizontal: 15, borderRadius: 20 } }
                                }}
                            />
                        </View>
                    )}
                </View>
            </View>

            {/* Full Screen Image Modal */}
            <Modal visible={isModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setIsModalVisible(false)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="close-circle" size={40} color="white" />
                    </TouchableOpacity>
                    <Image
                        source={{ uri: fullImageUri || '' }}
                        style={styles.fullScreenImage}
                        resizeMode="contain"
                    />
                </View>
            </Modal>
        </BottomSheetModal>
    );
});

export default CommentsSheet;

const styles = StyleSheet.create({
    sheetBackground: { borderRadius: 25 },
    dragHandle: { width: 40, backgroundColor: '#eee' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f0f0f0',
        zIndex: 100,
        backgroundColor: '#fff',
    },
    headerTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', flex: 1, textAlign: 'center' },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: { padding: 16 },
    commentItem: { flexDirection: 'row', marginBottom: 20 },
    replyIndentation: { marginLeft: 44 },
    avatarContainer: { marginRight: 10 },
    avatar: { width: 34, height: 34, borderRadius: 17 },
    avatarSmall: { width: 24, height: 24, borderRadius: 12 },
    avatarFallback: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
    avatarFallbackSmall: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { color: '#fff', fontWeight: 'bold' },
    commentContent: { flex: 1 },
    commentHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    username: { fontSize: 13, fontWeight: '700', color: '#111' },
    timeLabel: { fontSize: 11, color: '#888', marginLeft: 2 },
    headerRightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    likeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
    },
    likeButton: {
        padding: 0,
    },
    likeCount: {
        fontSize: 10,
        color: '#888',
        marginTop: -3,
        fontWeight: '500',
    },
    deleteButtonHeader: {
        padding: 4,
    },
    commentText: { fontSize: 14, color: '#222', marginTop: 1, lineHeight: 18 },
    commentImage: { width: '100%', height: 200, borderRadius: 12, marginTop: 10 },
    commentMeta: { flexDirection: 'row', gap: 15, marginTop: 5 },
    replyLink: { fontSize: 12, color: '#888', fontWeight: '700' },
    toggleRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 44, marginBottom: 20, gap: 8 },
    toggleLine: { width: 20, height: 1, backgroundColor: '#eee' },
    toggleText: { fontSize: 12, color: '#888', fontWeight: 'bold' },
    interactionWrapper: { backgroundColor: '#fff', zIndex: 10 },
    inputLiftWrapper: { backgroundColor: '#fff', zIndex: 11 },
    emojiAreaStable: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#f8f8f8', zIndex: 50 },
    replyBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#f9f9f9', borderTopWidth: 0.5, borderTopColor: '#f0f0f0' },
    replyingToText: { fontSize: 12, color: '#333' },
    outerInputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 15, paddingVertical: 12, paddingBottom: 30, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#f0f0f0' },
    imagePreviewWrapper: {
        width: 80,
        height: 80,
        marginLeft: 15,
        marginBottom: 10,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ddd',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 12,
    },
    uploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 25, paddingHorizontal: 15, marginRight: 10, minHeight: 48 },
    input: { flex: 1, fontSize: 15, color: '#111', paddingVertical: 10, maxHeight: 120 },
    inputActions: { flexDirection: 'row', alignItems: 'center' },
    actionIcon: { marginLeft: 15 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        zIndex: 10,
    },
    fullScreenImage: {
        width: '100%',
        height: '100%',
    }
});
