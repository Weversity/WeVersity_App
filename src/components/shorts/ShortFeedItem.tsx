import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { RelativePathString, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { videoService } from '../../services/videoService';
import CommentsSheet from './CommentsSheet';

const { width, height } = Dimensions.get('window');

// Biography character limit for showing Read More button
const BIO_CHAR_LIMIT = 60;

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
        occupation?: string; // Map to database 'occupation' field
        biography?: string; // Map to database 'biography' field
    };
}

interface ShortFeedItemProps {
    item: ShortItem;
    isVisible: boolean;
    onRefresh: () => void;
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
    onCommentsVisibilityChange?: (visible: boolean) => void;
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

export default function ShortFeedItem({ item, isVisible, onRefresh, isMuted, setIsMuted, onCommentsVisibilityChange }: ShortFeedItemProps) {
    const router = useRouter();
    const { user } = useAuth();
    const isFocused = useIsFocused(); // Track screen focus

    // Playback State
    const [isPlaying, setIsPlaying] = useState(isVisible);

    // Bio Expansion State
    const [isExpanded, setIsExpanded] = useState(false);

    // Interaction State
    const [likesCount, setLikesCount] = useState(item.likes_count || 0);
    const [commentsCount, setCommentsCount] = useState(item.comments_count || 0);
    const [userReaction, setUserReaction] = useState<'like' | null>(null);

    const [showComments, setShowComments] = useState(false);

    // Coordinate with parent scroll lock
    useEffect(() => {
        onCommentsVisibilityChange?.(showComments);
    }, [showComments]);

    // Animations
    const [likeScale] = useState(new Animated.Value(1));
    const [playIconOpacity] = useState(new Animated.Value(0));

    // Debug: Log instructor data to verify database fields
    useEffect(() => {
        if (item.instructor) {
            console.log('📊 Instructor Data:', {
                id: item.instructor.id,
                name: `${item.instructor.first_name} ${item.instructor.last_name}`,
                occupation: item.instructor.occupation,
                biography: item.instructor.biography,
                hasBiography: !!item.instructor.biography && item.instructor.biography.trim() !== ''
            });
        }
    }, [item.instructor]);

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

    // Toggle Bio Expansion with Video Playback Sync
    const toggleBioExpansion = () => {
        if (!isExpanded) {
            // Expanding bio - PAUSE video
            if (isVideo && player) {
                player.pause();
                setIsPlaying(false);
                Animated.timing(playIconOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            }
        } else {
            // Collapsing bio - RESUME video
            if (isVideo && player && isFocused && isVisible) {
                player.play();
                setIsPlaying(true);
                Animated.timing(playIconOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            }
        }
        setIsExpanded(!isExpanded);
    };

    // CRITICAL: Handle Visibility & Screen Focus (only for videos)
    useEffect(() => {
        if (isVideo && player) {
            // Video must pause if screen is not focused OR item is not visible
            if (isFocused && isVisible) {
                player.play();
                setIsPlaying(true);
                // Fade out play icon
                Animated.timing(playIconOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            } else {
                player.pause();
                setIsPlaying(false);
                // Fade in play icon
                Animated.timing(playIconOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            }
        }
    }, [isFocused, isVisible, player, isVideo]);

    // Handle Mute (only for videos)
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
            Animated.timing(playIconOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else {
            player.play();
            setIsPlaying(true);
            Animated.timing(playIconOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    };

    const toggleMute = () => {
        if (player) {
            player.muted = !isMuted;
        }
        setIsMuted(!isMuted);
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



    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={togglePlay}
                style={styles.videoContainer}
                disabled={showComments}
            >
                {isVideo ? (
                    <>
                        <VideoView
                            player={player}
                            style={styles.video}
                            contentFit="cover"
                            nativeControls={false}
                        />
                        {!isPlaying && (
                            <Animated.View style={[styles.playIconContainer, { opacity: playIconOpacity }]}>
                                <Ionicons name="play" size={50} color="rgba(255,255,255,0.7)" />
                            </Animated.View>
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

            {/* Right Action Buttons - Repositioned to Bottom Right */}
            <View style={styles.rightContainer}>
                {/* Like Button */}
                <TouchableOpacity onPress={() => handleReaction('like')} style={styles.actionButton}>
                    <Animated.View style={styles.iconCircle}>
                        <Ionicons
                            name={userReaction === 'like' ? "heart" : "heart-outline"}
                            size={24}
                            color={userReaction === 'like' ? "#ff2d55" : "white"}
                        />
                    </Animated.View>
                    <Text style={styles.actionText}>{likesCount}</Text>
                </TouchableOpacity>

                {/* Comment Button - No count label */}
                <TouchableOpacity style={styles.actionButton} onPress={() => setShowComments(true)}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="chatbox-ellipses-outline" size={24} color="white" />
                    </View>
                </TouchableOpacity>

                {/* Mute Button - Only show for videos */}
                {isVideo && (
                    <TouchableOpacity onPress={toggleMute} style={styles.actionButton}>
                        <View style={styles.iconCircle}>
                            <Ionicons
                                name={isMuted ? "volume-mute" : "volume-high"}
                                size={24}
                                color="white"
                            />
                        </View>
                        <Text style={styles.actionText}>{isMuted ? 'Mute' : 'Unmute'}</Text>
                    </TouchableOpacity>
                )}
                {/* Reload / Shuffle Button */}
                <TouchableOpacity onPress={onRefresh} style={styles.actionButton}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="sync" size={24} color="white" />
                    </View>
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
                            {item.instructor?.occupation || 'Senior Instructor'}
                        </Text>
                    </View>
                </TouchableOpacity>

                {item.instructor?.biography && item.instructor.biography.trim() !== '' ? (
                    <>
                        <Text style={styles.bioText} numberOfLines={isExpanded ? undefined : 2}>
                            {item.instructor.biography}
                        </Text>
                        {item.instructor.biography.length > BIO_CHAR_LIMIT && (
                            <TouchableOpacity onPress={toggleBioExpansion}>
                                <Text style={styles.readMoreText}>
                                    {isExpanded ? 'Show Less' : 'Read More'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    <Text style={styles.bioText} numberOfLines={2}>
                        No Bio .....
                    </Text>
                )}
            </View>

            {/* Comments Sheet */}
            <CommentsSheet
                videoId={item.id}
                videoOwnerId={item.instructor?.id || item.instructor_id}
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
        right: 16,
        bottom: 40, // Positioned above nav bar
        alignItems: 'center',
        zIndex: 10,
        gap: 16, // Consistent spacing between icon groups
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
        left: 15,
        backgroundColor: '#ff2d55',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButton: {
        alignItems: 'center',
        gap: 4, // Space between icon and label
    },
    iconCircle: {
        width: 45, // Exactly 45px circle
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgba(255, 255, 255, 0.15)', // Modern glassmorphism background
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.3)', // Subtle border for depth
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4, // Stronger shadow for better visibility on white backgrounds
    },
    iconShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.6,
        shadowRadius: 3,
        elevation: 3,
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
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    instructorRole: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
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
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    avatarInitialSmall: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    readMoreText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
        marginTop: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    }
});
