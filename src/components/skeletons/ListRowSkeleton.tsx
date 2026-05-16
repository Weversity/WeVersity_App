import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../common/Skeleton';

export const ListRowSkeleton = () => {
    return (
        <View style={styles.container}>
            <Skeleton width={52} height={52} borderRadius={26} style={styles.avatar} color="#E1E9EE" />
            
            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Skeleton width={120} height={16} color="#E1E9EE" />
                    <Skeleton width={50} height={12} color="#E1E9EE" />
                </View>
                
                <View style={styles.bottomRow}>
                    <Skeleton width="80%" height={14} color="#E1E9EE" />
                    <Skeleton width={20} height={20} borderRadius={10} color="#E1E9EE" />
                </View>
            </View>
        </View>
    );
};

export const ListRowSkeletonList = ({ count = 6 }: { count?: number }) => {
    return (
        <View style={{ backgroundColor: '#fff', flex: 1 }}>
            {Array.from({ length: count }).map((_, index) => (
                <ListRowSkeleton key={`list-skeleton-${index}`} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    avatar: {
        marginRight: 15,
    },
    content: {
        flex: 1,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});
