import React from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Skeleton } from '../common/Skeleton';

const { width } = Dimensions.get('window');

export const LearningSkeleton = () => {
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Player Placeholder */}
            <View style={styles.playerContainer}>
                <Skeleton width="100%" height={220} color="#E1E9EE" />
            </View>
            
            <View style={styles.body}>
                {/* Title */}
                <Skeleton width="80%" height={24} style={{ marginVertical: 20 }} color="#E1E9EE" />
                
                {/* Content Lines */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <Skeleton key={i} width={i % 2 === 0 ? "100%" : "90%"} height={14} style={{ marginBottom: 12 }} color="#E1E9EE" />
                ))}
                
                {/* Action Button */}
                <Skeleton width="100%" height={50} borderRadius={12} style={{ marginTop: 30 }} color="#E1E9EE" />
            </View>
        </ScrollView>
    );
};

export const LessonListSkeleton = () => {
    return (
        <View style={styles.lessonListContainer}>
            {[1, 2, 3, 4, 5, 6].map(i => (
                <View key={i} style={styles.lessonRow}>
                    <Skeleton width={32} height={32} borderRadius={16} color="#E1E9EE" />
                    <Skeleton width={width * 0.5} height={14} style={{ marginLeft: 12 }} color="#E1E9EE" />
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    playerContainer: {
        width: '100%',
        height: 220,
        backgroundColor: '#000',
    },
    body: {
        padding: 20,
    },
    lessonListContainer: {
        padding: 15,
    },
    lessonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingLeft: 10,
    },
});
