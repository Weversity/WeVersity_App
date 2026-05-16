import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Slider from '@react-native-community/slider';
import { useIsFocused } from '@react-navigation/native';
import { RelativePathString, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react';
import { Alert, Dimensions, Image, Animated as RNAnimated, Share, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Pressable } from 'react-native';
import Animated, { Extrapolate, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useAuth } from '../../../src/context/AuthContext';
import { videoService } from '../../services/videoService';
import { HapticsService } from '../../utils/haptics';
import CommentsSheet from './CommentsSheet';
import ShortMediaFrame from './ShortMediaFrame';
import FloatingRewardCoin from './FloatingRewardCoin';
import { TapGestureHandler, State } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BIO_CHAR_LIMIT = 60;

interface ShortItem {
    id: string;
    video_url: string;
    type?: 'image' | 'video';
    likes_count: number;
    comments_count?: number;
    description?: string;
    instructor_id?: string;
    instructor?: {
        id: string;
        first_name?: string;
        last_name?: string;
        avatar_url?: string;
        occupation?: string;
        biography?: string;
    };
}

interface ShortFeedItemProps {
    item: ShortItem;
    isVisible: boolean;
    shouldLoad: boolean;
    onRefresh: () => void;
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
    onCommentsVisibilityChange?: (visible: boolean) => void;
    containerHeight?: number;
    containerWidth?: number;
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

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ─── PROGRESS BAR COMPONENT ──────────────────────────────────────────
const ShortProgressBar = memo(({ player, isVisible }: { player: any, isVisible: boolean }) => {
    const [currentTime, setCurrentTime] = useState(0);
    const isDraggingRef = useRef(false);
    const initiallyPlayingRef = useRef(false);

    useEffect(() => {
        if (!isVisible || !player) return;
        const interval = setInterval(() => {
            if (player.duration > 0 && !isDraggingRef.current) {
                setCurrentTime(player.currentTime);
            }
        }, 250);
        return () => clearInterval(interval);
    }, [player, isVisible]);

    if (!isVisible || !player) return null;

    return (
        <View style={styles.progressWrapper}>
            <View style={styles.timeLabelContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.timeText}>{formatTime(player.duration || 0)}</Text>
            </View>
            <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={player.duration || 1}
                value={currentTime}
                onSlidingStart={() => {
                    isDraggingRef.current = true;
                    initiallyPlayingRef.current = player.playing;
                    player.pause();
                }}
                onValueChange={(value) => {
                    player.currentTime = value;
                    setCurrentTime(value);
                }}
                onSlidingComplete={(value) => {
                    isDraggingRef.current = false;
                    player.currentTime = value;
                    if (initiallyPlayingRef.current) player.play();
                }}
                minimumTrackTintColor="#8A2BE2"
                maximumTrackTintColor="rgba(255,255,255,0.25)"
                thumbTintColor="white"
            />
        </View>
    );
});

// ─── VIDEO PLAYER WRAPPER ───────────────────────────────────────────
const VideoPlayerWrapper = memo(({ 
    videoUrl, 
    isVisible, 
    isMuted, 
    isFocused, 
    onPlayerReady
}: { 
    videoUrl: string, 
    isVisible: boolean, 
    isMuted: boolean, 
    isFocused: boolean,
    containerWidth: number,
    containerHeight: number,
    onPlayerReady: (player: any) => void
}) => {
    const [isPlaying, setIsPlaying] = useState(isVisible);
    const [hasError, setHasError] = useState(false);
    const [iconOpacity] = useState(new RNAnimated.Value(0));
    const [showIcon, setShowIcon] = useState(false);

    const player = useVideoPlayer(videoUrl, (p) => {
        p.loop = true;
        p.muted = isMuted;
        // Pro Optimization: Dynamic Buffering based on visibility
        const isCurrentlyVisible = isVisible && isFocused;
        p.timeUpdateEventInterval = 0.25;
        p.showNowPlayingNotification = false;
        
        if ('bufferOptions' in p) {
            (p as any).bufferOptions = {
                // Active video gets 6s buffer for stability, neighbors get 2s to save RAM
                preferredForwardBufferDuration: isCurrentlyVisible ? 6 : 2,
                waitsToMinimizeStalling: isCurrentlyVisible,
            };
        } else {
            (p as any).waitsToMinimizeStalling = isCurrentlyVisible;
        }

        p.addListener('statusChange', (status: any) => {
            if (status === 'error') {
                setHasError(true);
                HapticsService.error();
            }
        });
    });

    useEffect(() => {
        if (player.status === 'error') {
            setHasError(true);
            HapticsService.error();
        }
    }, [player.status]);

    useEffect(() => {
        if (player) {
            onPlayerReady(player);
            return () => onPlayerReady(null);
        }
    }, [player, onPlayerReady]);

    useEffect(() => {
        if (isFocused && isVisible) {
            player.play();
            setIsPlaying(true);
            setShowIcon(false);
            RNAnimated.timing(iconOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        } else {
            player.pause();
            setIsPlaying(false);
            setShowIcon(true);
            RNAnimated.timing(iconOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        }
    }, [isFocused, isVisible, player]);

    useEffect(() => {
        player.muted = isMuted;
    }, [isMuted, player]);

    const onTapGestureEvent = (event: any) => {
        if (event.nativeEvent.state === State.ACTIVE) {
            if (!player) return;
            HapticsService.success(); // Instant feedback

            if (player.playing) {
                player.pause();
                setIsPlaying(false);
                setShowIcon(true);
                RNAnimated.timing(iconOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
            } else {
                player.play();
                setIsPlaying(true);
                RNAnimated.timing(iconOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
                    setShowIcon(false);
                });
            }
        }
    };

    if (hasError) {
        return (
            <View style={styles.errorContainer}>
                <MaterialIcons name="lock-outline" size={80} color="rgba(255,255,255,0.4)" />
                <Text style={styles.errorHeading}>Content Removed by Admin</Text>
                <Text style={styles.errorSubHeading}>This video was removed due to a violation of our privacy and safety guidelines.</Text>
            </View>
        );
    }

    return (
        <View 
            style={{ flex: 1, width: '100%', height: '100%' }}
            renderToHardwareTextureAndroid={true}
        >
            <TapGestureHandler onHandlerStateChange={onTapGestureEvent}>
                <View style={StyleSheet.absoluteFillObject}>
                    {/* Layer 0: The Video (Passthrough) */}
                    <VideoView 
                        player={player} 
                        style={StyleSheet.absoluteFillObject} 
                        contentFit="contain" 
                        nativeControls={false} 
                        pointerEvents="none" 
                    />
                    
                    {/* Instant Center Pause/Play Status Overlays */}
                    {showIcon && (
                        <RNAnimated.View style={[styles.playIconContainer, { opacity: iconOpacity, zIndex: 20 }]}>
                            <Ionicons name="pause" size={55} color="rgba(255,255,255,0.75)" />
                        </RNAnimated.View>
                    )}
                </View>
            </TapGestureHandler>
        </View>
    );
});

// ─── MAIN COMPONENT ──────────────────────────────────────────────────
const ShortFeedItem = ({
    item,
    isVisible,
    shouldLoad,
    onRefresh,
    isMuted,
    setIsMuted,
    onCommentsVisibilityChange,
    containerHeight = SCREEN_HEIGHT,
    containerWidth = SCREEN_WIDTH
}: ShortFeedItemProps) => {
    const router = useRouter();
    const { user } = useAuth();
    const isFocused = useIsFocused();

    const [isExpanded, setIsExpanded] = useState(false);
    const [likesCount, setLikesCount] = useState(item.likes_count || 0);
    const [userReaction, setUserReaction] = useState<'like' | null>(null);
    const [showComments, setShowComments] = useState(false);
    const [activePlayer, setActivePlayer] = useState<any>(null);

    const sheetRef = useRef<BottomSheetModal>(null);
    const animatedIndex = useSharedValue<number>(-1);

    // Existing Reanimated Styles (Preserved)
    const videoAnimatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(animatedIndex.value, [-1, 0], [1, 0.75], Extrapolate.CLAMP);
        const translateY = interpolate(animatedIndex.value, [-1, 0], [0, -containerHeight * 0.4], Extrapolate.CLAMP);
        const borderRadius = interpolate(animatedIndex.value, [-1, 0], [0, 20], Extrapolate.CLAMP);
        return { transform: [{ scale }, { translateY }], borderRadius, overflow: 'hidden' };
    });

    const uiAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(animatedIndex.value, [-1, -0.8], [1, 0], Extrapolate.CLAMP);
        return { opacity, pointerEvents: animatedIndex.value > -0.9 ? 'none' : 'auto' };
    });

    useEffect(() => {
        onCommentsVisibilityChange?.(showComments);
    }, [showComments, onCommentsVisibilityChange]);

    const [likeScale] = useState(new RNAnimated.Value(1));

    const mediaType = useMemo(() => {
        if (item.type) return item.type;
        const url = item.video_url.toLowerCase();
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        return imageExtensions.some(ext => url.includes(ext)) ? 'image' : 'video';
    }, [item.video_url, item.type]);

    const isVideo = mediaType === 'video';

    const checkUserReaction = useCallback(async () => {
        if (!user) return;
        const reaction = await videoService.getUserReaction(item.id, user.id);
        setUserReaction(reaction);
    }, [user, item.id]);

    useEffect(() => {
        if (user && item.id) checkUserReaction();
    }, [user, item.id, checkUserReaction]);

    const toggleBioExpansion = () => {
        if (!isExpanded && isVideo && activePlayer) {
            activePlayer.pause();
        } else if (isExpanded && isVideo && activePlayer && isFocused && isVisible) {
            activePlayer.play();
        }
        setIsExpanded(!isExpanded);
    };

    const toggleMute = () => {
        if (activePlayer) activePlayer.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleProfilePress = () => {
        const id = item.instructor?.id || item.instructor_id;
        if (id) router.push(`/viewProfile/${id}` as RelativePathString);
    };

    const handleReaction = async (type: 'like') => {
        if (!user) {
            Alert.alert('Login Required', 'Please login to interact with videos.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Go to Profile', onPress: () => router.push('/profile') }]);
            return;
        }
        HapticsService.success();
        RNAnimated.sequence([
            RNAnimated.timing(likeScale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
            RNAnimated.timing(likeScale, { toValue: 1, duration: 100, useNativeDriver: true })
        ]).start();
        try {
            const result = await videoService.handleReaction(item.id, user.id, type);
            setLikesCount(result.likes);
            setUserReaction(result.user_reaction);
        } catch (error) { console.error("Reaction failed", error); }
    };

    const handleShare = async () => {
        try {
            await Share.share({ message: `Check out this WeVersity Short!\nhttps://weversity.org/shorts/${item.id}` });
        } catch (error: any) { console.error("Error sharing:", error.message); }
    };

    // Fix: Memoize callback to prevent re-renders
    const onPlayerReady = useCallback((player: any) => {
        setActivePlayer(player);
    }, []);

    // Fix: Handle lazy-loading modal presentation
    const openComments = () => {
        setShowComments(true);
        // We use a small timeout to allow React to mount the CommentsSheet 
        // before we call present() on its ref.
        setTimeout(() => {
            sheetRef.current?.present();
        }, 100);
    };

    return (
        <View style={[styles.container, { height: containerHeight, width: containerWidth, backgroundColor: 'black' }]}>
            <Animated.View style={[{ width: containerWidth, height: containerHeight, position: 'absolute', top: 0, left: 0, zIndex: 1 }, videoAnimatedStyle]}>
                <ShortMediaFrame containerWidth={containerWidth} containerHeight={containerHeight}>
                    {isVideo ? (
                        shouldLoad ? (
                            <VideoPlayerWrapper 
                                videoUrl={item.video_url}
                                isVisible={isVisible}
                                isMuted={isMuted}
                                isFocused={isFocused}
                                containerWidth={containerWidth}
                                containerHeight={containerHeight}
                                onPlayerReady={onPlayerReady}
                            />
                        ) : (
                            <View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
                                <Image source={{ uri: item.video_url }} style={styles.video} resizeMode="contain" />
                                <ActivityIndicator size="small" color="#8A2BE2" style={{ position: 'absolute' }} />
                            </View>
                        )
                    ) : (
                        <Image source={{ uri: item.video_url }} style={[styles.video, { height: '100%' }]} resizeMode="contain" />
                    )}
                </ShortMediaFrame>
            </Animated.View>

            <Animated.View style={[styles.bottomUIContainer, uiAnimatedStyle]}>
                <View style={styles.bottomOverlayCard}>
                    <TouchableOpacity onPress={handleProfilePress} style={styles.profileRow}>
                        {item.instructor?.avatar_url ? (
                            <Image source={{ uri: item.instructor.avatar_url }} style={styles.overlayAvatar} />
                        ) : (
                            <View style={[styles.overlayAvatar, styles.avatarPlaceholder, { backgroundColor: getRandomColor(item.instructor?.first_name || 'Instructor') }]}>
                                <Text style={styles.avatarInitialSmall}>{getInitials(item.instructor?.first_name, item.instructor?.last_name)}</Text>
                            </View>
                        )}
                        <View style={styles.nameContainer}>
                            <Text style={styles.instructorName}>{item.instructor?.first_name || 'Instructor'} {item.instructor?.last_name || ''}</Text>
                            <Text style={styles.instructorRole}>{item.instructor?.occupation || 'Senior Instructor'}</Text>
                        </View>
                    </TouchableOpacity>

                    {item.instructor?.biography && item.instructor.biography.trim() !== '' ? (
                        <>
                            <Text style={styles.bioText} numberOfLines={isExpanded ? undefined : 2}>{item.instructor.biography}</Text>
                            {item.instructor.biography.length > BIO_CHAR_LIMIT && (
                                <TouchableOpacity onPress={toggleBioExpansion}>
                                    <Text style={styles.readMoreText}>{isExpanded ? 'Show Less' : 'Read More'}</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        <Text style={styles.bioText} numberOfLines={2}>No Bio .....</Text>
                    )}
                </View>

                <View style={styles.rightContainer}>
                    <TouchableOpacity onPress={() => handleReaction('like')} style={styles.actionButton}>
                        <RNAnimated.View style={[styles.iconCircle, { transform: [{ scale: likeScale }] }]}>
                            <Ionicons name={userReaction === 'like' ? "heart" : "heart-outline"} size={24} color={userReaction === 'like' ? "#ff2d55" : "white"} />
                        </RNAnimated.View>
                        <Text style={styles.actionText}>{likesCount}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={openComments}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="chatbox-ellipses-outline" size={24} color="white" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="share-social-outline" size={24} color="white" />
                        </View>
                        <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>

                    {isVideo && (
                        <TouchableOpacity onPress={toggleMute} style={styles.actionButton}>
                            <View style={styles.iconCircle}>
                                <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={24} color="white" />
                            </View>
                            <Text style={styles.actionText}>{isMuted ? 'Mute' : 'Unmute'}</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={onRefresh} style={styles.actionButton}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="sync" size={24} color="white" />
                        </View>
                        <Text style={styles.actionText}>Reload</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {isVideo && shouldLoad && <ShortProgressBar player={activePlayer} isVisible={isVisible} />}

            <FloatingRewardCoin 
                videoId={item.id}
                isVisible={isVisible}
                mediaType={mediaType}
                player={activePlayer}
            />

            {/* Fix: Lazy-load CommentsSheet only when showComments is true */}
            <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
                {showComments && (
                    <CommentsSheet
                        ref={sheetRef}
                        videoId={item.id}
                        onClose={() => setShowComments(false)}
                        currentUser={user}
                        videoOwnerId={item.instructor_id || item.instructor?.id}
                        animatedIndex={animatedIndex}
                        onChange={(index) => { if (index === -1) setShowComments(false); }}
                    />
                )}
            </View>
        </View>
    );
};

export default memo(ShortFeedItem);

const styles = StyleSheet.create({
    container: { backgroundColor: 'black' },
    videoContainer: { width: '100%' },
    video: { width: '100%' },
    playIconContainer: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -25 }, { translateY: -25 }] },
    rightContainer: { alignItems: 'center', gap: 16 },
    actionButton: { alignItems: 'center', gap: 4 },
    iconCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
    actionText: { color: 'white', fontSize: 11, fontWeight: '600', textAlign: 'center', textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
    bottomOverlayCard: { flex: 1, maxWidth: '80%' },
    profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    overlayAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: '#fff', marginRight: 10 },
    nameContainer: { justifyContent: 'center' },
    instructorName: { color: '#fff', fontWeight: '700', fontSize: 16, textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
    instructorRole: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
    bioText: { color: '#fff', fontSize: 14, lineHeight: 20, textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
    avatarInitialSmall: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    readMoreText: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginTop: 4, textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
    progressWrapper: { position: 'absolute', bottom: -10, left: 0, right: 0, zIndex: 20 },
    slider: { width: '100%', height: 30 },
    timeLabelContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginBottom: -9 },
    timeText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },
    bottomUIContainer: { position: 'absolute', bottom: 28, left: 0, right: 0, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 15 },
    errorContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        zIndex: 99,
    },
    errorHeading: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center',
    },
    errorSubHeading: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        marginTop: 12,
        textAlign: 'center',
        lineHeight: 20,
    },
});
