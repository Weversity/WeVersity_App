import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Image,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
    FlatList,
    Animated
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/src/auth/supabase';
import { courseService } from '@/src/services/courseService';
import { InstructorStats, EnrollmentDetail } from '@/src/types';

const { width } = Dimensions.get('window');

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const AnimatedProgressBar = ({ progress }: { progress: number }) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                })
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, width]
    });

    return (
        <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFillContainer, { width: `${progress}%` }]}>
                <LinearGradient
                    colors={['#8A2BE2', '#9D50E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
                <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[{ flex: 1, width: 100 }]}
                    />
                </Animated.View>
            </View>
        </View>
    );
};

const GlassCard = ({ children, style }: { children: React.ReactNode, style?: any }) => (
    <View style={[styles.glassCard, style]}>
        {children}
    </View>
);

const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
    <GlassCard style={styles.statCard}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
    </GlassCard>
);

const MetricCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
    <GlassCard style={styles.metricCard}>
        <View style={styles.metricRow}>
            <View style={[styles.iconContainerSmall, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={styles.metricTextContainer}>
                <Text style={styles.metricValue}>{value}</Text>
                <Text style={styles.metricTitle}>{title}</Text>
            </View>
        </View>
    </GlassCard>
);

export default function AnalyticsScreen() {
    const { id: instructorId } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<InstructorStats | null>(null);
    const [detailedData, setDetailedData] = useState<any>(null);
    const [recentEnrollments, setRecentEnrollments] = useState<EnrollmentDetail[]>([]);

    const fetchData = async () => {
        if (!instructorId) return;
        try {
            const [baseStats, detailed, enrollments] = await Promise.all([
                courseService.fetchInstructorStats(instructorId as string),
                courseService.fetchDetailedInstructorAnalytics(instructorId as string),
                courseService.fetchRecentEnrollments(instructorId as string, 5)
            ]);
            setStats(baseStats);
            setDetailedData(detailed);
            setRecentEnrollments(enrollments);
        } catch (error) {
            console.error("Error fetching analytics data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [instructorId]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [instructorId]);

    // Render Enrollment is handled inline now to avoid type issues

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" />
                <ActivityIndicator size="large" color="#8A2BE2" />
                <Text style={styles.loadingText}>Loading Analytics...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <LinearGradient
                    colors={['#8A2BE2', '#9D50E5']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Analytics Dashboard</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A2BE2" colors={['#8A2BE2']} />}
            >
                {/* Top Stats Cards */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topStatsContainer}>
                    <StatCard title="Total Students" value={stats?.totalStudents || 0} icon="people-outline" color="#4cc9f0" />
                    <StatCard title="Total Courses" value={stats?.totalCourses || 0} icon="book-outline" color="#f72585" />
                    <StatCard title="Total Earnings" value={`$${stats?.lifetimeEarnings || 0}`} icon="cash-outline" color="#4ade80" />
                    <StatCard title="Live Sessions" value={stats?.liveSessions || 0} icon="videocam-outline" color="#fbbf24" />
                </ScrollView>

                {/* Mid Metrics Cards */}
                <View style={styles.midMetricsContainer}>
                    <MetricCard title="Quiz Items" value={detailedData?.totalQuizzes || 0} icon="help-circle-outline" color="#8A2BE2" />
                    <MetricCard title="Quiz Attempts" value={detailedData?.totalAttempts || 0} icon="checkmark-done-outline" color="#3b82f6" />
                </View>

                {/* Earnings per Course */}
                <Text style={styles.sectionTitle}>Earnings per Course</Text>
                <GlassCard style={styles.listCard}>
                    {detailedData?.earningsPerCourse?.length > 0 ? (
                        detailedData.earningsPerCourse.map((item: any, index: number) => (
                            <View key={item.id || index} style={styles.listItem}>
                                <Text style={styles.listItemTitle} numberOfLines={1}>{item.course_title || 'Course Name Missing'}</Text>
                                <Text style={styles.listItemValue}>${item.earnings || 0}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No data available</Text>
                    )}
                </GlassCard>

                {/* Students per Course */}
                <Text style={styles.sectionTitle}>Students per Course</Text>
                <GlassCard style={styles.listCard}>
                    {detailedData?.studentsPerCourse?.length > 0 ? (
                        detailedData.studentsPerCourse.map((item: any, index: number) => {
                            const studentCount = item.total_students || item.studentCount || item.students || 0;
                            const maxStudents = Math.max(...detailedData.studentsPerCourse.map((s: any) => s.total_students || s.studentCount || s.students || 0), 1);
                            const progress = (studentCount / maxStudents) * 100;
                            return (
                                <View key={item.id || index} style={styles.progressItem}>
                                    <View style={styles.progressHeader}>
                                        <Text style={styles.listItemTitle} numberOfLines={1}>{item.course_title || 'Course Name Missing'}</Text>
                                        <Text style={styles.progressValue}>{studentCount} STUDENTS</Text>
                                    </View>
                                    <AnimatedProgressBar progress={progress} />
                                </View>
                            );
                        })
                    ) : (
                        <Text style={styles.emptyText}>No data available</Text>
                    )}
                </GlassCard>

                {/* Recent Enrollments */}
                <Text style={styles.sectionTitle}>Recent Enrollments</Text>
                <GlassCard style={styles.tableCard}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, styles.studentCol]}>STUDENT</Text>
                        <Text style={[styles.tableHeaderText, styles.courseCol]}>COURSE</Text>
                        <Text style={[styles.tableHeaderText, styles.dateCol]}>DATE</Text>
                    </View>
                    {recentEnrollments.length > 0 ? (
                        recentEnrollments.map((item: any, index: number) => (
                            <View key={item.id || index}>
                                <View style={styles.tableRow}>
                                    <View style={styles.studentCol}>
                                        <Image 
                                            source={{ uri: item.avatar_url || 'https://via.placeholder.com/40' }} 
                                            style={styles.studentAvatar} 
                                        />
                                        <Text style={styles.studentName} numberOfLines={1}>{item.full_name || 'Student'}</Text>
                                    </View>
                                    <Text style={styles.courseCol} numberOfLines={1}>{item.course_title || 'Course'}</Text>
                                    <Text style={styles.dateCol}>{formatDate(item.enrolled_at)}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No recent enrollments</Text>
                    )}
                </GlassCard>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    loadingContainer: { flex: 1, backgroundColor: '#fcfcfc', justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#333', marginTop: 15, fontSize: 16, fontWeight: '500' },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        overflow: 'hidden',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 15,
    },
    backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    scrollContent: { paddingTop: 25, paddingBottom: 40 },
    topStatsContainer: { paddingLeft: 20, marginBottom: 25 },
    statCard: {
        width: 150,
        marginRight: 15,
        padding: 20,
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    statTitle: { fontSize: 12, color: '#666', fontWeight: '500' },
    
    midMetricsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    metricCard: {
        width: '48%',
        padding: 15,
    },
    metricRow: { flexDirection: 'row', alignItems: 'center' },
    iconContainerSmall: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    metricTextContainer: { flex: 1 },
    metricValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    metricTitle: { fontSize: 10, color: '#888', fontWeight: '600', textTransform: 'uppercase' },

    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginHorizontal: 20,
        marginBottom: 15,
        marginTop: 10,
    },
    glassCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    listCard: { marginHorizontal: 20, padding: 20, marginBottom: 25 },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    listItemTitle: { flex: 1, fontSize: 14, color: '#555', fontWeight: '500' },
    listItemValue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 15 },
    
    progressItem: { marginBottom: 20 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressValue: { fontSize: 10, color: '#8A2BE2', fontWeight: 'bold' },
    progressBarBg: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
    progressBarFillContainer: { height: '100%', borderRadius: 3, overflow: 'hidden' },

    tableCard: { marginHorizontal: 20, padding: 15, marginBottom: 25 },
    tableHeader: { flexDirection: 'row', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    tableHeaderText: { fontSize: 10, color: '#888', fontWeight: 'bold', letterSpacing: 1 },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
    studentCol: { flex: 2, flexDirection: 'row', alignItems: 'center' },
    courseCol: { flex: 2, fontSize: 12, color: '#666' },
    dateCol: { flex: 1, fontSize: 11, color: '#888', textAlign: 'right' },
    studentAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10 },
    studentName: { fontSize: 13, color: '#333', fontWeight: '500' },

    emptyText: { color: '#999', textAlign: 'center', paddingVertical: 20, fontStyle: 'italic' },
});
