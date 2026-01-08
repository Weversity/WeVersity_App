import { supabase } from '@/src/auth/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Course {
    id: any;
    title: string;
    image_url: string;
    price: string;
    rating: number;
    description: string;
    status: string;
    categories: string;
    reviewCount?: number;
}

interface InstructorProfile {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    bio: string;
}

interface InstructorStats {
    totalStudents: number | null;
    totalCourses: number | null;
    overallRating: number | null;
}

export default function InstructorAnalyticsScreen() {
    const { id, name, avatar, initials } = useLocalSearchParams();
    const router = useRouter();

    const [profile, setProfile] = useState<InstructorProfile | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [stats, setStats] = useState<InstructorStats>({
        totalStudents: null,
        totalCourses: null,
        overallRating: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);

            try {
                // 1. Fetch Profile Details
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, avatar_url, bio')
                    .eq('id', id)
                    .single();

                if (profileData) {
                    setProfile({
                        id: profileData.id,
                        first_name: profileData.first_name,
                        last_name: profileData.last_name,
                        avatar_url: profileData.avatar_url,
                        bio: profileData.bio || 'No bio available',
                    });
                }

                // 2. Fetch All Courses by this Instructor with Stats and Status
                // Assuming columns: status (text), categories (text) exist
                const { data: coursesData } = await supabase
                    .from('courses')
                    .select(`
                        id, 
                        title, 
                        image_url, 
                        price, 
                        description,
                        status,
                        categories,
                        reviews (rating)
                    `)
                    .eq('instructor_id', id)
                    .order('created_at', { ascending: false });

                let processedCourses: Course[] = [];
                let allCourseIds: any[] = [];
                let totalRatingSum = 0;
                let totalRatingCount = 0;

                if (coursesData) {
                    processedCourses = coursesData.map((c: any) => {
                        allCourseIds.push(c.id);

                        // Calculate average rating for this specific course
                        let courseRatingSum = 0;
                        let courseRatingCount = 0;
                        if (c.reviews && Array.isArray(c.reviews)) {
                            c.reviews.forEach((r: any) => {
                                if (r.rating) {
                                    courseRatingSum += r.rating;
                                    courseRatingCount++;

                                    // Global accumulator
                                    totalRatingSum += r.rating;
                                    totalRatingCount++;
                                }
                            });
                        }

                        const avgRating = courseRatingCount > 0 ? (courseRatingSum / courseRatingCount) : 0;

                        return {
                            id: c.id,
                            title: c.title,
                            image_url: c.image_url,
                            price: c.price,
                            rating: avgRating, // Real calculated average
                            description: c.description,
                            status: c.status || 'Pre-Launch', // Default if null
                            categories: c.categories || 'General',
                            reviewCount: courseRatingCount
                        };
                    });
                }

                setCourses(processedCourses);

                // 3. Calculate Stats
                const totalCourses = processedCourses.length;
                const overallRating = totalRatingCount > 0 ? (totalRatingSum / totalRatingCount) : 0;

                // 4. Calculate Total Students (Unique enrollments for these courses)
                let totalStudents = 0;
                if (allCourseIds.length > 0) {
                    // We need unique student_ids
                    const { data: enrollmentData } = await supabase
                        .from('enrollments')
                        .select('student_id')
                        .in('course_id', allCourseIds);

                    if (enrollmentData) {
                        const uniqueStudents = new Set(enrollmentData.map(e => e.student_id));
                        totalStudents = uniqueStudents.size;
                    }
                }

                setStats({
                    totalCourses,
                    overallRating,
                    totalStudents,
                });

            } catch (error) {
                console.error("Error fetching instructor data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const displayName = profile
        ? `${profile.first_name} ${profile.last_name}`.trim()
        : (name as string) || 'Instructor';

    const displayAvatar = profile?.avatar_url || (avatar as string);
    const displayInitials = initials as string || 'IN';

    const renderCourseCard = ({ item }: { item: Course }) => {
        const isPublished = item.status?.toLowerCase() === 'published';
        const badgeColor = isPublished ? '#E8F5E9' : '#FFF3E0'; // Light Green vs Light Orange
        const badgeTextColor = isPublished ? '#2E7D32' : '#EF6C00'; // Dark Green vs Dark Orange
        const statusText = item.status || 'Draft';

        return (
            <TouchableOpacity
                style={styles.courseCard}
                onPress={() => router.push(`/courseDetails/${item.id}` as any)}
                activeOpacity={0.9}
            >
                <Image
                    source={{ uri: item.image_url || 'https://via.placeholder.com/300x160' }}
                    style={styles.courseImage}
                />
                <View style={styles.courseInfo}>
                    <View style={styles.topRow}>
                        <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
                            <Text style={[styles.statusText, { color: badgeTextColor }]}>{statusText}</Text>
                        </View>
                        <Text style={styles.categoryTag}>{item.categories}</Text>
                    </View>

                    <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>

                    <View style={styles.courseMeta}>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.ratingText}>
                                {item.rating > 0 ? item.rating.toFixed(1) : 'New'}
                                {item.reviewCount ? ` (${item.reviewCount})` : ''}
                            </Text>
                        </View>
                        <Text style={styles.priceText}>{item.price === '0' || item.price === 'Free' ? 'Free' : item.price}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Instructor Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        {displayAvatar ? (
                            <Image source={{ uri: displayAvatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.initialsContainer]}>
                                <Text style={styles.initialsText}>{displayInitials}</Text>
                            </View>
                        )}
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.name}>{displayName}</Text>
                    <Text style={styles.tag}>Professional Mentor</Text>
                    <Text style={styles.bio}>{profile?.bio || 'No bio available'}</Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <View style={styles.statIconBox}>
                            <Ionicons name="people" size={20} color="#8A2BE2" />
                        </View>
                        <Text style={styles.statValue}>{stats.totalStudents !== null ? stats.totalStudents : '-'}</Text>
                        <Text style={styles.statLabel}>Students</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={styles.statIconBox}>
                            <Ionicons name="book" size={20} color="#8A2BE2" />
                        </View>
                        <Text style={styles.statValue}>{stats.totalCourses !== null ? stats.totalCourses : '-'}</Text>
                        <Text style={styles.statLabel}>Courses</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={styles.statIconBox}>
                            <Ionicons name="star" size={20} color="#8A2BE2" />
                        </View>
                        <Text style={styles.statValue}>{stats.overallRating !== null ? stats.overallRating.toFixed(1) : '-'}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                </View>

                {/* Courses List */}
                <View style={styles.coursesSection}>
                    <Text style={styles.sectionTitle}>Courses by {displayName.split(' ')[0]}</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#8A2BE2" style={{ marginTop: 20 }} />
                    ) : courses.length > 0 ? (
                        <FlatList
                            data={courses}
                            renderItem={renderCourseCard}
                            keyExtractor={item => item.id}
                            scrollEnabled={false} // Since it's inside ScrollView
                            contentContainerStyle={styles.coursesList}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="albums-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No courses uploaded yet.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
        paddingBottom: 20,
        backgroundColor: '#8A2BE2',
    },
    backButton: { padding: 5 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    scrollContent: { paddingBottom: 40 },

    profileSection: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 20,
    },
    avatarContainer: { position: 'relative', marginBottom: 15 },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#F0E6FF' },
    initialsContainer: { backgroundColor: '#E6E6FA', justifyContent: 'center', alignItems: 'center' },
    initialsText: { fontSize: 36, color: '#8A2BE2', fontWeight: 'bold' },
    verifiedBadge: {
        position: 'absolute', bottom: 5, right: 5,
        backgroundColor: '#4CAF50', width: 24, height: 24, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff'
    },
    name: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    tag: { fontSize: 14, color: '#8A2BE2', fontWeight: '600', marginBottom: 10, backgroundColor: '#F3E5F5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    bio: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },

    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 16,
        paddingVertical: 20,
        justifyContent: 'space-evenly',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
        marginBottom: 25,
    },
    statItem: { alignItems: 'center', flex: 1 },
    statIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3E5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    statLabel: { fontSize: 12, color: '#888' },
    statDivider: { width: 1, height: 40, backgroundColor: '#eee' },

    coursesSection: { paddingHorizontal: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    coursesList: { gap: 15 },
    courseCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        // padding: 12, // Reduced padding for better image spread
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 }, // Softer shadow
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 10,
        overflow: 'hidden', // Contain image
    },
    courseImage: {
        width: '100%',
        height: 180, // Bigger image
        backgroundColor: '#eee'
    },
    courseInfo: {
        padding: 15
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        alignItems: 'center'
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    categoryTag: {
        fontSize: 12,
        color: '#8A2BE2',
        fontWeight: '600',
        backgroundColor: '#F3E5F5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    courseTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 10, lineHeight: 24 },
    courseMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
    ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    ratingText: { fontSize: 13, fontWeight: '600', color: '#555' },
    priceText: { fontSize: 16, fontWeight: 'bold', color: '#8A2BE2' },

    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { color: '#999', marginTop: 10, fontSize: 16 },
});
