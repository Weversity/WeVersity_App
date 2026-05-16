import React from 'react';
import { View, StyleSheet, Dimensions, FlatList } from 'react-native';
import { Skeleton } from '../common/Skeleton';

const { width } = Dimensions.get('window');

export const CourseListItemSkeleton = () => {
    return (
        <View style={styles.card}>
            <Skeleton width={80} height={80} borderRadius={10} color="#E1E9EE" />
            <View style={styles.content}>
                <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} color="#E1E9EE" />
                <Skeleton width="40%" height={12} style={{ marginBottom: 10 }} color="#E1E9EE" />
                <View style={styles.progressContainer}>
                    <Skeleton width="100%" height={4} borderRadius={2} color="#E1E9EE" />
                </View>
                <Skeleton width="30%" height={10} color="#E1E9EE" />
            </View>
        </View>
    );
};

export const CourseListSkeleton = () => {
    return (
        <View style={styles.container}>
            {Array.from({ length: 6 }).map((_, i) => (
                <CourseListItemSkeleton key={i} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 15,
    },
    content: {
        flex: 1,
        marginLeft: 15,
    },
    progressContainer: {
        height: 4,
        marginBottom: 6,
        width: '100%',
    }
});
