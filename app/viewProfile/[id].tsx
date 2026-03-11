import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
// @ts-ignore
import { supabase } from '../../src/lib/supabase';
// @ts-ignore
import { chatService } from '../../src/services/chatService';
import { videoService } from '../../src/services/videoService';

const { width } = Dimensions.get('window');
const CONTAINER_PADDING = 8;
const COLUMN_GAP = 2;
const ITEM_WIDTH = (width - (CONTAINER_PADDING * 2) - (COLUMN_GAP * 2)) / 3;

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

const getThumbnailUrl = (url: string, type: 'image' | 'video') => {
    if (!url) return '';
    if (type === 'image') return url;

    // Cloudinary video thumbnail trick: change extension to .jpg
    // Also works for most CDNs if they auto-generate thumbnails
    if (url.includes('cloudinary.com')) {
        return url.replace(/\.[^/.]+$/, ".jpg");
    }

    return url;
};

export default function ViewProfile() {
    const { id, mode } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const isPersonalDashboardView = mode === 'edit';
    const isOwner = user?.id === id;

    const [profile, setProfile] = useState<any>(null);
    const [shorts, setShorts] = useState<any[]>([]);
    const [totalLikes, setTotalLikes] = useState(0);
    const [followersCount, setFollowersCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowingViewer, setIsFollowingViewer] = useState(false);

    // New Modal States
    const [isSocialModalVisible, setIsSocialModalVisible] = useState(false);
    const [socialTab, setSocialTab] = useState<'followers' | 'following'>('followers');
    const [socialSearchQuery, setSocialSearchQuery] = useState('');
    const [followersList, setFollowersList] = useState<any[]>([]);
    const [followingList, setFollowingList] = useState<any[]>([]);
    const [isSocialLoading, setIsSocialLoading] = useState(false);
    const [showFollowersTooltip, setShowFollowersTooltip] = useState(true);

    const [isChatModalVisible, setIsChatModalVisible] = useState(false);
    // Removed follow/unfollow modal states for Optimistic UI
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [successType, setSuccessType] = useState<'chat' | 'follow'>('chat');

    const [chatRequestStatus, setChatRequestStatus] = useState<'none' | 'pending' | 'accepted' | 'declined'>('none');
    const [sendingRequest, setSendingRequest] = useState(false);


    // CRITICAL: Prevent infinite re-render loop with fetch guard
    const isFetchingRef = React.useRef(false);
    const lastFetchTimeRef = React.useRef(0); // Throttle fetches
    const isMountedRef = React.useRef(true);

    // Track mount status only; avoid forcing loading state changes here.
    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    useEffect(() => {
        if (!isMountedRef.current) return;
        if (!id) return;

        // SWR rule:
        // - If we already have profile/shorts, NEVER show the full-screen loader again.
        // - Only show full-screen loading on a true cold start (no profile yet).
        const showFullScreen = !profile && shorts.length === 0;
        loadProfile(showFullScreen);

        if (user) {
            checkFollowStatus();
            checkChatStatus();
        }
    }, [id, user?.updated_at]); // Depend on updated_at to catch profile changes, avoiding object ref loops

    const loadProfile = async (showFullScreenLoading: boolean = true) => {
        const now = Date.now();
        // THROTTLE: Don't fetch more than once every 1.5 seconds unless it's an initial load
        if (now - lastFetchTimeRef.current < 1500 && !showFullScreenLoading) {
            console.log('⏳ [ViewProfile] Throttling fetch (too frequent)');
            return;
        }

        // CRITICAL: Prevent multiple simultaneous fetches
        if (isFetchingRef.current) {
            console.log('⚠️ [ViewProfile] Fetch already in progress, skipping...');
            return;
        }

        try {
            isFetchingRef.current = true;
            lastFetchTimeRef.current = now;
            console.log('🔄 [ViewProfile] --- FETCH START ---', { showFullScreenLoading, hasProfile: !!profile });

            // SWR rule:
            // - If we already have profile/shorts, do NOT clear them or show a white screen.
            // - Only show full-screen loader when no data exists yet.
            if (showFullScreenLoading && !profile && shorts.length === 0) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            // Force fresh data by not relying on potential internal cache for public profile.
            // videoService.fetchPublicProfile already applies a cache-busting filter,
            // and we can pass a dummy timestamp here if additional control is needed later.
            const data = await videoService.fetchPublicProfile(id as string);

            if (!isMountedRef.current) return; // Prevent setting state if unmounted

            setProfile(data.profile);
            setShorts(data.shorts);
            setTotalLikes(data.totalLikes);

            const { count, error } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', id);

            if (!isMountedRef.current) return;

            if (!error) {
                setFollowersCount(count || 0);
            }

            console.log('✅ [ViewProfile] --- FETCH END --- Success');
        } catch (error) {
            if (isMountedRef.current) console.error('❌ [ViewProfile] --- FETCH END --- Error:', error);
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
                setRefreshing(false);
            }
            isFetchingRef.current = false;
        }
    };

    const checkFollowStatus = async () => {
        try {
            if (!user?.id || !id) return;
            const [iFollowThem, theyFollowMe] = await Promise.all([
                videoService.checkIsFollowing(user.id, id as string),
                videoService.checkIsFollowing(id as string, user.id)
            ]);
            setIsFollowing(iFollowThem);
            setIsFollowingViewer(theyFollowMe);
        } catch (error) {
            console.error("Failed to check follow status", error);
        }
    };

    const checkChatStatus = async () => {
        try {
            if (!user?.id || !id) return;
            if (isOwner) return;
            const request = await chatService.checkChatRequestStatus(user.id, id as string);
            if (request) {
                setChatRequestStatus(request.status);
            }
        } catch (error) {
            console.error("Failed to check chat request status", error);
        }
    };

    const fetchSocialData = async () => {
        if (!id || !user?.id) return;
        setIsSocialLoading(true);
        try {
            const [followers, following] = await Promise.all([
                videoService.fetchFollowersList(id as string, user.id),
                videoService.fetchFollowingList(id as string, user.id)
            ]);
            setFollowersList(followers);
            setFollowingList(following);
        } catch (error) {
            console.error("Failed to fetch social data", error);
        } finally {
            setIsSocialLoading(false);
        }
    };

    const openSocialModal = (tab: 'followers' | 'following') => {
        setShowFollowersTooltip(false);
        setSocialTab(tab);
        fetchSocialData();
        setIsSocialModalVisible(true);
    };

    const handleSocialToggle = async (targetUser: any) => {
        if (!user?.id) {
            Alert.alert(
                "Login Required",
                "Please login to follow users",
                [{ text: "OK", style: "cancel" }]
            );
            return;
        }

        const isMainProfile = targetUser.id === (profile?.id || id);
        const currentFollowState = isMainProfile ? isFollowing : targetUser.is_followed_by_viewer;
        const newFollowState = !currentFollowState;

        // Optimistic UI Update - Lists
        const toggleUserInList = (list: any[]) =>
            list.map((u) => {
                if (u.id === targetUser.id) {
                    return { ...u, is_followed_by_viewer: newFollowState };
                }
                return u;
            });

        setFollowersList(prev => toggleUserInList(prev));
        setFollowingList(prev => toggleUserInList(prev));

        // Optimistic UI Update - Main Profile
        if (isMainProfile) {
            setIsFollowing(newFollowState);
            setFollowersCount(prev => newFollowState ? prev + 1 : Math.max(0, prev - 1));
        }

        // Background API call
        try {
            await videoService.toggleFollow(user.id, targetUser.id);
        } catch (error) {
            console.error("Social toggle failed", error);
            // Revert optimistic update
            setFollowersList(prev => toggleUserInList(prev)); // Toggle again to revert
            setFollowingList(prev => toggleUserInList(prev));
            if (isMainProfile) {
                setIsFollowing(currentFollowState);
                setFollowersCount(prev => currentFollowState ? prev + 1 : Math.max(0, prev - 1));
            }
        }
    };

    const handleFollow = () => {
        handleSocialToggle({ id: id as string, is_followed_by_viewer: isFollowing });
    };

    const handleSendChatRequest = async () => {
        if (!user || !profile?.id) return;
        try {
            setSendingRequest(true);
            const success = await chatService.sendChatRequest(user.id, profile.id);
            if (success) {
                setChatRequestStatus('pending');
                setIsChatModalVisible(false);
                setSuccessType('chat');
                setIsSuccessModalVisible(true);
            }
        } catch (error) {
            console.error('Error sending chat request:', error);
            Alert.alert('Error', 'Could not send chat request. Please try again.');
        } finally {
            setSendingRequest(false);
        }
    };

    const handleVideoPress = (item: any) => {
        router.push({
            pathname: "/player",
            params: {
                video_url: item.video_url,
                id: item.id,
                likes_count: item.likes_count || 0,
                dislikes_count: item.dislikes_count || 0,
                comments_count: item.comments_count || 0,
                description: item.description || '',
                instructor_id: item.instructor_id,
                instructor_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
                instructor_avatar: profile?.avatar_url || '',
                type: item.type
            }
        } as any);
    };

    const formatCount = (count: number) => {
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
        return count.toString();
    };



    // Professional "data over spinner" rule:
    // Only show full-screen spinner when we truly have no data yet.
    if (loading && !profile && shorts.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" />
                <ActivityIndicator size="large" color="#8A2BE2" />
            </View>
        );
    }

    const renderHeader = () => {
        // Merge profile data with auth metadata if it's the owner for instant updates
        const displayProfile = isOwner && user?.user_metadata ? {
            ...profile,
            first_name: user.user_metadata.first_name || profile?.first_name,
            last_name: user.user_metadata.last_name || profile?.last_name,
            avatar_url: user.user_metadata.avatar_url || profile?.avatar_url,
            occupation: user.user_metadata.occupation || profile?.occupation
        } : profile;

        // Ensure biography is present in displayProfile if it was fetched but not in user_metadata
        if (!displayProfile.biography && profile?.biography) {
            displayProfile.biography = profile.biography;
        }

        return (
            <View style={styles.headerContainer}>
                <View style={styles.profileSection}>
                    <View style={styles.avatarFloatingDisc}>
                        <View style={styles.avatarContainer}>
                            {displayProfile?.avatar_url ? (
                                <Image
                                    source={{ uri: displayProfile.avatar_url }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <View style={[
                                    styles.avatar,
                                    styles.avatarPlaceholder,
                                    { backgroundColor: getRandomColor(displayProfile?.first_name || 'User') }
                                ]}>
                                    <Text style={styles.avatarInitial}>
                                        {getInitials(displayProfile?.first_name, displayProfile?.last_name)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{displayProfile?.first_name} {displayProfile?.last_name}</Text>
                    </View>
                    <Text style={styles.role}>{(displayProfile?.occupation || 'Member').toUpperCase()}</Text>

                    {/* Bio Section - TikTok Style with Refined Add Button */}
                    <View style={styles.bioContainer}>
                        {isOwner ? (
                            displayProfile?.biography ? (
                                <TouchableOpacity
                                    onPress={() => router.push('/profile/publicSettings' as any)}
                                    style={styles.bioWrapper}
                                >
                                    <Text style={styles.bioText} numberOfLines={3}>
                                        {displayProfile.biography}
                                    </Text>
                                    <Ionicons name="pencil" size={14} color="#8A2BE2" style={{ marginLeft: 6, marginTop: 2 }} />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.addBioButton}
                                    onPress={() => router.push('/profile/publicSettings' as any)}
                                >
                                    <Ionicons name="videocam" size={16} color="#000" style={{ marginRight: 6 }} />
                                    <Text style={styles.addBioText}>Add bio</Text>
                                    <Text style={{ color: '#999', marginHorizontal: 6 }}>·</Text>
                                    <Text style={{ color: '#999', fontSize: 13 }}>I'm interested in...</Text>
                                </TouchableOpacity>
                            )
                        ) : (
                            <Text style={[styles.bioText, !displayProfile?.biography && styles.noBioText]}>
                                {displayProfile?.biography || "No bio yet..."}
                            </Text>
                        )}
                    </View>

                    <View style={styles.statsContainer}>
                        {isOwner ? (
                            <TouchableOpacity style={styles.statBox} onPress={() => openSocialModal('followers')} activeOpacity={0.7}>
                                {showFollowersTooltip && (
                                    <View style={styles.tooltipContainer}>
                                        <View style={styles.tooltipBubble}>
                                            <Text style={styles.tooltipText}>See who follows you</Text>
                                        </View>
                                        <View style={styles.tooltipArrow} />
                                    </View>
                                )}
                                <Text style={styles.statNumber}>{formatCount(followersCount)}</Text>
                                <Text style={styles.statLabel}>FOLLOWERS</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.statBox}>
                                <Text style={styles.statNumber}>{formatCount(followersCount)}</Text>
                                <Text style={styles.statLabel}>FOLLOWERS</Text>
                            </View>
                        )}
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{shorts.length}</Text>
                            <Text style={styles.statLabel}>SHORTS</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{formatCount(totalLikes)}</Text>
                            <Text style={styles.statLabel}>LIKES</Text>
                        </View>
                    </View>

                    {isOwner ? (
                        <TouchableOpacity
                            onPress={() => {
                                if (!user) {
                                    router.push('/login' as any);
                                } else {
                                    router.push('/profile/publicSettings' as any);
                                }
                            }}
                            activeOpacity={0.8}
                            style={styles.editButton}
                        >
                            <Text style={styles.editButtonText}>Edit Profile</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.actionRow}>
                            {(() => {
                                let mainBtnType = 'follow'; // Purple
                                let mainBtnText = 'Follow';

                                if (isFollowingViewer && isFollowing) {
                                    mainBtnType = 'friends'; // Grey
                                    mainBtnText = 'Friends';
                                } else if (!isFollowingViewer && isFollowing) {
                                    mainBtnType = 'following'; // Grey
                                    mainBtnText = 'Following';
                                } else if (isFollowingViewer && !isFollowing) {
                                    mainBtnType = 'followBack'; // Purple
                                    mainBtnText = 'Follow Back';
                                }

                                const isMainPurple = mainBtnType === 'followBack' || mainBtnType === 'follow';

                                return (
                                    <TouchableOpacity
                                        onPress={handleFollow}
                                        activeOpacity={0.8}
                                        style={isMainPurple ? styles.followButtonSolid : styles.followingButton}
                                    >
                                        <Text style={isMainPurple ? styles.followButtonText : styles.followingButtonText}>
                                            {mainBtnText}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })()}

                            {chatRequestStatus === 'pending' ? (
                                <TouchableOpacity
                                    disabled={true}
                                    style={[styles.messageButton, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}
                                >
                                    <Ionicons name="time-outline" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                                    <Text style={[styles.messageButtonText, { color: '#9CA3AF' }]}>Requested</Text>
                                </TouchableOpacity>
                            ) : chatRequestStatus === 'accepted' ? (
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/inbox' as any)}
                                    style={styles.messageButton}
                                >
                                    <Ionicons name="chatbubbles" size={20} color="#8A2BE2" style={{ marginRight: 8 }} />
                                    <Text style={styles.messageButtonText}>Chat</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setIsChatModalVisible(true)}
                                    style={styles.messageButton}
                                >
                                    <Ionicons name="chatbubble-ellipses" size={20} color="#8A2BE2" style={{ marginRight: 8 }} />
                                    <Text style={styles.messageButtonText}>Message</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                <View style={styles.tabsContainer}>
                    <View style={styles.tabItem}>
                        <Ionicons name="grid" size={24} color="#8A2BE2" style={{ marginBottom: 4 }} />
                        <Text style={styles.tabTextActive}>SHORTS</Text>
                        <View style={styles.activeIndicator} />
                    </View>
                </View>


            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerText}>
                    {profile ? `${profile.first_name} ${profile.last_name}` : 'Instructor Profile'}
                </Text>
            </View>

            <FlatList
                data={shorts}
                keyExtractor={item => item.id}
                numColumns={3}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={{
                    paddingHorizontal: CONTAINER_PADDING,
                    paddingBottom: 50
                }}
                columnWrapperStyle={{ gap: COLUMN_GAP }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.gridItem}
                        onPress={() => handleVideoPress(item)}
                        activeOpacity={0.9}
                    >
                        <Image
                            source={{ uri: getThumbnailUrl(item.video_url, item.type) }}
                            style={styles.gridImage}
                        />
                        <View style={styles.gridOverlay}>
                            <Ionicons name="play" size={14} color="#fff" />
                            <Text style={styles.overlayLikes}>{formatCount(item.likes_count || 0)}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="videocam-outline" size={48} color="#444" />
                        <Text style={styles.emptyText}>No shorts yet</Text>
                    </View>
                }
                showsVerticalScrollIndicator={false}
            />

            {/* Chat Request Modal */}
            <Modal
                isVisible={isChatModalVisible}
                onBackdropPress={() => setIsChatModalVisible(false)}
                onBackButtonPress={() => setIsChatModalVisible(false)}
                animationIn="zoomIn"
                animationOut="zoomOut"
                backdropOpacity={0.5}
                backdropColor="black"
            >
                <View style={styles.premiumModalContent}>
                    <View style={styles.modalIconContainer}>
                        <Ionicons name="chatbubble-ellipses" size={40} color="#8A2BE2" />
                    </View>
                    <Text style={styles.premiumModalTitle}>Send Chat Request</Text>
                    <Text style={styles.premiumModalSubtitle}>
                        Connect before starting a conversation. The user will need to accept your request.
                    </Text>
                    <View style={styles.premiumModalButtons}>
                        <TouchableOpacity
                            style={styles.premiumModalCancelButton}
                            onPress={() => setIsChatModalVisible(false)}
                        >
                            <Text style={styles.premiumModalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleSendChatRequest}
                            style={styles.premiumModalConfirmWrapper}
                        >
                            <LinearGradient
                                colors={['#8A2BE2', '#5D00B3']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.premiumModalConfirmButton}
                            >
                                <Text style={styles.premiumModalConfirmText}>Send Request</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Follow/Unfollow modals removed for optimistic TikTok-style UI */}

            {/* Social Modal */}
            <Modal
                isVisible={isSocialModalVisible}
                onBackdropPress={() => setIsSocialModalVisible(false)}
                onBackButtonPress={() => setIsSocialModalVisible(false)}
                style={styles.socialModal}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                backdropOpacity={0.5}
                backdropColor="black"
            >
                <View style={styles.socialModalContent}>
                    <View style={styles.socialModalHeader}>
                        <View style={styles.dragHandle} />
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={`Search ${socialTab}...`}
                                placeholderTextColor="#999"
                                value={socialSearchQuery}
                                onChangeText={setSocialSearchQuery}
                            />
                            {socialSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSocialSearchQuery('')} style={styles.clearSearchButton}>
                                    <Ionicons name="close-circle" size={16} color="#999" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.socialTabsContainer}>
                        <TouchableOpacity
                            style={styles.socialTab}
                            onPress={() => setSocialTab('following')}
                        >
                            <Text style={[styles.socialTabText, socialTab === 'following' && styles.socialTabTextActive]}>
                                Following
                            </Text>
                            {socialTab === 'following' && <View style={styles.socialTabIndicator} />}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.socialTab}
                            onPress={() => setSocialTab('followers')}
                        >
                            <Text style={[styles.socialTabText, socialTab === 'followers' && styles.socialTabTextActive]}>
                                Followers
                            </Text>
                            {socialTab === 'followers' && <View style={styles.socialTabIndicator} />}
                        </TouchableOpacity>
                    </View>

                    {isSocialLoading ? (
                        <View style={styles.socialLoadingContainer}>
                            <ActivityIndicator size="large" color="#8A2BE2" />
                        </View>
                    ) : (
                        <FlatList
                            data={(socialTab === 'followers' ? followersList : followingList).filter(u =>
                                `${u.first_name} ${u.last_name}`.toLowerCase().includes(socialSearchQuery.toLowerCase())
                            )}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.socialListContainer}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => {
                                let btnType = 'follow'; // Purple
                                let btnText = 'Follow';

                                if (item.is_following_viewer && item.is_followed_by_viewer) {
                                    btnType = 'friends'; // Grey
                                    btnText = 'Friends';
                                } else if (!item.is_following_viewer && item.is_followed_by_viewer) {
                                    btnType = 'following'; // Grey
                                    btnText = 'Following';
                                } else if (item.is_following_viewer && !item.is_followed_by_viewer) {
                                    btnType = 'followBack'; // Purple
                                    btnText = 'Follow Back';
                                }

                                const isPurple = btnType === 'followBack' || btnType === 'follow';

                                return (
                                    <View style={styles.socialListItem}>
                                        <TouchableOpacity
                                            style={styles.socialListAvatarContainer}
                                            onPress={() => {
                                                setIsSocialModalVisible(false);
                                                router.push(`/viewProfile/${item.id}` as any);
                                            }}
                                        >
                                            {item.avatar_url ? (
                                                <Image source={{ uri: item.avatar_url }} style={styles.socialListAvatar} />
                                            ) : (
                                                <View style={[styles.socialListAvatar, styles.avatarPlaceholder, { backgroundColor: getRandomColor(item.first_name || 'User') }]}>
                                                    <Text style={styles.socialListAvatarInitial}>{getInitials(item.first_name, item.last_name)}</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                        <View style={styles.socialListInfo}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setIsSocialModalVisible(false);
                                                    router.push(`/viewProfile/${item.id}` as any);
                                                }}
                                            >
                                                <Text style={styles.socialListName} numberOfLines={1}>
                                                    {item.first_name} {item.last_name}
                                                </Text>
                                            </TouchableOpacity>
                                            {item.occupation && (
                                                <Text style={styles.socialListOccupation} numberOfLines={1}>
                                                    {item.occupation}
                                                </Text>
                                            )}
                                        </View>
                                        <TouchableOpacity
                                            style={[
                                                styles.socialListButton,
                                                isPurple ? styles.socialListButtonPurple : styles.socialListButtonGrey
                                            ]}
                                            onPress={() => handleSocialToggle(item)}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[
                                                styles.socialListButtonText,
                                                isPurple ? styles.socialListButtonTextPurple : styles.socialListButtonTextGrey
                                            ]}>
                                                {btnText}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            }}
                            ListEmptyComponent={
                                <View style={styles.socialEmptyContainer}>
                                    <Text style={styles.socialEmptyText}>No users found</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal
                isVisible={isSuccessModalVisible}
                onBackdropPress={() => setIsSuccessModalVisible(false)}
                onBackButtonPress={() => setIsSuccessModalVisible(false)}
                animationIn="zoomIn"
                animationOut="zoomOut"
                backdropOpacity={0.5}
                backdropColor="black"
            >
                <View style={styles.premiumModalContent}>
                    <View style={styles.modalIconContainer}>
                        <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
                    </View>
                    <Text style={styles.premiumModalTitle}>
                        {successType === 'chat' ? 'Chat request sent' : 'Followed successfully'}
                    </Text>
                    <Text style={styles.premiumModalSubtitle}>
                        {successType === 'chat'
                            ? 'Your chat request has been sent. You will be notified when it is accepted.'
                            : 'You are now following this user successfully.'}
                    </Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setIsSuccessModalVisible(false)}
                        style={styles.premiumModalOkWrapper}
                    >
                        <LinearGradient
                            colors={['#8A2BE2', '#5D00B3']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.premiumModalOkButton}
                        >
                            <Text style={styles.premiumModalConfirmText}>OK</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    header: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#8A2BE2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerContainer: {
        backgroundColor: '#fff',
    },
    profileSection: {
        alignItems: 'center',
        paddingTop: 30,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    avatarFloatingDisc: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        // Even darker, centered neon glow
        shadowColor: '#5D00B3',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 25,
        elevation: 20,
    },
    avatarContainer: {
        width: 110, // Creates a 5px gap ( (120 - 110) / 2 = 5 )
        height: 110,
        borderRadius: 55,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 36,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
    },
    smallEditButton: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 15,
        marginLeft: 10,
    },
    smallEditButtonText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '600',
    },
    role: {
        fontSize: 12,
        color: '#8A2BE2',
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: 2,
    },
    // New Bio Styles
    bioContainer: {
        marginVertical: 12,
        paddingHorizontal: 30,
        alignItems: 'center',
        width: '100%',
    },
    bioWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bioText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#666',
        textAlign: 'center',
    },
    noBioText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#999',
    },
    addBioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 38,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    addBioText: {
        color: '#000',
        fontWeight: '600',
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: width * 0.92,
        marginTop: 24,
        marginBottom: 25,
        gap: 8,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: '#F8F8F8',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    statLabel: {
        fontSize: 10,
        color: '#999',
        fontWeight: 'bold',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    followButton: {
        width: width * 0.8,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: width * 0.82,
        justifyContent: 'space-between',
        gap: 12,
    },
    followButtonSolid: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#8A2BE2',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    followingButton: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    followingButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    messageButton: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        flexDirection: 'row',
    },
    messageButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    followButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalIconContainer: {
        marginBottom: 15,
        alignItems: 'center',
    },
    premiumModalContent: {
        backgroundColor: '#fff',
        borderRadius: 25,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    premiumModalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 12,
        textAlign: 'center',
    },
    premiumModalSubtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    premiumModalButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    premiumModalCancelButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    premiumModalCancelText: {
        fontSize: 16,
        color: '#666',
        fontWeight: 'bold',
    },
    premiumModalConfirmWrapper: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        overflow: 'hidden',
    },
    premiumModalConfirmButton: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    premiumModalConfirmText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    premiumModalOkWrapper: {
        width: '100%',
        height: 50,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 10,
    },
    premiumModalOkButton: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButton: {
        width: width * 0.9,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: '#8A2BE2',
        elevation: 5,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    editButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    tabsContainer: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        marginTop: 10,
        alignItems: 'center',
    },
    tabItem: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabTextActive: {
        color: '#8A2BE2',
        fontWeight: 'bold',
        fontSize: 15,
    },
    activeIndicator: {
        width: 40,
        height: 3,
        backgroundColor: '#8A2BE2',
        borderRadius: 2,
        marginTop: 4,
    },

    gridItem: {
        width: ITEM_WIDTH,
        height: ITEM_WIDTH * 1.6,
        marginBottom: COLUMN_GAP,
    },
    gridImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f5f5f5',
        borderRadius: 4,
    },
    gridOverlay: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 5,
    },
    overlayLikes: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 3,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        color: '#666',
        marginTop: 10,
        fontSize: 14,
    },
    socialModal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    socialModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '80%',
        paddingTop: 12,
    },
    socialModalHeader: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        color: '#000',
        fontSize: 15,
    },
    clearSearchButton: {
        padding: 4,
    },
    socialTabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    socialTab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    socialTabText: {
        fontSize: 15,
        color: '#999',
        fontWeight: 'bold',
    },
    socialTabTextActive: {
        color: '#8A2BE2',
    },
    socialTabIndicator: {
        position: 'absolute',
        bottom: 0,
        width: '40%',
        height: 3,
        backgroundColor: '#8A2BE2',
        borderRadius: 3,
    },
    socialLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    socialListContainer: {
        paddingVertical: 10,
    },
    socialListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    socialListAvatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    socialListAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
    },
    socialListAvatarInitial: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    socialListInfo: {
        flex: 1,
        marginRight: 10,
    },
    socialListName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 2,
    },
    socialListOccupation: {
        fontSize: 12,
        color: '#666',
    },
    socialListButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 100,
    },
    socialListButtonPurple: {
        backgroundColor: '#8A2BE2',
    },
    socialListButtonGrey: {
        backgroundColor: '#F5F5F5',
    },
    socialListButtonText: {
        fontWeight: 'bold',
        fontSize: 13,
    },
    socialListButtonTextPurple: {
        color: '#fff',
    },
    socialListButtonTextGrey: {
        color: '#000',
    },
    socialEmptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    socialEmptyText: {
        color: '#999',
        fontSize: 14,
    },
    tooltipContainer: {
        position: 'absolute',
        top: -45,
        alignItems: 'center',
        width: 130,
        zIndex: 100,
        alignSelf: 'center',
    },
    tooltipBubble: {
        backgroundColor: '#8A2BE2',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tooltipText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    tooltipArrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 6,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#8A2BE2',
        marginTop: -1,
    },
});