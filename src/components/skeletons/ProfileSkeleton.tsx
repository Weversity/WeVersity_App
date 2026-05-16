import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../common/Skeleton';

const { width } = Dimensions.get('window');

export const ProfileHeaderSkeleton = () => {
    return (
        <View style={styles.header}>
            <View style={styles.topBar}>
                <View style={styles.profileContainer}>
                    <Skeleton width={40} height={40} borderRadius={20} color="rgba(255,255,255,0.2)" />
                    <View style={styles.profileTextContainer}>
                        <Skeleton width={60} height={10} style={{ marginBottom: 4 }} color="rgba(255,255,255,0.2)" />
                        <Skeleton width={120} height={16} color="rgba(255,255,255,0.2)" />
                    </View>
                </View>
                <View style={styles.topBarRight}>
                    <Skeleton width={80} height={26} borderRadius={20} color="rgba(255,255,255,0.2)" />
                    <Skeleton width={28} height={28} borderRadius={8} color="rgba(255,255,255,0.2)" />
                </View>
            </View>
        </View>
    );
};

export const WelcomeCardSkeleton = () => {
    return (
        <View style={styles.welcomeCard}>
            <Skeleton width={200} height={22} style={{ marginBottom: 10 }} color="rgba(255,255,255,0.2)" />
            <Skeleton width={150} height={13} style={{ marginBottom: 15 }} color="rgba(255,255,255,0.2)" />
            <Skeleton width={100} height={30} borderRadius={20} color="rgba(255,255,255,0.2)" />
        </View>
    );
};

export const StatCardSkeleton = () => {
    return (
        <View style={styles.statCard}>
            <Skeleton width={32} height={32} borderRadius={16} style={styles.statIcon} color="#E1E9EE" />
            <Skeleton width="70%" height={10} style={{ marginBottom: 8 }} color="#E1E9EE" />
            <Skeleton width="40%" height={18} color="#E1E9EE" />
        </View>
    );
};

export const ProfileSkeleton = ({ role = 'Student' }: { role?: string }) => {
    return (
        <View style={styles.container}>
            <ProfileHeaderSkeleton />
            <View style={{ padding: 20 }}>
                <WelcomeCardSkeleton />
                
                {role === 'Instructor' ? (
                    <View style={styles.statGrid}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <StatCardSkeleton key={`stat-${i}`} />
                        ))}
                    </View>
                ) : (
                    <>
                        <View style={styles.sectionHeader}>
                            <Skeleton width={100} height={18} color="#E1E9EE" />
                        </View>
                        <View style={styles.horizontalScroll}>
                            <Skeleton width={width * 0.85} height={180} borderRadius={20} style={{ marginRight: 15 }} color="#E1E9EE" />
                        </View>
                    </>
                )}

                <View style={styles.sectionHeader}>
                    <Skeleton width={120} height={18} color="#E1E9EE" />
                </View>
                <View style={styles.horizontalScroll}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <View key={`mentor-${i}`} style={{ marginRight: 20, alignItems: 'center' }}>
                            <Skeleton width={60} height={60} borderRadius={30} style={{ marginBottom: 8 }} color="#E1E9EE" />
                            <Skeleton width={50} height={10} color="#E1E9EE" />
                        </View>
                    ))}
                </View>

                <View style={styles.sectionHeader}>
                    <Skeleton width={150} height={18} color="#E1E9EE" />
                </View>
                {Array.from({ length: 3 }).map((_, i) => (
                    <View key={`recent-${i}`} style={styles.learningCard}>
                        <Skeleton width={60} height={60} borderRadius={12} style={{ marginRight: 15 }} color="#E1E9EE" />
                        <View style={{ flex: 1 }}>
                            <Skeleton width="90%" height={16} style={{ marginBottom: 6 }} color="#E1E9EE" />
                            <Skeleton width="60%" height={12} style={{ marginBottom: 10 }} color="#E1E9EE" />
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
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#8A2BE2',
        paddingTop: 50,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 15,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileTextContainer: {
        marginLeft: 10,
    },
    topBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    welcomeCard: {
        backgroundColor: '#8A2BE2',
        borderRadius: 20,
        padding: 20,
        marginBottom: 25,
    },
    sectionHeader: {
        marginBottom: 15,
        marginTop: 10,
    },
    horizontalScroll: {
        flexDirection: 'row',
        marginBottom: 25,
    },
    learningCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        alignItems: 'center',
    },
    statGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        width: (width - 60) / 2,
        backgroundColor: '#F7F0FF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 15,
    },
    statIcon: {
        marginBottom: 12,
    },
});
