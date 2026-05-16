import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from './common/Skeleton';

interface CourseCardSkeletonProps {
    index?: number;
}

export const CourseCardSkeleton: React.FC<CourseCardSkeletonProps> = () => {
    return (
        <View style={styles.card}>
            <View style={styles.cardLeft}>
                <Skeleton width={60} height={60} borderRadius={12} color="#E1E9EE" />
            </View>
            <View style={styles.cardMiddle}>
                <Skeleton width={50} height={12} borderRadius={4} style={{ marginBottom: 6 }} color="#E1E9EE" />
                <Skeleton width="90%" height={16} borderRadius={6} style={{ marginBottom: 6 }} color="#E1E9EE" />
                <Skeleton width="60%" height={16} borderRadius={6} style={{ marginBottom: 10 }} color="#E1E9EE" />
                
                <View style={styles.priceRow}>
                    <Skeleton width={40} height={12} color="#E1E9EE" />
                    <Skeleton width={60} height={12} color="#E1E9EE" />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 15,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardLeft: {
        marginRight: 10,
    },
    cardMiddle: {
        flex: 1,
        marginRight: 10,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
});
