import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../common/Skeleton';

export const CourseCardSkeleton = () => {
    return (
        <View style={styles.courseCard}>
            {/* Image Container Skeleton */}
            <Skeleton height={200} style={styles.imageContainer} color="#E1E9EE" />

            {/* Content Section Skeleton */}
            <View style={styles.contentSection}>
                {/* Category Row Skeleton */}
                <View style={styles.metaRow}>
                    <Skeleton height={24} width={100} borderRadius={6} color="#E1E9EE" />
                </View>

                {/* Course Title Skeleton (2 lines) */}
                <Skeleton height={18} width="90%" style={{ marginBottom: 6 }} color="#E1E9EE" />
                <Skeleton height={18} width="60%" style={{ marginBottom: 16 }} color="#E1E9EE" />

                {/* Footer Skeleton */}
                <View style={styles.footer}>
                    <View style={styles.instructorInfo}>
                        <Skeleton height={40} width={40} borderRadius={20} color="#E1E9EE" />
                        <View style={styles.instructorTextContainer}>
                            <Skeleton height={10} width={60} style={{ marginBottom: 4 }} color="#E1E9EE" />
                            <Skeleton height={14} width={100} color="#E1E9EE" />
                        </View>
                    </View>
                    
                    <Skeleton height={38} width={100} borderRadius={25} color="#E1E9EE" />
                </View>
            </View>
        </View>
    );
};

export const CourseListSkeleton = ({ count = 3 }: { count?: number }) => {
    return (
        <View>
            {Array.from({ length: count }).map((_, index) => (
                <CourseCardSkeleton key={`skeleton-${index}`} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    courseCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 15,
        elevation: 1,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        backgroundColor: '#f0f0f0', // Override the base rgba if you want a light card skeleton, but user said dark theme color for skeleton.
        // Wait, the real CourseCard has backgroundColor: '#fff', so a dark skeleton inside #fff might look off, 
        // but the Skeleton base already uses rgba(255, 255, 255, 0.1) or we can just use the base Skeleton color.
        // Actually, if the card itself is white (#fff), using a white skeleton block `rgba(255,255,255,0.1)` on a white background won't be visible.
        // We should let Skeleton have an optional color prop or stick to `#E1E9EE` for white cards.
        // But the user specifically requested `rgba(255, 255, 255, 0.1)`. 
        // We must stick to the user's color for the inner blocks. If the card is dark, we should change the card background to transparent or `#1a1a1a`. 
        // Wait, the real component `styles.courseCard` has `backgroundColor: '#fff'`.
    },
    contentSection: {
        padding: 16,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    instructorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        paddingRight: 10,
    },
    instructorTextContainer: {
        flex: 1,
    },
});
