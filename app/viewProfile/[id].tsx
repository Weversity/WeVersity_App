import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { videoService } from '../../src/services/videoService';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3;

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
        // - Only use full-screen loading on a true cold start (no profile yet).
        const showFullScreen = !profile && shorts.length === 0;
        loadProfile(showFullScreen);

        if (user) {
            checkFollowStatus();
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
            const status = await videoService.checkIsFollowing(user.id, id as string);
            setIsFollowing(status);
        } catch (error) {
            console.error("Failed to check follow status", error);
        }
    };

    const handleFollow = async () => {
        if (!user?.id) return;

        // Optimistic Update
        const previousState = isFollowing;
        setIsFollowing(!previousState);
        setFollowersCount(prev => previousState ? prev - 1 : prev + 1);

        try {
            await videoService.toggleFollow(user.id, id as string);
        } catch (error) {
            console.error("Follow failed", error);
            setIsFollowing(previousState);
            setFollowersCount(prev => previousState ? prev + 1 : prev - 1);
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
                instructor_avatar: profile?.avatar_url || ''
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
            avatar_url: user.user_metadata.avatar_url || profile?.avatar_url
        } : profile;

        return (
            <View style={styles.headerContainer}>
                <View style={styles.profileSection}>
                    <View style={styles.avatarWrapper}>
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

                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{displayProfile?.first_name} {displayProfile?.last_name}</Text>
                        {/* Removed small edit button as requested */}
                    </View>
                    <Text style={styles.role}>Instructor</Text>

                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{formatCount(followersCount)}</Text>
                            <Text style={styles.statText}>FOLLOWERS</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{shorts.length}</Text>
                            <Text style={styles.statText}>SHORTS</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{formatCount(totalLikes)}</Text>
                            <Text style={styles.statText}>LIKES</Text>
                        </View>
                    </View>

                    {isOwner ? (
                        <TouchableOpacity
                            onPress={() => router.push('/profile/publicSettings' as any)}
                            activeOpacity={0.8}
                            style={styles.editButton}
                        >
                            <Text style={styles.editButtonText}>Edit Profile</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleFollow} activeOpacity={0.8}>
                            <LinearGradient
                                colors={isFollowing ? ['#333', '#444'] : ['#8A2BE2', '#FF007F']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.followButton}
                            >
                                <Text style={styles.followButtonText}>
                                    {isFollowing ? 'Following' : 'Follow'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.tabsContainer}>
                    <View style={styles.tabItem}>
                        <Text style={styles.tabTextActive}>Shorts</Text>
                        <View style={styles.activeIndicator} />
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Top Navigation Bar */}
            <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={styles.topBarTitle}>Public Profile</Text>
                </View>
                {/* Empty view to balance the back button and keep title centered */}
                <View style={styles.rightPlaceholder} />
            </View>

            <FlatList
                data={shorts}
                keyExtractor={item => item.id}
                numColumns={3}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.gridItem}
                        onPress={() => handleVideoPress(item)}
                        activeOpacity={0.9}
                    >
                        <Image
                            source={{ uri: item.video_url }}
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
        </SafeAreaView>
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
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 15,
        backgroundColor: '#8A2BE2',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightPlaceholder: {
        width: 40,
    },
    topBarTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
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
    avatarWrapper: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#fff',
        padding: 4,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        marginBottom: 15,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 55,
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
        fontSize: 36,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
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
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 30,
        marginBottom: 25,
    },
    statBox: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    statText: {
        fontSize: 10,
        color: '#999',
        fontWeight: 'bold',
        marginTop: 2,
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
    followButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    editButton: {
        width: width * 0.8,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#8A2BE2',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    editButtonText: {
        color: '#8A2BE2',
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
        padding: 1,
    },
    gridImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f5f5f5',
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
});
