import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '@/src/auth/supabase'; 
import { AnimatedHeaderView, AnimatedBodyView } from '../../src/components/common/ContentTransitions';

const { width } = Dimensions.get('window');

interface AnalyticsData {
    totalStudents: number;
    totalCourses: number;
    totalEarnings: number;
    liveSessions: number;
    totalQuizzesAndAssignments: number;
    totalQuizAttempts: number;
    earningsPerCourse: { courseTitle: string; earnings: number }[];
    studentsPerCourse: { courseTitle: string; studentCount: number }[];
    recentEnrollments: { studentName: string; courseTitle: string; date: string }[];
}

const FullScreenSkeleton = () => {
    const animValue = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animValue, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(animValue, { toValue: 0.3, duration: 800, useNativeDriver: true })
            ])
        ).start();
    }, []);

    const skeletonStyle = { opacity: animValue, backgroundColor: '#E0DFFF', borderRadius: 8 };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
            {/* Top Cards Skeleton */}
            <View style={styles.statsGrid}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Animated.View key={i} style={[styles.statCard, { opacity: animValue, backgroundColor: '#F0EFFF', borderColor: 'transparent' }]}>
                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#E0DFFF', marginBottom: 12 }} />
                        <View style={{ width: '80%', height: 16, backgroundColor: '#E0DFFF', marginBottom: 8, borderRadius: 4 }} />
                        <View style={{ width: '40%', height: 24, backgroundColor: '#E0DFFF', borderRadius: 4 }} />
                    </Animated.View>
                ))}
            </View>

            {/* List Skeleton */}
            <View style={{ marginTop: 24 }}>
                <Animated.View style={[skeletonStyle, { width: 200, height: 24, marginBottom: 16 }]} />
                <Animated.View style={[styles.listCard, { opacity: animValue, backgroundColor: '#F0EFFF' }]}>
                    {[1, 2, 3].map(i => (
                        <View key={i} style={{ marginBottom: 16 }}>
                            <View style={{ width: '60%', height: 14, backgroundColor: '#E0DFFF', marginBottom: 8, borderRadius: 4 }} />
                            <View style={{ width: '100%', height: 8, backgroundColor: '#E0DFFF', borderRadius: 4 }} />
                        </View>
                    ))}
                </Animated.View>
            </View>
        </ScrollView>
    );
};
const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

const AnimatedProgressBar = ({ progress }: { progress: number }) => {
    const shimmerAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: Dimensions.get('window').width,
                duration: 1500,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    return (
        <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]}>
                <Animated.View style={{
                    ...StyleSheet.absoluteFillObject,
                    backgroundColor: 'rgba(255,255,255,0.4)',
                    width: 40,
                    transform: [{ translateX: shimmerAnim }]
                }} />
            </View>
        </View>
    );
};

