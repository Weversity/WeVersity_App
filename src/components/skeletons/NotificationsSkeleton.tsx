import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../common/Skeleton';

const { width } = Dimensions.get('window');

export const NotificationItemSkeleton = () => {
    return (
        <View style={styles.notificationItem}>
            <View style={styles.avatarContainer}>
                <Skeleton width={48} height={48} borderRadius={24} color="#E1E9EE" />
                <View style={styles.badgePlaceholder} />
            </View>
            
            <View style={styles.notificationTextContainer}>
                <Skeleton width="90%" height={14} style={{ marginBottom: 6 }} color="#E1E9EE" />
                <Skeleton width="40%" height={10} color="#E1E9EE" />
            </View>
        </View>
    );
};

export const NotificationsSkeleton = () => {
    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <Skeleton width={80} height={20} color="#E1E9EE" />
            </View>
            {Array.from({ length: 3 }).map((_, i) => (
                <NotificationItemSkeleton key={`today-${i}`} />
            ))}
            
            <View style={styles.sectionHeader}>
                <Skeleton width={100} height={20} color="#E1E9EE" />
            </View>
            {Array.from({ length: 4 }).map((_, i) => (
                <NotificationItemSkeleton key={`older-${i}`} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    sectionHeader: {
        marginVertical: 12,
        paddingHorizontal: 4,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 8,
        elevation: 2,
    },
    avatarContainer: {
        position: 'relative',
        width: 48,
        height: 48,
        marginRight: 12,
    },
    badgePlaceholder: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#fff',
    },
    notificationTextContainer: {
        flex: 1,
    },
});
