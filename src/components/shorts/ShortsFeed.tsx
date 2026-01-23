import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, StatusBar, StyleSheet, Text, View } from 'react-native';
import { videoService } from '../../services/videoService';
import ShortFeedItem from './ShortFeedItem';

const { height } = Dimensions.get('window');

export default function ShortsFeed() {
    // Explicitly typing shorts as any[] to avoid never[] error
    const [shorts, setShorts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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

    // Calculate actual height for each item (Screen height - Tab Bar)
    // But wait, user wants full screen feel usually. Standard Patterns usually sit BEHIND tabs or above.
    // "Video overlay" commonly goes behind tabs or tabs are transparent. 
    // For "Shorts" usually tabs are black/transparent. 
    // Let's stick to "Above Tab Bar" for safety so content isn't cut off.
    const ITEM_HEIGHT = height - bottomTabHeight;

    const loadShorts = async () => {
        try {
            setLoading(true);
            const data = await videoService.fetchShorts();
            if (data) {
                setShorts(data);
            }
        } catch (error) {
            console.error("Failed to load shorts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadShorts();
    }, []);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentVisibleIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 80,
    }).current;

    const dataToRender = shorts;

    const renderEmpty = () => (
        <View style={[styles.loadingContainer, { padding: 40 }]}>
            <ActivityIndicator size="small" color="#8A2BE2" style={{ marginBottom: 20 }} />
            <Text style={{ color: '#fff', textAlign: 'center' }}>No shorts found. Be the first to upload!</Text>
        </View>
    );

    const renderItem = useCallback(({ item, index }: { item: any, index: number }) => {
        return (
            <View style={{ height: ITEM_HEIGHT }}>
                <ShortFeedItem
                    item={item}
                    isVisible={index === currentVisibleIndex}
                    isMuted={isMuted}
                    setIsMuted={setIsMuted}
                />
            </View>
        );
    }, [currentVisibleIndex, ITEM_HEIGHT]);

    if (loading && shorts.length === 0) {
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
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                ListEmptyComponent={renderEmpty}
                getItemLayout={(data, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                })}
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
