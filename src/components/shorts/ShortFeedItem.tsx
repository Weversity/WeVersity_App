import { Ionicons } from '@expo/vector-icons';
import { RelativePathString, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Image, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { videoService } from '../../services/videoService';
import CommentsSheet from './CommentsSheet';

const { width, height } = Dimensions.get('window');

interface ShortItem {
    id: string;
    video_url: string;
    type?: 'image' | 'video'; // Added type field
    likes_count: number;
    comments_count?: number;
    description?: string;
    instructor_id?: string;
    instructor?: {
        id: string;
        first_name?: string;
        last_name?: string;
        avatar_url?: string;
        role?: string;
        bio?: string;
    };
}

interface ShortFeedItemProps {
    item: ShortItem;
    isVisible: boolean;
    onRefresh: () => void;
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
}

const getRandomColor = (name: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const getInitials = (firstName?: string, lastName?: string) => {
    return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '?';
};

export default function ShortFeedItem({ item, isVisible, onRefresh, isMuted, setIsMuted }: ShortFeedItemProps) {
    const router = useRouter();
    const { user } = useAuth();

    // Playback State
    const [isPlaying, setIsPlaying] = useState(isVisible);

    // Interaction State
    const [likesCount, setLikesCount] = useState(item.likes_count || 0);
    const [commentsCount, setCommentsCount] = useState(item.comments_count || 0);
    const [userReaction, setUserReaction] = useState<'like' | null>(null);

    const [showComments, setShowComments] = useState(false);

    // Animations
    const [likeScale] = useState(new Animated.Value(1));

    // Detect media type
    const getMediaType = (): 'image' | 'video' => {
        // First check if type is explicitly set
        if (item.type) return item.type;

        // Fallback: detect from file extension
        const url = item.video_url.toLowerCase();
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const isImage = imageExtensions.some(ext => url.includes(ext));
        return isImage ? 'image' : 'video';
    };

    const mediaType = getMediaType();
    const isVideo = mediaType === 'video';

    // Initialize Player (only for videos)
    const player = useVideoPlayer(isVideo ? item.video_url : '', player => {
        if (isVideo) {
            player.loop = true;
            player.muted = isMuted;
        }
    });

    // Handle Visibility & Mute (only for videos)
    useEffect(() => {
        if (isVideo && player) {
            if (isVisible) {
                player.play();
            } else {
                player.pause();
            }
            setIsPlaying(isVisible);
        }
    }, [isVisible, player, isVideo]);

    useEffect(() => {
        if (isVideo && player) {
            player.muted = isMuted;
        }
    }, [isMuted, player, isVideo]);

    // Check User Reaction on Mount
    useEffect(() => {
        if (user && item.id) {
            checkUserReaction();
        }
    }, [user, item.id]);

    const checkUserReaction = async () => {
        if (!user) return;
        const reaction = await videoService.getUserReaction(item.id, user.id);
        setUserReaction(reaction);
    };

    const togglePlay = () => {
        if (!isVideo) return; // Images don't play
        if (player.playing) {
            player.pause();
            setIsPlaying(false);
        } else {
            player.play();
            setIsPlaying(true);
        }
    };

    const toggleMute = () => {
        const nextMutedState = !isMuted;

        // 1. Update the local player object immediately for instant sound reaction
        if (player) {
            player.muted = nextMutedState;
        }

        // 2. Update the parent state to sync the UI (Icon/Text) and other items
        setIsMuted(nextMutedState);
    };

    const handleProfilePress = () => {
        if (item.instructor?.id) {
            router.push(`/viewProfile/${item.instructor.id}` as RelativePathString);
        } else if (item.instructor_id) {
            router.push(`/viewProfile/${item.instructor_id}` as RelativePathString);
        }
    };

    const handleReaction = async (type: 'like') => {
        if (!user) return; // Only allow likes

        // Animation for Like
        Animated.sequence([
            Animated.timing(likeScale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
            Animated.timing(likeScale, { toValue: 1, duration: 100, useNativeDriver: true })
        ]).start();

        try {
            // Call RPC
            const result = await videoService.handleReaction(item.id, user.id, type);

            // Update State from RPC Result
            setLikesCount(result.likes);
            setUserReaction(result.user_reaction);

        } catch (error) {
            console.error("Reaction failed", error);
        }
    };

    const handleShare = async () => {
        try {
            const shareUrl = `https://weversity.org/shorts/${item.id}`;
            await Share.share({
                message: `Check out this short on WeVersity: ${shareUrl}`,
                url: shareUrl, // iOS only
            });
        } catch (error) {
            console.error("Share failed", error);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity activeOpacity={1} onPress={togglePlay} style={styles.videoContainer}>
                {isVideo ? (
                    <>
                        <VideoView
                            player={player}
                            style={styles.video}
                            contentFit="cover"
                            nativeControls={false}
                        />
                        {!isPlaying && (
                            <View style={styles.playIconContainer}>
                                <Ionicons name="play" size={50} color="rgba(255,255,255,0.7)" />
                            </View>
                        )}
                    </>
                ) : (
                    <Image
                        source={{ uri: item.video_url }}
                        style={styles.video}
                        resizeMode="cover"
                    />
                )}
            </TouchableOpacity>

            {/* Mute Button removed from here, moved to rightContainer */}

            {/* Right Action Buttons */}
            <View style={styles.rightContainer}>
                {/* Profile icon above Like button removed */}

                {/* Like Button */}
                <TouchableOpacity onPress={() => handleReaction('like')} style={styles.actionButton}>
                    <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                        <Ionicons
                            name={userReaction === 'like' ? "heart" : "heart-outline"}
                            size={35}
                            color={userReaction === 'like' ? "#ff2d55" : "white"}
                        />
                    </Animated.View>
                    <Text style={styles.actionText}>{likesCount}</Text>
                </TouchableOpacity>

                {/* Comment Button */}
                <TouchableOpacity style={[styles.actionButton, { marginBottom: 28, marginTop: 10 }]} onPress={() => setShowComments(true)}>
                    <Ionicons name="chatbox-ellipses-outline" size={32} color="white" />
                </TouchableOpacity>

                {/* Mute Button - Only show for videos */}
                {isVideo && (
                    <TouchableOpacity onPress={toggleMute} style={styles.actionButton}>
                        <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={32} color="white" />
                        <Text style={styles.actionText}>{isMuted ? 'Mute' : 'Unmute'}</Text>
                    </TouchableOpacity>
                )}

                {/* Share Button */}
                <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                    <Ionicons name="share-social-outline" size={32} color="white" />
                    <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>

                {/* Reload / Shuffle Button */}
                <TouchableOpacity onPress={onRefresh} style={styles.actionButton}>
                    <Ionicons name="sync" size={32} color="white" />
                    <Text style={styles.actionText}>Reload</Text>
                </TouchableOpacity>
            </View>

            {/* Redesigned Bottom Info Section */}
            <View style={styles.bottomOverlayCard}>
                <TouchableOpacity onPress={handleProfilePress} style={styles.profileRow}>
                    {item.instructor?.avatar_url ? (
                        <Image source={{ uri: item.instructor.avatar_url }} style={styles.overlayAvatar} />
                    ) : (
                        <View style={[
                            styles.overlayAvatar,
                            styles.avatarPlaceholder,
                            { backgroundColor: getRandomColor(item.instructor?.first_name || 'Instructor') }
                        ]}>
                            <Text style={styles.avatarInitialSmall}>
                                {getInitials(item.instructor?.first_name, item.instructor?.last_name)}
                            </Text>
                        </View>
                    )}
                    <View style={styles.nameContainer}>
                        <Text style={styles.instructorName}>
                            {item.instructor?.first_name || 'Instructor'} {item.instructor?.last_name || ''}
                        </Text>
                        <Text style={styles.instructorRole}>
                            Senior Instructor
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Yellow badge removed */}

                {item.instructor?.bio ? (
                    <Text style={styles.bioText} numberOfLines={3}>
                        {item.instructor.bio}
                    </Text>
                ) : (
                    <Text style={styles.bioText} numberOfLines={3}>
                        Select which contact details should we use to reset your password
                    </Text>
                )}
            </View>

            {/* Comments Sheet */}
            <CommentsSheet
                videoId={item.id}
                visible={showComments}
                onClose={() => setShowComments(false)}
                currentUser={user}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width,
        height: '100%',
        backgroundColor: 'black',
    },
    videoContainer: {
        width: '100%',
        height: '100%',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    playIconContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -25 }, { translateY: -25 }],
    },
    rightContainer: {
        position: 'absolute',
        right: 10,
        bottom: 100, // Above bottom gradient
        alignItems: 'center',
        zIndex: 10
    },
    profileContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    plusIcon: {
        position: 'absolute',
        bottom: -10,
        left: 15, // Center horizontally relative to avatar
        backgroundColor: '#ff2d55',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButton: {
        alignItems: 'center',
        marginBottom: 15,
    },
    actionText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 5,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    bottomOverlayCard: {
        position: 'absolute',
        bottom: 20,
        left: 15,
        backgroundColor: 'transparent',
        borderRadius: 16,
        padding: 0, // Reduced padding since background is gone
        maxWidth: '72%',
        zIndex: 10,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    overlayAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#fff',
        marginRight: 10,
    },
    nameContainer: {
        justifyContent: 'center',
    },
    instructorName: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    instructorRole: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    badgeContainer: {
        marginBottom: 8,
    },
    badgeText: {
        color: '#FFD700',
        fontWeight: '600',
        fontSize: 13,
    },
    bioText: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 20,
    },
    avatarInitialSmall: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    }
});