export default function InstructorAnalytics() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<AnalyticsData | null>(null);

    const fetchAnalytics = async () => {
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;
            
            if (!token) {
                console.error("No access token found");
                setLoading(false);
                return;
            }

            const response = await fetch('https://get-instructor-analytics.vercel.app/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch analytics');
            }

            const json = await response.json();
            setData({
                totalStudents: json.totalStudents || 0,
                totalCourses: json.totalCourses || 0,
                totalEarnings: json.totalEarnings || 0,
                liveSessions: json.liveSessions || 0,
                totalQuizzesAndAssignments: json.totalQuizzesAndAssignments || 0,
                totalQuizAttempts: json.totalQuizAttempts || 0,
                earningsPerCourse: json.earningsPerCourse || [],
                studentsPerCourse: json.studentsPerCourse || [],
                recentEnrollments: json.recentEnrollments || [],
            });
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAnalytics();
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle="light-content" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Analytics</Text>
                </View>
                <FullScreenSkeleton />
            </View>
        );
    }

    const topStats = data ? [
        { id: '1', title: 'Total Students', value: data.totalStudents, icon: 'people', color: '#E8EAF6', iconColor: '#3F51B5' },
        { id: '2', title: 'Total Courses', value: data.totalCourses, icon: 'library', color: '#E3F2FD', iconColor: '#2196F3' },
        { id: '3', title: 'Total Earnings', value: `$${data.totalEarnings.toLocaleString()}`, icon: 'cash', color: '#E8F5E9', iconColor: '#4CAF50' },
        { id: '4', title: 'Live Sessions', value: data.liveSessions, icon: 'videocam', color: '#FFF3E0', iconColor: '#FF9800' },
        { id: '5', title: 'Quiz Items', value: data.totalQuizzesAndAssignments, icon: 'clipboard', color: '#FCE4EC', iconColor: '#E91E63' },
        { id: '6', title: 'Quiz Attempts', value: data.totalQuizAttempts, icon: 'checkmark-circle', color: '#E0F7FA', iconColor: '#00BCD4' },
    ] : [];

    // Calculate max student count for progress bar scaling
    const maxStudents = data?.studentsPerCourse.reduce((max, item) => Math.max(max, item.studentCount), 0) || 1;
    const maxEarnings = data?.earningsPerCourse.reduce((max, item) => Math.max(max, item.earnings), 0) || 1;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <AnimatedHeaderView delay={0}>
                    <Text style={styles.headerTitle}>Analytics</Text>
                </AnimatedHeaderView>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8A2BE2']} />}
            >
                {/* Top Stats Grid */}
                <AnimatedBodyView delay={100} style={styles.statsGrid}>
                    {topStats.map((stat) => (
                        <View key={stat.id} style={styles.statCard}>
                            <View style={styles.statIconRow}>
                                <View style={[styles.statIconBox, { backgroundColor: stat.color }]}>
                                    <Ionicons name={stat.icon as any} size={20} color={stat.iconColor} />
                                </View>
                            </View>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statTitle}>{stat.title}</Text>
                        </View>
                    ))}
                </AnimatedBodyView>

                {/* Earnings & Students Side-by-Side (Mobile: Stacked) */}
                <AnimatedBodyView delay={200} style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Students per Course</Text>
                </AnimatedBodyView>
                <AnimatedBodyView delay={250} style={styles.listCard}>
                    {data?.studentsPerCourse.length === 0 ? (
                        <Text style={styles.emptyText}>No data available</Text>
                    ) : (
                        data?.studentsPerCourse.map((item, index) => {
                            const progressPercentage = (item.studentCount / maxStudents) * 100;
                            return (
                                <View key={index} style={styles.progressItem}>
                                    <View style={styles.progressTextRow}>
                                        <Text style={styles.progressCourseTitle} numberOfLines={1}>{item.courseTitle}</Text>
                                        <Text style={styles.progressValueText}>{item.studentCount} STUDENTS</Text>
                                    </View>
                                    <AnimatedProgressBar progress={progressPercentage} />
                                </View>
                            );
                        })
                    )}
                </AnimatedBodyView>

                <AnimatedBodyView delay={300} style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Earnings per Course</Text>
                </AnimatedBodyView>
                <AnimatedBodyView delay={350} style={styles.listCard}>
                    {data?.earningsPerCourse.length === 0 ? (
                        <Text style={styles.emptyText}>No data available</Text>
                    ) : (
                        data?.earningsPerCourse.map((item, index) => {
                            const progressPercentage = (item.earnings / maxEarnings) * 100;
                            return (
                                <View key={index} style={styles.progressItem}>
                                    <View style={styles.progressTextRow}>
                                        <Text style={styles.progressCourseTitle} numberOfLines={1}>{item.courseTitle}</Text>
                                        <Text style={styles.earningValueText}>${item.earnings.toLocaleString()}</Text>
                                    </View>
                                    <AnimatedProgressBar progress={progressPercentage} />
                                </View>
                            );
                        })
                    )}
                </AnimatedBodyView>

                {/* Recent Enrollments Table */}
                <AnimatedBodyView delay={400} style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Enrollments</Text>
                </AnimatedBodyView>
                <AnimatedBodyView delay={450} style={styles.listCard}>
                    {data?.recentEnrollments.length === 0 ? (
                        <Text style={[styles.emptyText, { marginTop: 16 }]}>No recent enrollments</Text>
                    ) : (
                        data?.recentEnrollments.map((item, index) => (
                            <View key={index} style={[styles.enrollmentCard, index !== data.recentEnrollments.length - 1 && styles.borderBottom]}>
                                <View style={styles.enrollmentHeader}>
                                    <View style={styles.studentInfo}>
                                        <View style={styles.avatarPlaceholder}>
                                            <Ionicons name="person" size={12} color="#8A2BE2" />
                                        </View>
                                        <Text style={styles.studentNameText} numberOfLines={1}>{item.studentName}</Text>
                                    </View>
                                    <Text style={styles.enrollmentDateText}>{formatDate(item.date)}</Text>
                                </View>
                                <View style={styles.courseBadge}>
                                    <Ionicons name="book" size={12} color="#8A2BE2" style={{ marginRight: 6 }} />
                                    <Text style={styles.courseBadgeText} numberOfLines={1}>{item.courseTitle}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </AnimatedBodyView>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
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
        paddingBottom: 50,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        // Premium soft shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 15,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#F0EFFF',
    },
    statIconRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    statIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },
    sectionHeader: {
        marginBottom: 12,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    listCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 15,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#F0EFFF',
    },
    progressItem: {
        marginBottom: 16,
    },
    progressTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressCourseTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#555',
        textTransform: 'uppercase',
        flex: 1,
        marginRight: 10,
    },
    progressValueText: {
        fontSize: 11,
        color: '#8A2BE2',
        fontWeight: 'bold',
    },
    progressBarBackground: {
        height: 6,
        backgroundColor: '#F3E5F5',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#8A2BE2', // Primary purple for bars
        borderRadius: 3,
    },
    earningRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    earningCourseTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#555',
        textTransform: 'uppercase',
        flex: 1,
        marginRight: 10,
    },
    earningValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    earningValueText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    enrollmentCard: {
        paddingVertical: 14,
    },
    enrollmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    avatarPlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F3E5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    studentNameText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    enrollmentDateText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },
    courseBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E5F5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    courseBadgeText: {
        fontSize: 12,
        color: '#8A2BE2',
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        fontStyle: 'italic',
    }
});
