import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from './common/Skeleton';

export const CourseCardSkeleton = () => {
    return (
        <View style={styles.card}>
            <View style={styles.cardLeft}>
                <Skeleton width={60} height={60} borderRadius={12} />
            </View>
            <View style={styles.cardMiddle}>
                <Skeleton width="40%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton width="85%" height={18} borderRadius={4} style={{ marginBottom: 12 }} />
                <View style={styles.priceRow}>
                    <Skeleton width={50} height={14} borderRadius={4} />
                    <Skeleton width={70} height={14} borderRadius={4} />
                </View>
            </View>
            <View style={styles.bookmarkPlaceholder}>
                <Skeleton width={24} height={24} borderRadius={12} />
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
        marginBottom: 10,
        borderLeftWidth: 5,
        borderLeftColor: '#E1E9EE',
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
    bookmarkPlaceholder: {
        padding: 5,
    }
});
