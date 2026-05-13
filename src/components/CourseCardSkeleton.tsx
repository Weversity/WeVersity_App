import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Skeleton } from './common/Skeleton';

interface CourseCardSkeletonProps {
    index?: number;
}

export const CourseCardSkeleton: React.FC<CourseCardSkeletonProps> = ({ index = 0 }) => {
    // Delay animation based on index to create a staggered entrance effect
    const delay = index * 100;

    return (
        <Animated.View 
            entering={FadeInDown.delay(delay).duration(500).springify().damping(18).stiffness(90)}
            style={styles.card}
        >
            <View style={styles.cardLeft}>
                <Skeleton width={80} height={80} borderRadius={16} />
            </View>
            <View style={styles.cardMiddle}>
                <Skeleton width="30%" height={12} borderRadius={6} style={{ marginBottom: 10 }} />
                <Skeleton width="90%" height={16} borderRadius={6} style={{ marginBottom: 6 }} />
                <Skeleton width="60%" height={16} borderRadius={6} style={{ marginBottom: 14 }} />
                
                <View style={styles.priceRow}>
                    <Skeleton width={40} height={14} borderRadius={4} />
                    <Skeleton width={60} height={14} borderRadius={4} />
                </View>
            </View>
            <View style={styles.bookmarkPlaceholder}>
                <Skeleton width={32} height={32} borderRadius={16} />
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 20, // Increased border radius for luxury feel
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000', // Added subtle shadow
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardLeft: {
        marginRight: 14,
    },
    cardMiddle: {
        flex: 1,
        marginRight: 10,
        justifyContent: 'center',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    bookmarkPlaceholder: {
        padding: 4,
        alignSelf: 'flex-start',
    }
});
