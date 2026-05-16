import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../common/Skeleton';

const { width } = Dimensions.get('window');

export const SpotlightCardSkeleton = () => {
    return (
        <View style={styles.spotlightSection}>
            <View style={styles.masterClassRow}>
                <Skeleton width={3} height={16} borderRadius={2} style={{ marginRight: 8 }} color="#E1E9EE" />
                <Skeleton width={150} height={13} color="#E1E9EE" />
            </View>

            <View style={styles.spotlightCard}>
                <Skeleton height={width * 9 / 16} width="100%" color="#E1E9EE" />
                
                <View style={styles.spotlightBottomRow}>
                    <View style={styles.dateBox}>
                        <View style={styles.dateColumn}>
                            <Skeleton width={30} height={11} style={{ marginBottom: 4 }} color="#E1E9EE" />
                            <Skeleton width={40} height={22} color="#E1E9EE" />
                        </View>
                        <Skeleton width={1} height={30} style={{ marginHorizontal: 12 }} color="#E1E9EE" />
                        <View style={styles.timeColumn}>
                            <Skeleton width={80} height={14} style={{ marginBottom: 4 }} color="#E1E9EE" />
                            <Skeleton width={60} height={12} color="#E1E9EE" />
                        </View>
                    </View>

                    <View style={styles.spotlightInstructorRow}>
                        <Skeleton width={32} height={32} borderRadius={16} style={{ marginRight: 8 }} color="#E1E9EE" />
                        <View style={{ flex: 1 }}>
                            <Skeleton width={60} height={9} style={{ marginBottom: 4 }} color="#E1E9EE" />
                            <Skeleton width={100} height={13} color="#E1E9EE" />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

export const SessionItemSkeleton = () => {
    return (
        <View style={styles.horizontalCard}>
            <View style={styles.cardTopRow}>
                <Skeleton width={100} height={100} borderRadius={15} color="#E1E9EE" />
                
                <View style={styles.horizontalContent}>
                    <Skeleton width={80} height={10} style={{ marginBottom: 8 }} color="#E1E9EE" />
                    <Skeleton width="90%" height={15} style={{ marginBottom: 6 }} color="#E1E9EE" />
                    <Skeleton width="60%" height={15} style={{ marginBottom: 12 }} color="#E1E9EE" />
                    
                    <View style={styles.metricsRow}>
                        <Skeleton width={70} height={10} style={{ marginRight: 12 }} color="#E1E9EE" />
                        <Skeleton width={60} height={10} color="#E1E9EE" />
                    </View>
                </View>
            </View>

            <View style={styles.cardBottomRow}>
                <View style={styles.instructorSection}>
                    <Skeleton width={32} height={32} borderRadius={16} style={{ marginRight: 8 }} color="#E1E9EE" />
                    <Skeleton width={80} height={12} color="#E1E9EE" />
                </View>
                <Skeleton width={100} height={30} borderRadius={20} color="#E1E9EE" />
            </View>
        </View>
    );
};

export const UpcomingClassesSkeleton = () => {
    return (
        <View style={{ flex: 1 }}>
            <SpotlightCardSkeleton />
            <View style={styles.resultsHeader}>
                <Skeleton width={120} height={18} color="#E1E9EE" />
                <Skeleton width={50} height={11} color="#E1E9EE" />
            </View>
            <SessionItemSkeleton />
            <SessionItemSkeleton />
        </View>
    );
};

const styles = StyleSheet.create({
    spotlightSection: {
        paddingHorizontal: 16,
        paddingTop: 15,
        marginBottom: 10,
    },
    masterClassRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    spotlightCard: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#fff',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
    },
    spotlightBottomRow: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dateColumn: {
        alignItems: 'center',
    },
    timeColumn: {
        justifyContent: 'center',
    },
    spotlightInstructorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: 16,
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 15,
    },
    horizontalCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 15,
        elevation: 1,
    },
    cardTopRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    horizontalContent: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    metricsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
    },
    instructorSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
