import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../common/Skeleton';

const { width } = Dimensions.get('window');

export const PodiumItemSkeleton = ({ rank }: { rank: number }) => {
    const isFirst = rank === 1;
    const size = isFirst ? 110 : 85;
    
    return (
        <View style={[styles.podiumItem, isFirst && styles.podiumFirst]}>
            <View style={styles.avatarWrapper}>
                <Skeleton width={size} height={size} borderRadius={size / 2} color="#E1E9EE" />
            </View>
            <View style={styles.podiumTextContainer}>
                <Skeleton width={60} height={12} style={{ marginBottom: 6 }} color="#E1E9EE" />
                <Skeleton width={40} height={8} style={{ marginBottom: 10 }} color="#E1E9EE" />
                <Skeleton width={50} height={20} borderRadius={10} color="#E1E9EE" />
            </View>
        </View>
    );
};

export const LeaderboardSkeleton = () => {
    return (
        <View style={styles.container}>
            <View style={styles.podiumRoot}>
                <View style={styles.podiumContainer}>
                    <PodiumItemSkeleton rank={2} />
                    <PodiumItemSkeleton rank={1} />
                    <PodiumItemSkeleton rank={3} />
                </View>
            </View>
            
            <View style={styles.listContent}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <View key={`rank-${i}`} style={styles.listItem}>
                        <View style={styles.rankCol}>
                            <Skeleton width={15} height={16} color="#E1E9EE" />
                        </View>
                        
                        <Skeleton width={48} height={48} borderRadius={18} style={{ marginHorizontal: 12 }} color="#E1E9EE" />
                        
                        <View style={styles.listInfo}>
                            <Skeleton width={100} height={14} style={{ marginBottom: 6 }} color="#E1E9EE" />
                            <Skeleton width={60} height={10} color="#E1E9EE" />
                        </View>
                        
                        <Skeleton width={60} height={24} borderRadius={12} color="#E1E9EE" />
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    podiumRoot: {
        marginTop: 35,
        marginBottom: 20,
        paddingTop: 10,
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
    },
    podiumItem: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    podiumFirst: {
        transform: [{ scale: 1.15 }],
        zIndex: 10,
        marginHorizontal: -5,
    },
    avatarWrapper: {
        alignItems: 'center',
        marginBottom: 12,
    },
    podiumTextContainer: {
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 16,
        width: '100%',
        marginTop: -10,
        elevation: 2,
    },
    listContent: {
        paddingBottom: 60,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 16,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#F0F1F7',
    },
    rankCol: {
        width: 35,
        alignItems: 'center',
    },
    listInfo: {
        flex: 1,
    },
});
