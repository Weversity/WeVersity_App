import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../common/Skeleton';

const { width } = Dimensions.get('window');

export const WalletSkeleton = () => {
    return (
        <View style={styles.container}>
            <View style={styles.financialHub}>
                <Skeleton width={120} height={22} style={{ marginBottom: 8 }} color="#E1E9EE" />
                <Skeleton width="80%" height={14} style={{ marginBottom: 15 }} color="#E1E9EE" />
                <Skeleton width={100} height={20} borderRadius={10} color="#E1E9EE" />
            </View>
            
            {/* Net Worth Card */}
            <View style={styles.netWorthCard}>
                <Skeleton width={100} height={22} borderRadius={11} style={{ marginBottom: 20 }} color="rgba(255,255,255,0.2)" />
                <View style={styles.balanceRow}>
                    <Skeleton width={150} height={40} color="rgba(255,255,255,0.2)" />
                </View>
                <Skeleton width={180} height={14} style={{ marginBottom: 25 }} color="rgba(255,255,255,0.2)" />
                <View style={styles.actionButtons}>
                    <Skeleton width="48%" height={45} borderRadius={12} color="rgba(255,255,255,0.2)" />
                    <Skeleton width="48%" height={45} borderRadius={12} color="rgba(255,255,255,0.2)" />
                </View>
            </View>
            
            {/* Yield Analytics */}
            <View style={styles.yieldContainer}>
                <View style={styles.yieldHeader}>
                    <View>
                        <Skeleton width={120} height={18} style={{ marginBottom: 6 }} color="#E1E9EE" />
                        <Skeleton width={150} height={10} color="#E1E9EE" />
                    </View>
                    <Skeleton width={60} height={20} borderRadius={6} color="#E1E9EE" />
                </View>
                <Skeleton width="100%" height={160} borderRadius={12} style={{ marginVertical: 20 }} color="#E1E9EE" />
            </View>
            
            {/* Streak Card */}
            <View style={styles.streakCard}>
                <View style={styles.streakHeader}>
                    <View>
                        <Skeleton width={100} height={18} style={{ marginBottom: 6 }} color="#E1E9EE" />
                        <Skeleton width={120} height={10} color="#E1E9EE" />
                    </View>
                    <Skeleton width={36} height={36} borderRadius={18} color="#E1E9EE" />
                </View>
                <View style={styles.streakGrid}>
                    {Array.from({ length: 7 }).map((_, i) => (
                        <Skeleton key={i} width={34} height={34} borderRadius={17} color="#E1E9EE" />
                    ))}
                </View>
                <Skeleton width="100%" height={12} style={{ marginVertical: 15 }} color="#E1E9EE" />
                <Skeleton width="100%" height={45} borderRadius={16} color="#E1E9EE" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    financialHub: {
        marginBottom: 25,
    },
    netWorthCard: {
        backgroundColor: '#1A1C2E',
        borderRadius: 24,
        padding: 24,
        marginBottom: 25,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    yieldContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 25,
        elevation: 2,
    },
    yieldHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    streakCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 25,
        elevation: 2,
    },
    streakHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    streakGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
});
