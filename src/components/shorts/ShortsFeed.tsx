import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StatusBar, StyleSheet, Text, View } from 'react-native';
import { videoService } from '../../services/videoService';
import ShortFeedItem from './ShortFeedItem';

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
    const [shorts, setShorts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentVisibleIndex, setCurrentVisibleIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isCommentsVisible, setIsCommentsVisible] = useState(false);
    const [containerHeight, setContainerHeight] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);

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
        try {
            if (isManualRefresh) {
                setIsRefreshing(true);
                setShorts([]);
            } else {
                setLoading(true);
            }

            const data = await videoService.fetchShorts();
            if (data) {
                const finalData = isManualRefresh ? shuffleArray(data) : data;
                setShorts(finalData);
                setCurrentVisibleIndex(0);
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
        const unsubscribe = (navigation as any).addListener('tabPress', () => {
            if (navigation.isFocused()) {
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

    const renderEmpty = () => {
        if (loading || isRefreshing) {
            return (
                <View style={[styles.loadingContainer, { height: containerHeight || '100%' }]}>
                    <ActivityIndicator size="large" color="#8A2BE2" />
                    <Text style={{ color: '#fff', marginTop: 15, fontSize: 16 }}>Finding fresh videos...</Text>
                </View>
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
        return (
            <View style={{ height: containerHeight }}>
                <ShortFeedItem
                    item={item}
                    isVisible={index === currentVisibleIndex}
                    onRefresh={() => loadShorts(true)}
                    isMuted={isMuted}
                    setIsMuted={setIsMuted}
                    onCommentsVisibilityChange={setIsCommentsVisible}
                    containerHeight={containerHeight}
                    containerWidth={containerWidth}
                />
            </View>
        );
    }, [currentVisibleIndex, isMuted, containerHeight]);

    if (loading && shorts.length === 0 && !isRefreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8A2BE2" />
            </View>
        );
    }

    return (
        <View style={styles.container} onLayout={onLayout}>
            <StatusBar barStyle="light-content" backgroundColor="black" translucent />
            {containerHeight === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8A2BE2" />
                </View>
            ) : (
                <FlatList
                    data={shorts}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    pagingEnabled={true}
                    scrollEnabled={!isCommentsVisible}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={containerHeight}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    disableIntervalMomentum={true}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={{ flexGrow: 1 }}
                    getItemLayout={(data, index) => ({
                        length: containerHeight,
                        offset: containerHeight * index,
                        index,
                    })}
                    removeClippedSubviews={true}
                    keyboardShouldPersistTaps="handled"
                    initialNumToRender={2}
                    maxToRenderPerBatch={2}
                    windowSize={3}
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
