import React from 'react';
import { View, StyleSheet, Dimensions, FlatList } from 'react-native';
import { Skeleton } from '../common/Skeleton';

const { width } = Dimensions.get('window');

const ChatMessageSkeleton = ({ isMyMessage }: { isMyMessage: boolean }) => {
    return (
        <View style={[styles.bubbleContainer, isMyMessage ? styles.myContainer : styles.theirContainer]}>
            {!isMyMessage && (
                <Skeleton width={32} height={32} borderRadius={16} style={{ marginRight: 8, alignSelf: 'flex-end' }} color="#E1E9EE" />
            )}
            <View style={[
                styles.bubble, 
                isMyMessage ? styles.myBubble : styles.theirBubble
            ]}>
                <Skeleton width={Math.random() * (width * 0.4) + (width * 0.2)} height={14} style={{ marginBottom: 6 }} color={isMyMessage ? "rgba(255,255,255,0.3)" : "#E1E9EE"} />
                {Math.random() > 0.5 && (
                    <Skeleton width={Math.random() * (width * 0.3) + (width * 0.1)} height={14} color={isMyMessage ? "rgba(255,255,255,0.3)" : "#E1E9EE"} />
                )}
            </View>
        </View>
    );
};

export const ChatDetailSkeleton = () => {
    const data = [false, true, false, false, true, false, true, false];
    
    return (
        <View style={styles.container}>
            <FlatList
                data={data}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => <ChatMessageSkeleton isMyMessage={item} />}
                contentContainerStyle={{ padding: 16 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F7FC',
    },
    bubbleContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        width: '100%',
    },
    myContainer: {
        justifyContent: 'flex-end',
    },
    theirContainer: {
        justifyContent: 'flex-start',
    },
    bubble: {
        padding: 12,
        borderRadius: 18,
        maxWidth: width * 0.7,
    },
    myBubble: {
        backgroundColor: '#8A2BE2',
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
});
