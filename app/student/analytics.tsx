import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, StatusBar, ActivityIndicator, Animated } from 'react-native';
import { AnalyticsSkeleton } from '@/src/components/skeletons/AnalyticsSkeleton';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

// Dummy Data for Graph (Keep static for now until learning sessions API is built)
const weeklyData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      data: [1.5, 3, 2, 4.5, 3.5, 6, 5], // Hours
      color: (opacity = 1) => `rgba(138, 43, 226, ${opacity})`, // Purple
      strokeWidth: 4
    }
  ]
};

interface CourseTracking {
    id: string;
    name: string;
    progress: number;
    bestScore: number | null;
}

export default function StudentAnalytics() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        enrolled: 0,
        completed: 0,
        avgScore: 0
    });
    const [courseTracking, setCourseTracking] = useState<CourseTracking[]>([]);
    
    // Shimmer Animation for Progress Bar
    const shimmerAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        fetchAnalyticsData();
        
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 300,
                duration: 1500,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            // @ts-ignore
            const { supabase } = await import('@/src/auth/supabase');
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Enrollments & Courses
            const { data: enrollments, error: enrollmentsError } = await supabase
                .from('enrollments')
                .select(`
                    id,
                    status,
                    completed_lessons,
                    created_at,
                    course_id,
                    course:courses(id, title, total_lessons)
                `)
                .eq('student_id', user.id);

            if (enrollmentsError) {
                console.error("Enrollments Fetch Error:", enrollmentsError);
            }

            // 2. Fetch Quiz Attempts for average score and best scores
            const { data: quizzes, error: quizzesError } = await supabase
                .from('quiz_attempts')
                .select('score, course_id')
                .eq('student_id', user.id);

            if (quizzesError) {
                console.error("Quizzes Fetch Error:", quizzesError);
            }

            // Calculate Top Stats
            const enrolledCount = enrollments ? enrollments.length : 0;
            const completedCount = enrollments ? enrollments.filter(e => e.status === 'completed').length : 0;
            
            let avgScore = 0;
            if (quizzes && quizzes.length > 0) {
                const totalScore = quizzes.reduce((sum, q) => sum + (q.score || 0), 0);
                avgScore = totalScore / quizzes.length;
            }

            setStats({
                enrolled: enrolledCount,
                completed: completedCount,
                avgScore: Math.round(avgScore)
            });

            // Process Detailed Course Tracking Table
            if (enrollments) {
                const trackingData: CourseTracking[] = enrollments.map(e => {
                    const courseInfo = Array.isArray(e.course) ? e.course[0] : e.course;
                    
                    // Calculate Progress
                    const completedLessonsCount = Array.isArray(e.completed_lessons) ? e.completed_lessons.length : 0;
                    const totalLessons = courseInfo?.total_lessons || 1;
                    const progress = completedLessonsCount / totalLessons;

                    // Get Best Score
                    const courseQuizzes = quizzes?.filter(q => q.course_id === e.course_id) || [];
                    const bestScore = courseQuizzes.length > 0 
                        ? Math.max(...courseQuizzes.map(q => q.score || 0)) 
                        : null;

                    return {
                        id: e.id,
                        name: courseInfo?.title || 'Unknown Course',
                        progress: Math.min(progress, 1),
                        bestScore: bestScore
                    };
                });
                setCourseTracking(trackingData);
            }

        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Analytics</Text>
            </View>

            {loading ? (
                <AnalyticsSkeleton />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <View style={[styles.iconWrapper, { backgroundColor: '#F3E5F5' }]}>
                                <Ionicons name="flash" size={18} color="#8A2BE2" />
                            </View>
                            <Text style={styles.statValue}>{stats.enrolled}</Text>
                            <Text style={styles.statLabel}>Enrolled Courses</Text>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.iconWrapper, { backgroundColor: '#E8F5E9' }]}>
                                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                            </View>
                            <Text style={styles.statValue}>{stats.completed}</Text>
                            <Text style={styles.statLabel}>Completed Courses</Text>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.iconWrapper, { backgroundColor: '#E3F2FD' }]}>
                                <Ionicons name="document-text" size={18} color="#2196F3" />
                            </View>
                            <Text style={styles.statValue}>{stats.avgScore}%</Text>
                            <Text style={styles.statLabel}>Avg. Quiz Score</Text>
                        </View>
                    </View>

                    {/* Graph Section */}
                    <View style={styles.graphCard}>
                        <Text style={styles.sectionTitle}>Learning Progress</Text>
                        <Text style={styles.sectionSubtitle}>Hours spent learning this week</Text>
                        
                        <LineChart
                            data={weeklyData}
                            width={width - 70}
                            height={220}
                            chartConfig={{
                                backgroundColor: '#ffffff',
                                backgroundGradientFrom: '#ffffff',
                                backgroundGradientTo: '#ffffff',
                                decimalPlaces: 1,
                                color: (opacity = 1) => `rgba(138, 43, 226, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(150, 150, 150, ${opacity})`,
                                style: { borderRadius: 16 },
                                propsForDots: { r: "4", strokeWidth: "2", stroke: "#8A2BE2", fill: "#fff" },
                                propsForBackgroundLines: { strokeDasharray: "", stroke: "rgba(0,0,0,0.05)" }
                            }}
                            bezier
                            style={{ marginVertical: 8, borderRadius: 16, marginLeft: -15 }}
                            withVerticalLines={false}
                            withHorizontalLines={true}
                        />
                    </View>

                    {/* Detailed Course Tracking Table */}
                    <View style={styles.trackingCard}>
                        <Text style={styles.sectionTitle}>Course-wise Tracking</Text>
                        <Text style={styles.sectionSubtitle}>Detailed progress and achievements per course.</Text>

                        {courseTracking.length === 0 ? (
                            <Text style={styles.emptyText}>No enrolled courses yet.</Text>
                        ) : (
                            <View style={styles.tableContainer}>
                                {courseTracking.map((course) => (
                                    <View key={course.id} style={styles.courseCard}>
                                        <View style={styles.courseHeader}>
                                            <Text style={styles.courseName} numberOfLines={2}>{course.name}</Text>
                                            <Text style={styles.scoreText}>
                                                Score: {course.bestScore !== null ? `${course.bestScore}%` : '-'}
                                            </Text>
                                        </View>

                                        <View style={styles.progressRow}>
                                            <View style={styles.progressBarBackground}>
                                                <View style={[styles.progressBarFill, { width: `${course.progress * 100}%` }]}>
                                                    <Animated.View style={[styles.shimmerEffect, { transform: [{ translateX: shimmerAnim }] }]} />
                                                </View>
                                            </View>
                                            <Text style={styles.progressText}>{Math.round(course.progress * 100)}%</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA', // Premium light grey
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 14,
    },
    header: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#8A2BE2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: '#FFFFFF',
        width: '31%',
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 10,
        color: '#888',
        textAlign: 'center',
        lineHeight: 14,
    },
    graphCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#888',
        marginBottom: 16,
    },
    trackingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    emptyText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginVertical: 20,
    },
    tableContainer: {
        marginTop: 5,
    },
    courseCard: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    courseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    courseName: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        paddingRight: 10,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBarBackground: {
        flex: 1,
        height: 6,
        backgroundColor: '#F3E5F5',
        borderRadius: 3,
        overflow: 'hidden',
        marginRight: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#8A2BE2',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#8A2BE2',
        width: 30,
        textAlign: 'right',
    },
    scoreText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#777',
    },
    shimmerEffect: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 30,
        backgroundColor: 'rgba(255,255,255,0.4)',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    }
});
