import { useAuth } from '@/src/context/AuthContext';
import { courseService } from '@/src/services/courseService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface UploadedCourse {
    id: string;
    title: string;
    categories: string;
    is_published: boolean;
    image_url: string;
    price: number | null;
}

export default function MyUploadedCoursesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [courses, setCourses] = useState<UploadedCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchCourses();
        }
    }, [user?.id]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const data = await courseService.fetchInstructorCourses(user.id);
            setCourses(data);
        } catch (error: any) {
            if (error?.name === 'AuthSessionMissingError' || error?.message?.includes('session')) return;
            console.error('Error fetching uploaded courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderCourseItem = ({ item }: { item: UploadedCourse }) => (
        <View style={styles.courseCard}>
            <View style={styles.imageWrapper}>
                <Image
                    source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                    style={styles.courseImage}
                />
            </View>

            <View style={styles.courseContent}>
                <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
                <View style={{ height: 4 }} />
                <Text style={styles.courseCategory}>{item.categories || 'Uncategorized'}</Text>

                <View style={styles.badgeRow}>
                    <View style={[styles.statusBadgePill, item.is_published ? styles.statusPublishedPill : styles.statusDraftPill]}>
                        <Text style={[styles.statusTextPill, item.is_published ? styles.statusTextPublished : styles.statusTextDraft]}>
                            {item.is_published ? 'PUBLISHED' : 'DRAFT'}
                        </Text>
                    </View>

                    <View style={[styles.priceBadgePillRow, (item.price === 0 || !item.price) ? styles.badgeFree : styles.badgePaid]}>
                        <Text style={styles.priceBadgeText}>
                            {(item.price === 0 || !item.price) ? 'FREE' : 'PAID'}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Your Uploaded Courses</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#8A2BE2" />
                    <Text style={styles.loadingText}>Fetching your courses...</Text>
                </View>
            ) : (
                <FlatList
                    data={courses}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCourseItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FE',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
    header: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 5 : 45,
        paddingBottom: 25,
        paddingHorizontal: 20,
        backgroundColor: '#8A2BE2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    backButton: {
        padding: 5,
    },
    listContent: {
        padding: 20,
        paddingTop: 30,
    },
    courseCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 24,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(224, 212, 252, 0.4)',
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        alignItems: 'center',
    },
    imageWrapper: {
        position: 'relative',
    },
    courseImage: {
        width: 100,
        height: 100,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    badgeFree: {
        backgroundColor: '#2196F3',
    },
    badgePaid: {
        backgroundColor: '#FFD700',
    },
    priceBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#fff',
    },
    priceBadgePillRow: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
        marginTop: 4,
    },
    courseContent: {
        flex: 1,
        marginLeft: 20,
        justifyContent: 'center',
    },
    courseTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        lineHeight: 24,
    },
    courseCategory: {
        fontSize: 13,
        color: '#8A2BE2',
        fontWeight: '600',
        marginBottom: 10,
    },
    statusBadgePill: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 25,
    },
    statusPublishedPill: {
        backgroundColor: '#E8F5E9',
    },
    statusDraftPill: {
        backgroundColor: '#FFF3E0',
    },
    statusTextPill: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    statusTextPublished: {
        color: '#4CAF50',
    },
    statusTextDraft: {
        color: '#FF9800',
    },
});
