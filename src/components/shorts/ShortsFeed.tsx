import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, StatusBar, StyleSheet, Text, View } from 'react-native';
import { videoService } from '../../services/videoService';
import ShortFeedItem from './ShortFeedItem';

const { height } = Dimensions.get('window');

// Helper to shuffle array
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
    // Explicitly typing shorts as any[] to avoid never[] error
    const [shorts, setShorts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    // Track which item is currently in view to only play that video
    const [currentVisibleIndex, setCurrentVisibleIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(false);


    // Safe try-catch for tab bar height in case it's used outside nav context temporarily
    let bottomTabHeight = 0;
    try {
        bottomTabHeight = useBottomTabBarHeight();
    } catch (e) {
        bottomTabHeight = 49; // Default fallback
    }

    const ITEM_HEIGHT = height - bottomTabHeight;

    const loadShorts = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) {
                setIsRefreshing(true);
                setShorts([]); // Immediately clear current videos
            } else {
                setLoading(true);
            }

            const data = await videoService.fetchShorts();
            if (data) {
                const finalData = isManualRefresh ? shuffleArray(data) : data;
                setShorts(finalData);
                setCurrentVisibleIndex(0); // Reset to first video
            }
        } catch (error) {
            console.error("Failed to load shorts", error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadShorts();

        // Listen for bottom tab press
        const unsubscribe = (navigation as any).addListener('tabPress', (e: any) => {
            // Check if the user is already on this screen
            const isFocused = navigation.isFocused();
            if (isFocused) {
                // Prevent default behavior if needed, but for "refresh" we want to trigger our logic
                loadShorts(true);
            }
        });

        return unsubscribe;
    }, [navigation]);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentVisibleIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 80,
    }).current;

    const dataToRender = shorts;

    const renderEmpty = () => {
        if (loading || isRefreshing) {
            return (
                <View style={[styles.loadingContainer, { height: ITEM_HEIGHT }]}>
                    <ActivityIndicator size="large" color="#8A2BE2" />
                    <Text style={{ color: '#fff', marginTop: 15, fontSize: 16 }}>Finding fresh videos...</Text>
                </View>
            );
        }
        return (
            <View style={[styles.loadingContainer, { padding: 40, height: ITEM_HEIGHT }]}>
                <Ionicons name="videocam-off-outline" size={60} color="#666" style={{ marginBottom: 20 }} />
                <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16 }}>No shorts found. Be the first to upload!</Text>
            </View>
        );
    };

    const renderItem = useCallback(({ item, index }: { item: any, index: number }) => {
        return (
            <View style={{ height: ITEM_HEIGHT }}>
                <ShortFeedItem
                    item={item}
                    isVisible={index === currentVisibleIndex}
                    onRefresh={() => loadShorts(true)}
                    isMuted={isMuted}
                    setIsMuted={setIsMuted}
                />
            </View>
        );
    }, [currentVisibleIndex, ITEM_HEIGHT, isMuted]);

    // Show initial loader only if we have no data and are loading for the first time
    if (loading && shorts.length === 0 && !isRefreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8A2BE2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="black" />

            <FlatList
                data={dataToRender}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum={true}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                ListEmptyComponent={renderEmpty}
                getItemLayout={(data, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                })}
                removeClippedSubviews={true}
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                windowSize={3}
            />
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
