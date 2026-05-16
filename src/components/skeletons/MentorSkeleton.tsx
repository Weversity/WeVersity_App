import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../common/Skeleton';

const { width } = Dimensions.get('window');

export const MentorCardSkeleton = () => {
    return (
        <View style={styles.mentorCard}>
            <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 12 }} color="#E1E9EE" />
            <Skeleton width={100} height={16} style={{ marginBottom: 6 }} color="#E1E9EE" />
            <Skeleton width={80} height={10} style={{ marginBottom: 12 }} color="#E1E9EE" />
            
            <View style={styles.mentorStats}>
                <Skeleton width={40} height={14} color="#E1E9EE" />
                <Skeleton width={40} height={14} color="#E1E9EE" />
            </View>
            
            <Skeleton width="100%" height={34} borderRadius={20} color="#E1E9EE" />
        </View>
    );
};

export const MentorGridSkeleton = () => {
    return (
        <View style={styles.gridContainer}>
            {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={styles.row}>
                    <MentorCardSkeleton />
                    <MentorCardSkeleton />
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    gridContainer: {
        paddingHorizontal: 15,
        paddingBottom: 20,
        marginTop: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    mentorCard: {
        width: (width - 45) / 2,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        alignItems: 'center',
        elevation: 3,
    },
    mentorStats: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 12,
    },
});
