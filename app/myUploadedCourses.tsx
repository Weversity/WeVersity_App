import { useAuth } from '@/src/context/AuthContext';
// @ts-ignore
import { courseService } from '@/src/services/courseService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface UploadedCourse {
    id: string;
    title: string;
    categories: string;
    is_published?: boolean;
    image_url?: string | null;
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
            const mappedCourses: UploadedCourse[] = data.map((item: any) => ({
                id: item.id,
                title: item.title,
                categories: item.categories,
                is_published: item.is_published,
                image_url: item.image_url,
                price: Number(item.price) || 0,
            }));
            setCourses(mappedCourses);
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
                            {(item.price === 0 || !item.price) ? '$0' : `$${item.price}`}
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
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Your Uploaded Courses</Text>
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
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#8A2BE2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start', // Align to left
    },
    headerText: {
        fontSize: 18, // Reduced size
        fontWeight: 'bold',
        color: '#fff',
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Premium glass look
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12, // Gap between icon and text
    },
    listContent: {
        padding: 20,
        paddingTop: 25,
    },
    courseCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFDFF', // Matching ultra-light premium purple
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        // Soft professional black shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0EFFF',
        alignItems: 'center',
    },
    imageWrapper: {
        position: 'relative',
    },
    courseImage: {
        width: 85,
        height: 85,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
    },
    courseContent: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    courseTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#000',
        lineHeight: 20,
    },
    courseCategory: {
        fontSize: 11,
        color: '#8A2BE2',
        fontWeight: '600',
        marginBottom: 8,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    statusBadgePill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusPublishedPill: {
        backgroundColor: '#E6FFFA',
    },
    statusDraftPill: {
        backgroundColor: '#FFF5F5',
    },
    statusTextPill: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    statusTextPublished: {
        color: '#319795',
    },
    statusTextDraft: {
        color: '#E53E3E',
    },
    priceBadgePillRow: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeFree: {
        backgroundColor: '#EBF8FF',
    },
    badgePaid: {
        backgroundColor: '#FEFCBF',
    },
    priceBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#3182CE',
    },
});
