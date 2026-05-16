import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../common/Skeleton';

const { width } = Dimensions.get('window');

export const AnalyticsSkeleton = () => {
    return (
        <View style={styles.container}>
            {/* Stats Row */}
            <View style={styles.statsRow}>
                {[1, 2, 3].map(i => (
                    <View key={i} style={styles.statCard}>
                        <Skeleton width={36} height={36} borderRadius={18} style={{ marginBottom: 8 }} color="#E1E9EE" />
                        <Skeleton width={30} height={18} style={{ marginBottom: 4 }} color="#E1E9EE" />
                        <Skeleton width={60} height={10} color="#E1E9EE" />
                    </View>
                ))}
            </View>
            
            {/* Graph Card */}
            <View style={styles.graphCard}>
                <Skeleton width={120} height={16} style={{ marginBottom: 6 }} color="#E1E9EE" />
                <Skeleton width={180} height={12} style={{ marginBottom: 20 }} color="#E1E9EE" />
                <Skeleton width="100%" height={220} borderRadius={16} color="#E1E9EE" />
            </View>
            
            {/* Tracking Card */}
            <View style={styles.trackingCard}>
                <Skeleton width={150} height={16} style={{ marginBottom: 6 }} color="#E1E9EE" />
                <Skeleton width={200} height={12} style={{ marginBottom: 20 }} color="#E1E9EE" />
                
                {[1, 2, 3, 4].map(i => (
                    <View key={i} style={styles.courseRow}>
                        <View style={styles.courseHeader}>
                            <Skeleton width="60%" height={14} color="#E1E9EE" />
                            <Skeleton width={60} height={12} color="#E1E9EE" />
                        </View>
                        <View style={styles.progressRow}>
                            <Skeleton width="100%" height={6} borderRadius={3} color="#E1E9EE" />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: '#FFFFFF',
        width: '31%',
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 2,
    },
    graphCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
    },
    trackingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        elevation: 2,
    },
    courseRow: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    courseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    progressRow: {
        height: 6,
        marginTop: 4,
    }
});
