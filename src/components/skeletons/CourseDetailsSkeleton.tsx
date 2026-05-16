import React from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Skeleton } from '../common/Skeleton';

const { width } = Dimensions.get('window');

export const CourseDetailsSkeleton = () => {
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header / Banner */}
            <View style={styles.header}>
                <Skeleton width="100%" height={250} color="#E1E9EE" />
            </View>
            
            <View style={styles.body}>
                {/* Title */}
                <Skeleton width="85%" height={24} style={{ marginBottom: 12 }} color="#E1E9EE" />
                
                {/* Meta Row */}
                <View style={styles.metaRow}>
                    <Skeleton width={80} height={24} borderRadius={12} color="#E1E9EE" />
                    <Skeleton width={100} height={20} color="#E1E9EE" />
                </View>
                
                {/* Price */}
                <Skeleton width={100} height={32} style={{ marginVertical: 15 }} color="#E1E9EE" />
                
                {/* Stats Panel */}
                <View style={styles.statsPanel}>
                    {[1, 2, 3].map(i => (
                        <View key={i} style={styles.statItem}>
                            <Skeleton width={18} height={18} borderRadius={9} color="#E1E9EE" />
                            <Skeleton width={80} height={12} style={{ marginLeft: 8 }} color="#E1E9EE" />
                        </View>
                    ))}
                </View>
                
                {/* Tabs */}
                <View style={styles.tabs}>
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} width={width / 4} height={40} borderRadius={20} color="#E1E9EE" />
                    ))}
                </View>
                
                {/* About Section Placeholder */}
                <View style={styles.tabContent}>
                    <Skeleton width={150} height={20} style={{ marginBottom: 15 }} color="#E1E9EE" />
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} width="100%" height={14} style={{ marginBottom: 10 }} color="#E1E9EE" />
                    ))}
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        height: 250,
    },
    body: {
        padding: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 10,
    },
    statsPanel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
        marginBottom: 20,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    tabContent: {
        marginTop: 10,
    }
});
