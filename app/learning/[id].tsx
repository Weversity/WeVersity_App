import { courseService } from '@/src/services/courseService';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
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
    video_link?: string; // Support alternative key
    lessons?: Lesson[]; // For nested lessons
    isCompleted?: boolean;
}

interface Section {
    title: string;
    data: Lesson[];
    isExpanded?: boolean;
}

const getLessonType = (lesson: any): LessonType => {
    if (lesson.type) return lesson.type;
    if (lesson.lessons && Array.isArray(lesson.lessons) && lesson.lessons.length > 0) return 'article';

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
        // Explicitly check multiple keys for nested data/lessons
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
        // If content is an object with a sections/data key
        rawSections = content.sections || content.data || Object.values(content);
    }

    if (!Array.isArray(rawSections)) return [];

    return rawSections.map((sectionData: any, index: number) => {
        let title = sectionData.title || sectionData.name || `Section ${index + 1}`;
        let lessons = [];

        if (Array.isArray(sectionData)) {
            lessons = sectionData;
        } else if (typeof sectionData === 'object') {
            // Check multiple keys for lesson data
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

    const [sidebarVisible, setSidebarVisible] = useState(false);
    const slideAnimation = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

    useEffect(() => {
        if (id) fetchCourseData();
    }, [id]);

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

    const renderLessons = (lessons: Lesson[], sectionIndex: number, level = 0) => {
        return lessons.map((lesson, lessonIndex) => {
            const currentPath = { s: sectionIndex, l: lessonIndex };
            const isActive = activeLessonPath?.s === sectionIndex && activeLessonPath?.l === lessonIndex && activeLessonPath?.sl == null;
            const hasChildren = lesson.lessons && Array.isArray(lesson.lessons) && lesson.lessons.length > 0;

            return (
                <View key={`${sectionIndex}-${lessonIndex}`}>
                    <LessonItem
                        lesson={lesson}
                        path={currentPath}
                        onSelect={handleLessonSelect}
                        isActive={isActive}
                        level={level}
                        isCompleted={lesson.isCompleted}
                    />
                    {hasChildren && (
                        <View>
                            {lesson.lessons!.map((subLesson, subLessonIndex) => {
                                const subLessonPath = { s: sectionIndex, l: lessonIndex, sl: subLessonIndex };
                                const isSubActive = activeLessonPath?.s === sectionIndex && activeLessonPath?.l === lessonIndex && activeLessonPath?.sl === subLessonIndex;
                                return (
                                    <LessonItem
                                        key={`${sectionIndex}-${lessonIndex}-${subLessonIndex}`}
                                        lesson={subLesson}
                                        path={subLessonPath}
                                        onSelect={handleLessonSelect}
                                        isActive={isSubActive}
                                        level={level + 1}
                                        isCompleted={subLesson.isCompleted}
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
                                const completedCount = section.data.filter((l: any) => l.isCompleted).length;
                                const totalCount = section.data.length;
                                const progress = totalCount > 0 ? completedCount / totalCount : 0;

                                return (
                                    <View key={sIndex} style={styles.sectionContainer}>
                                        <TouchableOpacity
                                            style={styles.sectionHeader}
                                            onPress={() => toggleSection(sIndex)}
                                        >
                                            <View style={styles.sectionHeaderMain}>
                                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                                <Text style={styles.sectionProgressText}>{completedCount}/{totalCount}</Text>
                                                <Ionicons
                                                    name={section.isExpanded ? 'chevron-up' : 'chevron-down'}
                                                    size={18}
                                                    color="#666"
                                                />
                                            </View>
                                            <View style={styles.progressBarContainer}>
                                                <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
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

            <ScrollView style={styles.scrollBody}>
                <View style={styles.lessonHeader}>
                    <Text style={styles.lessonTitle}>{currentLesson?.title || 'Select a Lesson'}</Text>
                </View>
                <ContentRenderer lesson={currentLesson} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
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
    heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    paragraph: { fontSize: 16, lineHeight: 24, color: '#444' },
    videoPlayer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 8, marginBottom: 15 },
    contentImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 15 },
    quizCard: { backgroundColor: '#F4F0FF', borderRadius: 15, padding: 25, alignItems: 'center', marginTop: 10 },
    quizText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 15 },
    quizSubText: { fontSize: 14, color: '#666', marginTop: 5, marginBottom: 20, textAlign: 'center' },
    quizButton: { backgroundColor: '#8A2BE2', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 25 },
    quizButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
