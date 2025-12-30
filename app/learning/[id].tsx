import { supabase } from '@/src/auth/supabase';
import { courseService } from '@/src/services/courseService';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import RenderHTML from 'react-native-render-html';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.85;

// --- Helper Functions & Types ---

type LessonType = 'video' | 'quiz' | 'article';

interface Lesson {
    title: string;
    type: LessonType;
    duration?: string;
    content?: string;
    image?: string;
    questions?: any[];
    video_url?: string;
    video_link?: string;
    lessons?: Lesson[];
    isCompleted?: boolean;
}

interface Section {
    title: string;
    data: Lesson[];
    isExpanded?: boolean;
}

const getLessonType = (lesson: any): LessonType => {
    if (lesson.type) return lesson.type;
    const subItems = lesson.lessons || lesson.children || lesson.data || lesson.items;
    if (subItems && Array.isArray(subItems) && subItems.length > 0) return 'article';

    const content = lesson.video_url || lesson.video_link || lesson.content;
    if (typeof content === 'string') {
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('.mp4') ||
            lowerContent.includes('youtube.com') ||
            lowerContent.includes('youtu.be') ||
            lowerContent.includes('vimeo.com') ||
            lowerContent.startsWith('http')) {
            return 'video';
        }
    }

    if (lesson.questions && Array.isArray(lesson.questions) && lesson.questions.length > 0) return 'quiz';
    return 'article';
};

const processCourseContent = (content: any): Section[] => {
    if (!content) return [];

    const processLesson = (lessonData: any): Lesson => {
        const lesson = typeof lessonData === 'object' ? lessonData : { title: String(lessonData) };
        const processedLesson: Lesson = {
            ...lesson,
            type: getLessonType(lesson),
        };
        const subItems = lesson.lessons || lesson.children || lesson.data || lesson.items;
        if (subItems && Array.isArray(subItems)) {
            processedLesson.lessons = subItems.map(processLesson);
        }
        return processedLesson;
    };

    let rawSections: any[] = [];
    if (Array.isArray(content)) {
        rawSections = content;
    } else if (typeof content === 'object') {
        rawSections = content.sections || content.data || Object.values(content);
    }

    if (!Array.isArray(rawSections)) return [];

    return rawSections.map((sectionData: any, index: number) => {
        let title = sectionData.title || sectionData.name || `Section ${index + 1}`;
        let lessons = [];

        if (Array.isArray(sectionData)) {
            lessons = sectionData;
        } else if (typeof sectionData === 'object') {
            lessons = sectionData.lessons || sectionData.data || sectionData.items || [];
        }

        return {
            title,
            data: Array.isArray(lessons) ? lessons.map(processLesson) : [],
            isExpanded: index === 0,
        };
    });
};


// --- UI Components ---

