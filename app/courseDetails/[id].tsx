import { courseService } from '@/src/services/courseService';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    LayoutAnimation,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

interface Lesson {
    title: string;
    duration: string;
    type: 'video' | 'quiz' | 'article';
    [key: string]: any;
}

interface Section {
    title: string;
    lessons: Lesson[];
    [key: string]: any;
}

interface MappedCourse {
    id: any;
    title: string;
    categories: string;
    is_free: boolean;
    image: string;
    price: string;
    description: string;
    sections: Section[];
    instructor: string;
    instructorAvatar?: string;
    rating: number;
    reviews: any[];
    students: number;
    duration: string;
    tools?: any[];
}

// Helper to strip HTML tags
const stripHtmlTags = (htmlString: string) => {
    if (!htmlString) return '';
    let cleanText = htmlString.replace(/WEVERSITY_BLOCKS_START[\s\S]*$/, '');
    cleanText = cleanText.replace(/<!--[\s\S]*?-->/g, "");
    cleanText = cleanText.replace(/<[^>]*>?/gm, '');
    cleanText = cleanText.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
    return cleanText.trim();
};

const CourseDetailsStackOptions = ({ title }: { title: string | undefined }) => ({
    title: title || 'Course Details',
    headerStyle: { backgroundColor: '#8A2BE2' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: '700' as const },
});

