// @ts-ignore
import { supabase } from '@/src/auth/supabase';
// @ts-ignore
import { courseService } from '@/src/services/courseService';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
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

const tagsStyles = {
    h1: {
        fontSize: 24,
        fontWeight: '600' as const,
        color: '#1a1a1a',
        marginBottom: 12,
        marginTop: 16,
    },
    h2: {
        fontSize: 22,
        fontWeight: '600' as const,
        color: '#1a1a1a',
        marginBottom: 12,
        marginTop: 16,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600' as const,
        color: '#1a1a1a',
        marginBottom: 8,
    },
    h4: {
        fontSize: 18,
        fontWeight: '600' as const,
        color: '#1a1a1a',
        marginBottom: 8,
    },
    p: {
        fontSize: 16,
        color: '#333333',
        lineHeight: 24,
        marginBottom: 10,
    },
    li: {
        fontSize: 16,
        color: '#333333',
        lineHeight: 24,
    },
    ul: {
        marginBottom: 10,
    },
    ol: {
        marginBottom: 10,
    },
    strong: {
        fontWeight: '600' as const,
        color: '#000000',
    },
    b: {
        fontWeight: '600' as const,
        color: '#000000',
    },
};

const ContentRenderer = ({
    lesson,
    onStartQuiz,
    onSkipQuiz,
}: {
    lesson: Lesson | null;
    onStartQuiz: () => void;
    onSkipQuiz: () => void;
}) => {
    const videoSource = (lesson?.type === 'video') ? (lesson.video_url || lesson.video_link || lesson.content || '') : '';
    const player = useVideoPlayer(videoSource, player => {
        if (videoSource) player.play();
    });

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
            return (
                <View style={styles.contentContainer}>
                    <VideoView
                        style={styles.videoPlayer}
                        player={player}
                        contentFit="contain"
                    />
                    {lesson.content && !lesson.video_url && !lesson.video_link && !lesson.content.startsWith('http') && (
                        <Text style={styles.paragraph}>{lesson.content}</Text>
                    )}
                </View>
            );
        case 'quiz':
            const questionsCount = lesson.questions?.length || 0;

            return (
                <View style={styles.quizStartContainer}>
                    <Text style={styles.quizMainTitle}>{lesson.title}</Text>
                    <View style={styles.divider} />

                    <View style={styles.quizMetaRow}>
                        <Text style={styles.quizMetaLabel}>Questions:</Text>
                        <Text style={styles.quizMetaValue}>{questionsCount} Questions</Text>
                    </View>
                    <View style={styles.quizMetaRow}>
                        <Text style={styles.quizMetaLabel}>Quiz Time:</Text>
                        <Text style={styles.quizMetaValue}>Not timed</Text>
                    </View>
                    <View style={styles.quizMetaRow}>
                        <Text style={styles.quizMetaLabel}>Passing Grade:</Text>
                        <Text style={styles.quizMetaValue}>80%</Text>
                    </View>

                    <View style={styles.quizStartActions}>
                        <TouchableOpacity style={styles.startQuizBtn} onPress={onStartQuiz}>
                            <Text style={styles.startQuizBtnText}>Start Quiz</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.skipQuizBtn} onPress={onSkipQuiz}>
                            <Text style={styles.skipQuizBtnText}>Skip Quiz</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        case 'article':
        default:
            return (
                <View style={styles.contentContainer}>
                    {lesson.image && <Image source={{ uri: lesson.image }} style={styles.contentImage} />}
                    {lesson.content ? (
                        <RenderHTML
                            contentWidth={width - 40}
                            source={{ html: lesson.content }}
                            tagsStyles={tagsStyles}
                            baseStyle={{ lineHeight: 24 }}
                        />
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
    const params = useLocalSearchParams();
    const { id, title, thumbnail, instructor, sectionIndex, lessonIndex, subLessonIndex } = params;
    const router = useRouter();
    const contentScrollViewRef = useRef<ScrollView>(null);

    // Use params for initial state to avoid flicker
    const [course, setCourse] = useState<any>(() => {
        if (!id || !title) return null;
        return {
            id,
            title,
            image_url: thumbnail,
            instructor: { first_name: instructor, last_name: '' }
        };
    });

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

    // 1. Fetch Metadata (Fast)
    const { data: courseMetadata, isLoading: isMetaLoading, refetch: refetchMeta } = useQuery({
        queryKey: ['course', id],
        queryFn: () => courseService.fetchCourseById(String(id)),
        enabled: !!id,
    });

    // 2. Fetch Content (Heavy - Separate Request)
    const { data: contentData, isLoading: isContentLoading, error: contentError, refetch: refetchContent } = useQuery({
        queryKey: ['courseContent', id],
        queryFn: () => courseService.fetchCourseContent(String(id)),
        enabled: !!id,
    });

    // Effect: Update Course Metadata
    useEffect(() => {
        if (courseMetadata) {
            setCourse(courseMetadata);
        }
    }, [courseMetadata]);

    // Effect: Process Content when Loaded
    useEffect(() => {
        if (!contentData) {
            if (contentError) {
                // If error, sections remain empty -> UI will show retry
                setSections([]);
            }
            return;
        }

        let parsedContent = null;
        try {
            parsedContent = typeof contentData === 'string'
                ? JSON.parse(contentData)
                : contentData;
        } catch (e) {
            console.error("Failed to parse course_content JSON:", e);
        }

        if (!parsedContent) {
            setSections([]);
            return;
        }

        const transformed = processCourseContent(parsedContent);
        setSections(transformed);

        // Initial Load or Deep Link Logic
        if (!activeLessonPath && transformed.length > 0) {
            if (sectionIndex !== undefined && lessonIndex !== undefined) {
                // If deep link params exist, use them
                setActiveLessonPath({
                    s: Number(sectionIndex),
                    l: Number(lessonIndex),
                    sl: subLessonIndex !== undefined ? Number(subLessonIndex) : undefined
                });
            } else if (transformed.length > 0 && transformed[0].data.length > 0) {
                // Default to first lesson
                setActiveLessonPath({ s: 0, l: 0 });
            }
        }
    }, [contentData, contentError]);

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

    useEffect(() => {
        if (id) {
            fetchUserProgress();
        }
    }, [id]);

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
        let target: Lesson = (activeLessonPath.sl != null && lesson.lessons)
            ? lesson.lessons[activeLessonPath.sl]
            : lesson;

        // --- Robust Question Extraction ---
        let foundQuestions: any[] = [];

        // 1. Check existing questions array
        if (target.questions && Array.isArray(target.questions) && target.questions.length > 0) {
            foundQuestions = target.questions;
        }
        // 2. Check meta_data.questions
        else if ((target as any).meta_data?.questions && Array.isArray((target as any).meta_data.questions)) {
            foundQuestions = (target as any).meta_data.questions;
        }
        // 3. Check content field (common in Supabase for Quiz items)
        else if (target.content && typeof target.content === 'string') {
            try {
                // If it's a JSON string, it might be the questions array directly or an object with questions
                const parsed = JSON.parse(target.content);
                if (Array.isArray(parsed)) {
                    foundQuestions = parsed;
                } else if (parsed.questions && Array.isArray(parsed.questions)) {
                    foundQuestions = parsed.questions;
                }
            } catch (e) {
                // Not JSON or contains article text, ignore
            }
        }

        // Normalize back to .questions for consistency
        target.questions = foundQuestions;

        return target;
    };

    const currentLesson = getCurrentLesson();

    const handleStartQuiz = () => {
        const lesson = getCurrentLesson();
        if (!lesson) return;

        // Questions are already normalized by getCurrentLesson()
        const questions = lesson.questions || [];
        console.log('Final Questions Array (handleStartQuiz):', questions.length);

        if (questions && questions.length > 0) {
            router.push({
                pathname: "/quiz",
                params: {
                    courseId: String(id),
                    lessonTitle: lesson.title,
                    questions: JSON.stringify(questions)
                }
            });
        } else {
            console.warn('Quiz Check Failed (handleStartQuiz):', { keys: Object.keys(lesson), hasContent: !!lesson.content });
            Alert.alert('No Questions', 'This quiz does not have any questions available yet.');
        }
    };

    const handleSkipQuiz = () => {
        handleCompleteAndNext();
    };



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
                const updatedList = Array.from(nextCompleted);
                const { error: updateErr } = await supabase.from('enrollments')
                    .update({ completed_lessons: updatedList })
                    .eq('student_id', user.id)
                    .eq('course_id', id);

                if (!updateErr) {
                    setShowSuccessToast(true);
                    Animated.sequence([
                        Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                        Animated.delay(1500),
                        Animated.timing(toastOpacity, { toValue: 0, duration: 500, useNativeDriver: true })
                    ]).start(() => setShowSuccessToast(false));
                }
            }
        } catch (err) {
            // Error handled silently
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

    // Loading State for Initial Metadata
    if (isMetaLoading && !courseMetadata) {
        return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#8A2BE2" /></View>;
    }

    // Error State for Initial Metadata
    if (!courseMetadata && !isMetaLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <Ionicons name="alert-circle-outline" size={48} color="red" />
                <Text style={styles.errorText}>Course could not be loaded.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => refetchMeta()}>
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

            {/* Sidebar Overlay */}
            {sidebarVisible && (
                <View style={StyleSheet.absoluteFill}>
                    <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => toggleSidebar(false)} />
                    <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnimation }] }]}>
                        <View style={styles.sidebarHeader}>
                            <Text style={styles.sidebarTitle}>Course Content</Text>
                            <TouchableOpacity onPress={() => toggleSidebar(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
                        </View>

                        {/* Sidebar Content Loading State */}
                        {isContentLoading ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ActivityIndicator color="#8A2BE2" />
                                <Text style={{ color: '#666', marginTop: 10, fontSize: 12 }}>Loading lessons...</Text>
                            </View>
                        ) : contentError ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>Failed to load content</Text>
                                <TouchableOpacity onPress={() => refetchContent()} style={{ padding: 8, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
                                    <Text style={{ fontSize: 12 }}>Try Again</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
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
                                            {section.isExpanded && <View style={styles.sectionBody}>{renderLessons(section.data, sIndex)}</View>}
                                        </View>
                                    );
                                }) : <Text style={styles.emptyStateText}>No content available.</Text>}
                            </ScrollView>
                        )}
                    </Animated.View>
                </View>
            )}

            {/* MAIN CONTENT AREA */}
            <ScrollView ref={contentScrollViewRef} style={styles.scrollBody} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.lessonHeader}>
                    <Text style={styles.lessonTitle}>{currentLesson?.title || 'Select a Lesson'}</Text>
                </View>
                <ContentRenderer
                    lesson={currentLesson}
                    onStartQuiz={handleStartQuiz}
                    onSkipQuiz={handleSkipQuiz}
                />

                {currentLesson && currentLesson.type !== 'quiz' && (
                    <View style={styles.actionArea}>
                        <TouchableOpacity style={styles.nextButton} onPress={handleCompleteAndNext}>
                            <Text style={styles.nextButtonText}>Mark as Complete & Next</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Success Toast */}
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
    retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    emptyStateText: { textAlign: 'center', color: '#888', marginTop: 20, fontSize: 15 },
    header: { height: 100, paddingTop: 40, backgroundColor: '#8A2BE2', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, justifyContent: 'space-between' },
    hamburgerBtn: { padding: 5 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 10 },
    backBtn: { padding: 5 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    sidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: '#fff', zIndex: 1001, elevation: 10 },
    sidebarHeader: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sidebarTitle: { fontSize: 18, fontWeight: '600' },
    sectionContainer: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    sectionHeader: { padding: 20, backgroundColor: '#fff' },
    sectionHeaderMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', flex: 1, marginRight: 10 },
    sectionProgress: { fontSize: 12, color: '#666', marginRight: 10 },
    sectionProgressText: { fontSize: 12, color: '#666', marginRight: 10 },
    sectionBody: { backgroundColor: '#fafafa' },
    progressBarContainer: { height: 4, backgroundColor: '#eee', borderRadius: 2, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#22C55E' },
    lessonItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
    activeLessonItem: { backgroundColor: '#F7F0FF' },
    iconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    activeIconCircle: { backgroundColor: '#8A2BE2' },
    lessonItemTitle: { fontSize: 14, color: '#555', flex: 1, lineHeight: 20 },
    activeLessonText: { color: '#8A2BE2', fontWeight: '600' },
    checkmarkCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
    completedCheckmark: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
    scrollBody: { flex: 1 },
    lessonHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    lessonTitle: { fontSize: 22, fontWeight: '600' },
    contentContainer: { padding: 20 },
    actionArea: { paddingHorizontal: 20, marginTop: 10, paddingBottom: 40 },
    nextButton: { backgroundColor: '#8A2BE2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 30, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    heading: { fontSize: 20, fontWeight: '600', marginBottom: 15 },
    paragraph: { fontSize: 16, lineHeight: 24, color: '#444' },
    videoPlayer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 8, marginBottom: 15 },
    contentImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 15 },
    quizCard: { backgroundColor: '#F4F0FF', borderRadius: 15, padding: 25, alignItems: 'center', marginTop: 10 },
    resultCard: { backgroundColor: '#F4F0FF', borderRadius: 15, padding: 25, alignItems: 'center', marginTop: 10 },
    quizText: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 15 },
    quizSubText: { fontSize: 14, color: '#666', marginTop: 5, marginBottom: 20, textAlign: 'center' },
    quizButton: { backgroundColor: '#8A2BE2', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 25 },
    quizButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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
    toastText: { color: '#fff', fontWeight: '600', marginLeft: 8 },

    // --- Website Style Quiz Styles ---
    quizStartContainer: { padding: 30, backgroundColor: '#fff', borderRadius: 15, margin: 10, elevation: 2 },
    quizTag: { color: '#8A2BE2', fontWeight: '600', fontSize: 13, marginBottom: 8 },
    quizMainTitle: { fontSize: 28, fontWeight: '600', color: '#111', marginBottom: 20 },
    divider: { height: 1, backgroundColor: '#eee', marginBottom: 25 },
    quizMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    quizMetaLabel: { fontSize: 16, color: '#555' },
    quizMetaValue: { fontSize: 16, fontWeight: '600', color: '#111' },
    quizStartActions: { flexDirection: 'row', alignItems: 'center', marginTop: 30 },
    startQuizBtn: { backgroundColor: '#8A2BE2', paddingVertical: 14, paddingHorizontal: 35, borderRadius: 25, marginRight: 20 },
    startQuizBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    skipQuizBtn: { paddingVertical: 10 },
    skipQuizBtnText: { color: '#666', fontSize: 16, fontWeight: '500' },

    quizActiveContainer: { flex: 1 },
    quizActiveHeader: { backgroundColor: '#8A2BE2', paddingVertical: 15, paddingHorizontal: 20 },
    questionCounter: { color: '#fff', fontSize: 16 },
    activeQuestionCard: { padding: 25 },
    activeQuestionText: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 30, lineHeight: 28 },
    optionsList: { gap: 12 },
    webOptionBtn: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
    webOptionBtnSelected: { borderColor: '#8A2BE2', backgroundColor: '#F8F5FF' },
    webRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    webRadioSelected: { borderColor: '#8A2BE2' },
    webRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#8A2BE2' },
    webOptionText: { fontSize: 16, color: '#444', flex: 1 },
    webOptionTextSelected: { color: '#111', fontWeight: '600' },

    quizFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 20 },
    quizBackBtn: { backgroundColor: '#f5f5f5', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25 },
    quizBackBtnText: { color: '#777', fontWeight: '600' },
    quizSubmitBtn: { backgroundColor: '#8A2BE2', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
    quizSubmitBtnText: { color: '#fff', fontWeight: '600' },

    finishQuizBtn: { backgroundColor: '#8A2BE2', paddingVertical: 15, paddingHorizontal: 35, borderRadius: 30, marginTop: 20 },
    finishQuizBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    resultTitle: { fontSize: 24, fontWeight: '600', marginTop: 15 },
    resultScore: { fontSize: 40, fontWeight: '600', color: '#8A2BE2', marginVertical: 10 },
    resultText: { fontSize: 18, color: '#666', marginBottom: 20 },

    // --- Expanded Result View Styles ---
    quizResultContainer: { padding: 20, backgroundColor: '#fff', flex: 1 },
    resultSummaryHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 25 },
    summaryItem: { alignItems: 'center', flex: 1 },
    summaryLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 5 },
    summaryValue: { fontSize: 18, fontWeight: '600', color: '#111' },
    historyTitle: { fontSize: 20, fontWeight: '600', color: '#111', marginBottom: 15 },
    historyScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
    historyTable: { borderTopWidth: 1, borderTopColor: '#f0f0f0', minWidth: 800 },
    tableRowHeader: { flexDirection: 'row', backgroundColor: '#f9f9f9', paddingVertical: 12 },
    tableCellHeader: { fontSize: 11, fontWeight: '600', color: '#777', paddingHorizontal: 10 },
    tableRow: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    tableCell: { fontSize: 13, color: '#444', paddingHorizontal: 10 },
    resultTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
    resultTagText: { fontSize: 11, fontWeight: '600' },
    resultActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, gap: 15 },
    retakeBtn: { flex: 1, backgroundColor: '#f0f0f0', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
    retakeBtnText: { color: '#333', fontWeight: '600', fontSize: 15 },
    continueBtn: { flex: 2, backgroundColor: '#8A2BE2', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
    continueBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
