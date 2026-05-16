import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from "@shopify/flash-list";
import * as Device from 'expo-device';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StatusBar, StyleSheet, Text, View } from 'react-native';
import { videoService } from '../../services/videoService';
import { HapticsService } from '../../utils/haptics';
import ShortFeedItem from './ShortFeedItem';
import { ShortsSkeleton } from '../skeletons/ShortsSkeleton';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper to shuffle array (used for manual refresh to give variety)
const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export default function ShortsFeed() {
    const navigation = useNavigation();
    const [shorts, setShorts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentVisibleIndex, setCurrentVisibleIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isCommentsVisible, setIsCommentsVisible] = useState(false);
    const [containerHeight, setContainerHeight] = useState(SCREEN_HEIGHT);
    const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
    
    // Pagination state
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 10;

    // Hardware based windowing
    const [devicePower, setDevicePower] = useState<'high' | 'low'>('high');

    useEffect(() => {
        // Simple heuristic: If device memory is <= 3GB, treat as low-end
        const ramBytes = Device.totalMemory || 4 * 1024 * 1024 * 1024; // Default to 4GB if null
        const ram = ramBytes / (1024 * 1024 * 1024);
        if (ram <= 3) {
            setDevicePower('low');
        }
    }, []);

    const onLayout = (event: any) => {
        const { height, width } = event.nativeEvent.layout;
        if (height > 0 && Math.abs(height - containerHeight) > 1) {
            setContainerHeight(height);
        }
        if (width > 0 && Math.abs(width - containerWidth) > 1) {
            setContainerWidth(width);
        }
    };

    const loadShorts = async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setIsRefreshing(true);
            setPage(0);
            setHasMore(true);
        } else {
            setLoading(true);
        }

        try {
            const data = await videoService.fetchShorts({ page: 0, limit: LIMIT });
            if (data) {
                const finalData = isManualRefresh ? shuffleArray(data) : data;
                setShorts(finalData);
                setHasMore(data.length === LIMIT);
            }
        } catch (error) {
            console.error("Failed to load shorts", error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const fetchMoreShorts = async () => {
        if (loadingMore || !hasMore || shorts.length === 0) return;

        setLoadingMore(true);
        const nextPage = page + 1;
        
        try {
            const data = await videoService.fetchShorts({ page: nextPage, limit: LIMIT });
            if (data && data.length > 0) {
                setShorts(prev => [...prev, ...data]);
                setPage(nextPage);
                setHasMore(data.length === LIMIT);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to fetch more shorts", error);
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        loadShorts();
        const unsubscribe = (navigation as any).addListener('tabPress', () => {
            if (navigation.isFocused()) {
                HapticsService.refreshPull();
                loadShorts(true);
            }
        });
        return unsubscribe;
    }, [navigation]);

    // Use memoized callback for performance
    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentVisibleIndex(viewableItems[0].index ?? 0);
        }
    }, []);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const renderEmpty = () => {
        if (loading || isRefreshing) {
            return (
                <ShortsSkeleton />
            );
        }
        return (
            <View style={[styles.loadingContainer, { padding: 40, height: containerHeight || '100%' }]}>
                <Ionicons name="videocam-off-outline" size={60} color="#666" style={{ marginBottom: 20 }} />
                <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16 }}>No shorts found. Be the first to upload!</Text>
            </View>
        );
    };

    const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
        // Pro Optimization: Strictly limit range to 1 to free up hardware decoders
        const range = 1;
        const shouldLoad = index >= currentVisibleIndex - range && index <= currentVisibleIndex + range;

        return (
            <View style={{ height: containerHeight }}>
                <ShortFeedItem
                    item={item}
                    isVisible={index === currentVisibleIndex}
                    shouldLoad={shouldLoad}
                    onRefresh={() => loadShorts(true)}
                    isMuted={isMuted}
                    setIsMuted={setIsMuted}
                    onCommentsVisibilityChange={setIsCommentsVisible}
                    containerHeight={containerHeight}
                    containerWidth={containerWidth}
                />
            </View>
        );
    }, [currentVisibleIndex, isMuted, containerHeight, containerWidth, devicePower]);

    if (loading && shorts.length === 0 && !isRefreshing) {
        return <ShortsSkeleton />;
    }

    return (
        <View style={styles.container} onLayout={onLayout}>
            <StatusBar barStyle="light-content" backgroundColor="black" translucent />
            {containerHeight === 0 ? (
                <ShortsSkeleton />
            ) : (
                <FlashList
                    data={shorts}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    pagingEnabled={true}
                    scrollEnabled={!isCommentsVisible}
                    showsVerticalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    ListEmptyComponent={renderEmpty}
                    onEndReached={fetchMoreShorts}
                    onEndReachedThreshold={0.5}
                    removeClippedSubviews={true}
                    drawDistance={containerHeight * 2}
                    extraData={currentVisibleIndex}
                    ListFooterComponent={() => loadingMore ? (
                        <View style={{ height: 100, justifyContent: 'center' }}>
                            <ActivityIndicator color="#8A2BE2" />
                        </View>
                    ) : null}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