export default function CourseDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'About' | 'Lessons' | 'Reviews'>('About');
    const [course, setCourse] = useState<MappedCourse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourse = async () => {
            if (!id) return;
            setLoading(true);
            setError(null);
            try {
                const data: any = await courseService.fetchCourseById(Number(id));
                if (!data) throw new Error('Course not found');

                // Parse content
                let parsedContent: any[] = [];
                try {
                    parsedContent = typeof data.course_content === 'string'
                        ? JSON.parse(data.course_content)
                        : (data.course_content || []);
                } catch (e) {
                    console.error("JSON Parse error", e);
                }

                // Normalize structure to Sections -> Lessons
                let mappedSections: Section[] = [];
                if (parsedContent.length > 0 && (parsedContent[0].data || parsedContent[0].child_lessons)) {
                    mappedSections = parsedContent.map((s: any) => ({
                        title: s.title || s.section_title || 'Module',
                        lessons: s.data || s.child_lessons || []
                    }));
                } else {
                    mappedSections = [{
                        title: 'Course Content',
                        lessons: parsedContent
                    }];
                }

                // Stats calculation
                let totalMin = 0;
                let lessonCount = 0;
                mappedSections.forEach(s => {
                    s.lessons.forEach(l => {
                        lessonCount++;
                        const d = l.duration?.toString() || "";
                        const val = parseInt(d.split(' ')[0]);
                        if (!isNaN(val)) {
                            if (d.includes('h')) totalMin += val * 60;
                            else totalMin += val;
                        }
                    });
                });

                const studentCount = data.total_students || data.students_count || data.enrolled_students || 0;
                const durationStr = totalMin > 0 ? `${Math.floor(totalMin / 60)}h ${totalMin % 60}m` : '1.5 Hours';

                setCourse({
                    id: data.id,
                    title: data.title,
                    categories: data.categories || 'General',
                    is_free: true,
                    image: data.image_url || 'https://via.placeholder.com/400x250',
                    price: 'Free',
                    description: data.description || '',
                    sections: mappedSections,
                    instructor: data.instructor?.first_name ? `${data.instructor.first_name} ${data.instructor.last_name || ''}`.trim() : 'Unknown Instructor',
                    instructorAvatar: data.instructor?.avatar_url,
                    rating: data.avg_rating || 0,
                    reviews: data.reviews || [],
                    students: studentCount,
                    duration: durationStr,
                    tools: data.tools || []
                });
            } catch (err: any) {
                setError(err.message || 'Failed to load course');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id]);

    const handleEnroll = () => {
        if (course?.id) router.push(`/learning/${course.id}` as any);
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#8A2BE2" />
        </View>
    );

    if (error || !course) return (
        <View style={styles.center}>
            <Text style={styles.error}>{error || 'Course not found'}</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Text style={{ color: '#fff' }}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={CourseDetailsStackOptions({ title: course.title })} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.header}>
                    <Image source={{ uri: course.image }} style={styles.headerImg} />
                    <View style={styles.playOverlay}>
                        <View style={styles.playCircle}>
                            <Ionicons name="play" size={30} color="#8A2BE2" />
                        </View>
                    </View>
                </View>

                <View style={styles.body}>
                    <Text style={styles.title}>{course.title}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.badge}><Text style={styles.badgeText}>{course.categories}</Text></View>
                        <View style={styles.rating}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.ratingText}>{course.rating.toFixed(1)} ({course.reviews.length})</Text>
                        </View>
                    </View>

                    <Text style={styles.price}>{course.price}</Text>

                    <View style={styles.statsPanel}>
                        <StatItem icon="people" label={`${course.students} Students`} />
                        <StatItem icon="time-outline" label={course.duration} />
                        <StatItem icon="document-text-outline" label="Certificate" />
                    </View>

                    <View style={styles.tabs}>
                        {['About', 'Lessons', 'Reviews'].map(t => (
                            <TouchableOpacity key={t} onPress={() => setActiveTab(t as any)} style={[styles.tab, activeTab === t && styles.activeTab]}>
                                <Text style={[styles.tabText, activeTab === t && styles.activeTabText]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.tabContent}>
                        {activeTab === 'About' && <AboutTab course={course} />}
                        {activeTab === 'Lessons' && <LessonsTab sections={course.sections} onLessonPress={handleEnroll} />}
                        {activeTab === 'Reviews' && <ReviewsTab course={course} />}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.enrollBtn} onPress={handleEnroll}>
                    <Text style={styles.enrollBtnText}>Enroll Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const StatItem = ({ icon, label }: { icon: any, label: string }) => (
    <View style={styles.statItem}>
        <Ionicons name={icon} size={18} color="#8A2BE2" />
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const AboutTab = ({ course }: { course: MappedCourse }) => (
    <View>
        <Text style={styles.sectionTitle}>Mentor</Text>
        <View style={styles.mentorCard}>
            <Image source={{ uri: course.instructorAvatar || 'https://via.placeholder.com/50' }} style={styles.mentorImg} />
            <View>
                <Text style={styles.mentorName}>{course.instructor}</Text>
                <Text style={styles.mentorRole}>Senior Instructor</Text>
            </View>
        </View>
        <Text style={styles.sectionTitle}>About Course</Text>
        <Text style={styles.desc}>{stripHtmlTags(course.description)}</Text>
    </View>
);

const LessonsTab = ({ sections, onLessonPress }: { sections: Section[], onLessonPress: () => void }) => {
    const [expanded, setExpanded] = useState<number | null>(0);
    const toggle = (i: number) => {
        LayoutAnimation.easeInEaseOut();
        setExpanded(expanded === i ? null : i);
    };

    return (
        <View>
            {sections.map((sec, i) => (
                <View key={i} style={styles.accContainer}>
                    <TouchableOpacity style={styles.accHeader} onPress={() => toggle(i)}>
                        <Text style={styles.accTitle}>{sec.title}</Text>
                        <Ionicons name={expanded === i ? "chevron-up" : "chevron-down"} size={20} color="#333" />
                    </TouchableOpacity>
                    {expanded === i && (
                        <View style={styles.accContent}>
                            {sec.lessons.map((l, li) => (
                                <TouchableOpacity key={li} style={styles.lessonRow} onPress={onLessonPress}>
                                    <View style={styles.lessonNum}><Text style={styles.lessonNumText}>{li + 1}</Text></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.lessonTitle}>{l.title}</Text>
                                        <Text style={styles.lessonDur}>{l.duration}</Text>
                                    </View>
                                    <Ionicons name={l.type === 'quiz' ? 'help-circle-outline' : 'play-circle-outline'} size={20} color="#8A2BE2" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
};

const ReviewsTab = ({ course }: { course: MappedCourse }) => (
    <View>
        {course.reviews.length > 0 ? course.reviews.map((r, i) => (
            <View key={i} style={styles.reviewCard}>
                <Image source={{ uri: r.avatar || 'https://via.placeholder.com/40' }} style={styles.reviewerImg} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.reviewerName}>{r.user || 'Anonymous'}</Text>
                    <Text style={styles.reviewMsg}>{r.message}</Text>
                </View>
            </View>
        )) : <Text style={styles.empty}>No reviews yet</Text>}
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    error: { color: 'red', marginBottom: 20 },
    backBtn: { backgroundColor: '#8A2BE2', padding: 10, borderRadius: 5 },
    header: { height: 250 },
    headerImg: { width: '100%', height: '100%' },
    playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    playCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
    body: { padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 },
    badge: { backgroundColor: '#E0D4FC', padding: 5, borderRadius: 5 },
    badgeText: { color: '#8A2BE2', fontSize: 12, fontWeight: 'bold' },
    rating: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    ratingText: { fontSize: 12, color: '#666' },
    price: { fontSize: 20, fontWeight: 'bold', color: '#8A2BE2', marginBottom: 20 },
    statsPanel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    statLabel: { fontSize: 12, color: '#666' },
    tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 20 },
    tab: { flex: 1, paddingBottom: 10, alignItems: 'center' },
    activeTab: { borderBottomWidth: 3, borderBottomColor: '#8A2BE2' },
    tabText: { color: '#666', fontWeight: '600' },
    activeTabText: { color: '#8A2BE2' },
    tabContent: { minHeight: 200 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 15 },
    mentorCard: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
    mentorImg: { width: 50, height: 50, borderRadius: 25 },
    mentorName: { fontSize: 16, fontWeight: 'bold' },
    mentorRole: { fontSize: 12, color: '#666' },
    desc: { fontSize: 14, color: '#666', lineHeight: 22 },
    accContainer: { marginBottom: 10, borderRadius: 10, borderWidth: 1, borderColor: '#f0f0f0', overflow: 'hidden' },
    accHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#F9F9F9' },
    accTitle: { fontSize: 16, fontWeight: '600' },
    accContent: { backgroundColor: '#fff' },
    lessonRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    lessonNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F4F0FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    lessonNumText: { color: '#8A2BE2', fontWeight: 'bold', fontSize: 12 },
    lessonTitle: { fontSize: 14, fontWeight: '500' },
    lessonDur: { fontSize: 12, color: '#999' },
    reviewCard: { flexDirection: 'row', gap: 15, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 15 },
    reviewerImg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee' },
    reviewerName: { fontSize: 14, fontWeight: 'bold' },
    reviewMsg: { fontSize: 14, color: '#444', marginTop: 5 },
    empty: { color: '#999', textAlign: 'center', marginTop: 20 },
    footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#fff' },
    enrollBtn: { backgroundColor: '#8A2BE2', padding: 15, borderRadius: 30, alignItems: 'center' },
    enrollBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
