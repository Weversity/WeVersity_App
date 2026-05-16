import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../common/Skeleton';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export const ShortsSkeleton = () => {
    return (
        <View style={styles.container}>
            {/* Main Video Background Placeholder */}
            <Skeleton width="100%" height="100%" color="rgba(255,255,255,0.05)" />
            
            {/* Bottom Content Container */}
            <View style={styles.bottomContent}>
                <View style={styles.userRow}>
                    <Skeleton width={40} height={40} borderRadius={20} color="rgba(255,255,255,0.2)" />
                    <Skeleton width={120} height={16} style={{ marginLeft: 12 }} color="rgba(255,255,255,0.15)" />
                </View>
                <Skeleton width="80%" height={14} style={{ marginTop: 15 }} color="rgba(255,255,255,0.1)" />
                <Skeleton width="50%" height={14} style={{ marginTop: 8 }} color="rgba(255,255,255,0.1)" />
            </View>
            
            {/* Right Side Actions */}
            <View style={styles.rightActions}>
                {[1, 2, 3, 4].map(i => (
                    <View key={i} style={styles.actionItem}>
                        <Skeleton width={40} height={40} borderRadius={20} color="rgba(255,255,255,0.2)" />
                        <Skeleton width={20} height={10} style={{ marginTop: 6 }} color="rgba(255,255,255,0.15)" />
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: '#000',
        position: 'relative',
    },
    bottomContent: {
        position: 'absolute',
        bottom: 100, // Above tab bar
        left: 20,
        right: 80,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightActions: {
        position: 'absolute',
        right: 15,
        bottom: 120,
        alignItems: 'center',
        gap: 20,
    },
    actionItem: {
        alignItems: 'center',
    }
});