const ContentRenderer = ({ lesson }: { lesson: Lesson | null }) => {
    if (!lesson) {
        return (
            <View style={[styles.contentContainer, styles.center]}>
                <Ionicons name="school-outline" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>Please select a lesson to begin.</Text>
            </View>
        );
    }

    switch (lesson.type) {
        case 'video':
            const videoSource = lesson.video_url || lesson.video_link || lesson.content;
            return (
                <View style={styles.contentContainer}>
                    <Video
                        style={styles.videoPlayer}
                        source={{ uri: videoSource || '' }}
                        useNativeControls
                        resizeMode={ResizeMode.CONTAIN}
                    />
                    <Text style={styles.heading}>{lesson.title}</Text>
                    {lesson.content && !lesson.video_url && !lesson.video_link && !lesson.content.startsWith('http') && (
                        <Text style={styles.paragraph}>{lesson.content}</Text>
                    )}
                </View>
            );
        case 'quiz':
            return (
                <View style={styles.contentContainer}>
                    <Text style={styles.heading}>{lesson.title}</Text>
                    <View style={styles.quizCard}>
                        <Ionicons name="help-circle-outline" size={48} color="#8A2BE2" />
                        <Text style={styles.quizText}>Total Questions: {lesson.questions?.length || 0}</Text>
                        <Text style={styles.quizSubText}>Test your knowledge on this topic.</Text>
                        <TouchableOpacity style={styles.quizButton}>
                            <Text style={styles.quizButtonText}>Start Quiz</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        case 'article':
        default:
            return (
                <View style={styles.contentContainer}>
                    <Text style={styles.heading}>{lesson.title}</Text>
                    {lesson.image && <Image source={{ uri: lesson.image }} style={styles.contentImage} />}
                    {lesson.content ? (
                        <RenderHTML contentWidth={width - 40} source={{ html: lesson.content }} />
                    ) : (
                        <Text style={styles.paragraph}>This lesson may contain sub-topics. Please check the sidebar.</Text>
                    )}
                </View>
            );
    }
};

const LessonItem = ({ lesson, path, onSelect, isActive, level = 0, isCompleted = false }: any) => {
    const getIcon = () => {
        if (lesson.type === 'quiz') return 'help-circle';
        if (lesson.type === 'video') return 'play-circle';
        return 'document-text';
    };

    return (
        <TouchableOpacity
            style={[
                styles.lessonItem,
                { paddingLeft: 20 + level * 15 },
                isActive && styles.activeLessonItem
            ]}
            onPress={() => onSelect(path)}
        >
            <View style={[styles.iconCircle, isActive && styles.activeIconCircle]}>
                <Ionicons
                    name={getIcon()}
                    size={16}
                    color={isActive ? '#fff' : '#888'}
                />
            </View>
            <Text
                numberOfLines={2}
                style={[styles.lessonItemTitle, isActive && styles.activeLessonText]}
            >
                {lesson.title}
            </Text>
            <View style={[styles.checkmarkCircle, isCompleted && styles.completedCheckmark]}>
                {isCompleted && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
        </TouchableOpacity>
    );
};

// --- Main Screen ---

export default function LearningPlayerScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [course, setCourse] = useState<any>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [activeLessonPath, setActiveLessonPath] = useState<{ s: number; l: number; sl?: number } | null>(null);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

    const getPathKey = (s: number, l: number, sl?: number) => {
        const section = sections[s];
        if (!section) return `s-${s}-l-${l}${sl !== undefined ? `-sl-${sl}` : ''}`;

        const lesson = section.data[l];
        if (!lesson) return `s-${s}-l-${l}${sl !== undefined ? `-sl-${sl}` : ''}`;

        const target = sl !== undefined && lesson.lessons ? lesson.lessons[sl] : lesson;

        // Prioritize unique IDs from backend if available
        const uniqueId = (target as any).id || (target as any).lesson_id || (target as any)._id;
        if (uniqueId) return String(uniqueId);

        return sl !== undefined ? `s-${s}-l-${l}-sl-${sl}` : `s-${s}-l-${l}`;
    };

    // Reactive progress calculation for each section
    const sectionProgressData = React.useMemo(() => {
        return sections.map((section, sIndex) => {
            let sectionCompleted = 0;
            let sectionTotal = 0;
            section.data.forEach((l, lIndex) => {
                sectionTotal++;
                if (completedLessons.has(getPathKey(sIndex, lIndex))) sectionCompleted++;
                if (l.lessons) {
                    l.lessons.forEach((_, slIndex) => {
                        sectionTotal++;
                        if (completedLessons.has(getPathKey(sIndex, lIndex, slIndex))) sectionCompleted++;
                    });
                }
            });
            return {
                completed: sectionCompleted,
                total: sectionTotal,
                percent: sectionTotal > 0 ? (sectionCompleted / sectionTotal) * 100 : 0
            };
        });
    }, [sections, completedLessons]);

    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const slideAnimation = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const toastOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (id) {
            fetchCourseData();
            fetchUserProgress();
        }
    }, [id]);

    const fetchUserProgress = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch progress from enrollments table (completed_lessons column)
            const { data, error } = await supabase
                .from('enrollments')
                .select('completed_lessons')
                .eq('student_id', user.id)
                .eq('course_id', id)
                .maybeSingle();

            if (!error) {
                const completedList = Array.isArray(data?.completed_lessons) ? data.completed_lessons : [];
                setCompletedLessons(new Set(completedList.map(String)));
            }
        } catch (err) {
            console.error("Error fetching user progress:", err);
        }
    };

    const fetchCourseData = async (retryCount = 0) => {
        if (retryCount === 0) setLoading(true);
        setError(null);

        try {
            const data: any = await courseService.fetchCourseById(Number(id));
            setCourse(data);

            let parsedContent = null;
            if (data?.course_content) {
                try {
                    parsedContent = typeof data.course_content === 'string'
                        ? JSON.parse(data.course_content)
                        : data.course_content;
                } catch (e) {
                    console.error("Failed to parse course_content JSON:", e);
                    setError("Failed to load course content. The data format is incorrect.");
                    setSections([]);
                    setLoading(false);
                    return;
                }
            }

            const transformed = processCourseContent(parsedContent);
            setSections(transformed);

            if (!activeLessonPath && transformed.length > 0 && transformed[0].data.length > 0) {
                setActiveLessonPath({ s: 0, l: 0 });
            }

        } catch (err: any) {
            console.error(`Error fetching course data (Attempt ${retryCount + 1}):`, err);

            if ((err.message?.includes('PGRST002') || err.message?.includes('Network')) && retryCount < 2) {
                setTimeout(() => fetchCourseData(retryCount + 1), 1500);
                return;
            }

            setError(`Failed to load course. ${err.message || 'Please try again later.'}`);
        } finally {
            if (retryCount === 0 || error) setLoading(false);
        }
    };

    const toggleSidebar = (show: boolean) => {
        if (show) setSidebarVisible(true);
        Animated.timing(slideAnimation, {
            toValue: show ? 0 : -SIDEBAR_WIDTH,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            if (!show) setSidebarVisible(false);
        });
    };

    const toggleSection = (index: number) => {
        const newSections = [...sections];
        newSections[index].isExpanded = !newSections[index].isExpanded;
        setSections(newSections);
    };

    const handleLessonSelect = (path: { s: number; l: number; sl?: number }) => {
        setActiveLessonPath(path);
        toggleSidebar(false);
    };

    const getCurrentLesson = () => {
        if (!activeLessonPath || !sections[activeLessonPath.s]) return null;
        const section = sections[activeLessonPath.s];
        const lesson = section.data[activeLessonPath.l];
        if (activeLessonPath.sl != null && lesson.lessons) {
            return lesson.lessons[activeLessonPath.sl];
        }
        return lesson;
    };

    const currentLesson = getCurrentLesson();



    const handleCompleteAndNext = async () => {
        if (!activeLessonPath) return;

        const currentKey = getPathKey(activeLessonPath.s, activeLessonPath.l, activeLessonPath.sl);

        // 1. Update local state
        const nextCompleted = new Set(completedLessons);
        nextCompleted.add(currentKey);
        setCompletedLessons(nextCompleted);

        // 2. Persist to Database
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                console.log("[DEBUG] Saving progress for user:", user.id, "Lesson Key:", currentKey);

                const completionData = {
                    course_id: id,
                    lesson_id: currentKey,
                    is_completed: true,
                    updated_at: new Date().toISOString()
                };

                const updatedList = Array.from(nextCompleted);
                const { error: updateErr } = await supabase.from('enrollments')
                    .update({ completed_lessons: updatedList })
                    .eq('student_id', user.id)
                    .eq('course_id', id);

                if (!updateErr) {
                    console.log("[DEBUG] Progress synced with Supabase");
                    // Show success toast
                    setShowSuccessToast(true);
                    Animated.sequence([
                        Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                        Animated.delay(1500),
                        Animated.timing(toastOpacity, { toValue: 0, duration: 500, useNativeDriver: true })
                    ]).start(() => setShowSuccessToast(false));
                }
            }
        } catch (err) {
            console.error("[DEBUG] Error saving progress catch block:", err);
        }

        // Find Next Lesson Logic
        let nextPath: { s: number; l: number; sl?: number } | null = null;

        const currentSection = sections[activeLessonPath.s];
        const currentLessonObj = currentSection.data[activeLessonPath.l];

        // 1. Is there a nested sub-lesson next?
        if (activeLessonPath.sl !== undefined && currentLessonObj.lessons && activeLessonPath.sl < currentLessonObj.lessons.length - 1) {
            nextPath = { ...activeLessonPath, sl: activeLessonPath.sl + 1 };
        }
        // 2. Is there a nested sub-lesson starting?
        else if (activeLessonPath.sl === undefined && currentLessonObj.lessons && currentLessonObj.lessons.length > 0) {
            nextPath = { ...activeLessonPath, sl: 0 };
        }
        // 3. Next lesson in same section?
        else if (activeLessonPath.l < currentSection.data.length - 1) {
            nextPath = { s: activeLessonPath.s, l: activeLessonPath.l + 1 };
        }
        // 4. Next section first lesson?
        else if (activeLessonPath.s < sections.length - 1) {
            nextPath = { s: activeLessonPath.s + 1, l: 0 };
            // Auto expand next section
            const newSections = [...sections];
            newSections[activeLessonPath.s + 1].isExpanded = true;
            setSections(newSections);
        }

        if (nextPath) {
            setActiveLessonPath(nextPath);
            // Scroll to top of content when lesson changes
            contentScrollViewRef.current?.scrollTo({ y: 0, animated: true });
        } else {
            Alert.alert("Congratulations! 🎉", "You have completed the entire course.", [
                { text: "Go to My Courses", onPress: () => router.replace('/(tabs)/myCourses') },
                { text: "Stay Here", style: 'cancel' }
            ]);
        }
    };

    const contentScrollViewRef = useRef<ScrollView>(null);

    const renderLessons = (lessons: Lesson[], sectionIndex: number, level = 0) => {
        return lessons.map((lesson, lessonIndex) => {
            const currentPath = { s: sectionIndex, l: lessonIndex };
            const isActive = activeLessonPath?.s === sectionIndex && activeLessonPath?.l === lessonIndex && activeLessonPath?.sl == null;
            const hasChildren = lesson.lessons && Array.isArray(lesson.lessons) && lesson.lessons.length > 0;
            const isCompleted = completedLessons.has(getPathKey(sectionIndex, lessonIndex));

            return (
                <View key={`${sectionIndex}-${lessonIndex}`}>
                    <LessonItem
                        lesson={lesson}
                        path={currentPath}
                        onSelect={handleLessonSelect}
                        isActive={isActive}
                        level={level}
                        isCompleted={isCompleted}
                    />
                    {hasChildren && (
                        <View>
                            {lesson.lessons!.map((subLesson, subLessonIndex) => {
                                const subLessonPath = { s: sectionIndex, l: lessonIndex, sl: subLessonIndex };
                                const isSubActive = activeLessonPath?.s === sectionIndex && activeLessonPath?.l === lessonIndex && activeLessonPath?.sl === subLessonIndex;
                                const isSubCompleted = completedLessons.has(getPathKey(sectionIndex, lessonIndex, subLessonIndex));
                                return (
                                    <LessonItem
                                        key={`${sectionIndex}-${lessonIndex}-${subLessonIndex}`}
                                        lesson={subLesson}
                                        path={subLessonPath}
                                        onSelect={handleLessonSelect}
                                        isActive={isSubActive}
                                        level={level + 1}
                                        isCompleted={isSubCompleted}
                                    />
                                );
                            })}
                        </View>
                    )}
                </View>
            );
        });
    };

    if (loading) {
        return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#8A2BE2" /></View>;
    }

    if (error) {
        return (
            <View style={[styles.container, styles.center]}>
                <Ionicons name="alert-circle-outline" size={48} color="red" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => fetchCourseData(0)}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => toggleSidebar(true)} style={styles.hamburgerBtn}><Ionicons name="menu" size={32} color="#fff" /></TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{course?.title || 'Learning Player'}</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={28} color="#fff" /></TouchableOpacity>
            </View>

            {sidebarVisible && (
                <View style={StyleSheet.absoluteFill}>
                    <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => toggleSidebar(false)} />
                    <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnimation }] }]}>
                        <View style={styles.sidebarHeader}>
                            <Text style={styles.sidebarTitle}>Course Content</Text>
                            <TouchableOpacity onPress={() => toggleSidebar(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
                        </View>
                        <ScrollView>
                            {sections.length > 0 ? sections.map((section, sIndex) => {
                                const progress = sectionProgressData[sIndex] || { completed: 0, total: 0, percent: 0 };

                                return (
                                    <View key={sIndex} style={styles.sectionContainer}>
                                        <TouchableOpacity
                                            style={styles.sectionHeader}
                                            onPress={() => toggleSection(sIndex)}
                                        >
                                            <View style={styles.sectionHeaderMain}>
                                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                                <Text style={styles.sectionProgressText}>{progress.completed}/{progress.total}</Text>
                                                <Ionicons
                                                    name={section.isExpanded ? 'chevron-up' : 'chevron-down'}
                                                    size={18}
                                                    color="#666"
                                                />
                                            </View>
                                            <View style={styles.progressBarContainer}>
                                                <View style={[styles.progressBar, { width: `${progress.percent}%` }]} />
                                            </View>
                                        </TouchableOpacity>
                                        {section.isExpanded && <View>{renderLessons(section.data, sIndex)}</View>}
                                    </View>
                                );
                            }) : <Text style={styles.emptyStateText}>No content available.</Text>}
                        </ScrollView>
                    </Animated.View>
                </View>
            )}

            <ScrollView ref={contentScrollViewRef} style={styles.scrollBody} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.lessonHeader}>
                    <Text style={styles.lessonTitle}>{currentLesson?.title || 'Select a Lesson'}</Text>
                </View>
                <ContentRenderer lesson={currentLesson} />

                {currentLesson && (
                    <View style={styles.actionArea}>
                        <TouchableOpacity style={styles.nextButton} onPress={handleCompleteAndNext}>
                            <Text style={styles.nextButtonText}>Mark as Complete & Next</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {showSuccessToast && (
                <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.toastText}>Progress Synced!</Text>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { fontSize: 16, color: 'red', textAlign: 'center', marginBottom: 20 },
    retryButton: { backgroundColor: '#8A2BE2', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 20 },
    retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    emptyStateText: { textAlign: 'center', color: '#888', marginTop: 20, fontSize: 15 },
    header: { height: 100, paddingTop: 40, backgroundColor: '#8A2BE2', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, justifyContent: 'space-between' },
    hamburgerBtn: { padding: 5 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center', marginHorizontal: 10 },
    backBtn: { padding: 5 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    sidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: '#fff', zIndex: 1001, elevation: 10 },
    sidebarHeader: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sidebarTitle: { fontSize: 18, fontWeight: 'bold' },
    sectionContainer: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    sectionHeader: { padding: 20, backgroundColor: '#fff' },
    sectionHeaderMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
    sectionProgressText: { fontSize: 12, color: '#666', marginRight: 10 },
    progressBarContainer: { height: 4, backgroundColor: '#eee', borderRadius: 2, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#22C55E' },
    lessonItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
    activeLessonItem: { backgroundColor: '#F7F0FF' },
    iconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    activeIconCircle: { backgroundColor: '#8A2BE2' },
    lessonItemTitle: { fontSize: 14, color: '#555', flex: 1, lineHeight: 20 },
    activeLessonText: { color: '#8A2BE2', fontWeight: 'bold' },
    checkmarkCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
    completedCheckmark: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
    scrollBody: { flex: 1 },
    lessonHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    lessonTitle: { fontSize: 22, fontWeight: 'bold' },
    contentContainer: { padding: 20 },
    actionArea: { paddingHorizontal: 20, marginTop: 10, paddingBottom: 40 },
    nextButton: { backgroundColor: '#8A2BE2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 30, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    nextButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    paragraph: { fontSize: 16, lineHeight: 24, color: '#444' },
    videoPlayer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 8, marginBottom: 15 },
    contentImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 15 },
    quizCard: { backgroundColor: '#F4F0FF', borderRadius: 15, padding: 25, alignItems: 'center', marginTop: 10 },
    quizText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 15 },
    quizSubText: { fontSize: 14, color: '#666', marginTop: 5, marginBottom: 20, textAlign: 'center' },
    quizButton: { backgroundColor: '#8A2BE2', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 25 },
    quizButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    toastContainer: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        backgroundColor: '#22C55E',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    toastText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
});
