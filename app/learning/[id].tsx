import { supabase } from '@/src/auth/supabase';
import { courseService } from '@/src/services/courseService';
import { Ionicons } from '@expo/vector-icons';
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

const ContentRenderer = ({
    lesson,
    onStartQuiz,
    isQuizStarted,
    currentQuestionIndex,
    selectedAnswers,
    onOptionSelect,
    onSubmitQuestion,
    onBackQuestion,
    onSkipQuiz,
    quizResult,
    onFinishQuiz,
    onRetakeQuiz
}: {
    lesson: Lesson | null;
    onStartQuiz: () => void;
    isQuizStarted: boolean;
    currentQuestionIndex: number;
    selectedAnswers: Record<number, number>;
    onOptionSelect: (index: number) => void;
    onSubmitQuestion: () => void;
    onBackQuestion: () => void;
    onSkipQuiz: () => void;
    quizResult: {
        score: number;
        total: number;
        percentage: number;
        correctAnswers: number;
        incorrectAnswers: number;
        earnedMarks: string;
        passingMarks: string;
        timestamp: string;
    } | null;
    onFinishQuiz: () => void;
    onRetakeQuiz: () => void;
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
                    <Text style={styles.heading}>{lesson.title}</Text>
                    {lesson.content && !lesson.video_url && !lesson.video_link && !lesson.content.startsWith('http') && (
                        <Text style={styles.paragraph}>{lesson.content}</Text>
                    )}
                </View>
            );
        case 'quiz':
            if (quizResult) {
                return (
                    <View style={styles.quizResultContainer}>
                        <Text style={styles.quizTag}>QUIZ</Text>
                        <Text style={styles.quizMainTitle}>{lesson.title}</Text>
                        <View style={styles.divider} />

                        {/* Summary Header */}
                        <View style={styles.resultSummaryHeader}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Questions</Text>
                                <Text style={styles.summaryValue}>{quizResult.total}</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Quiz Time</Text>
                                <Text style={styles.summaryValue}>Not timed</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Total Marks</Text>
                                <Text style={styles.summaryValue}>{quizResult.total}.00</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Passing Marks</Text>
                                <Text style={styles.summaryValue}>{quizResult.passingMarks}</Text>
                            </View>
                        </View>

                        <Text style={styles.historyTitle}>Attempt History</Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
                            <View style={styles.historyTable}>
                                {/* Table Header */}
                                <View style={styles.tableRowHeader}>
                                    <Text style={[styles.tableCellHeader, { width: 140 }]}>DATE</Text>
                                    <Text style={[styles.tableCellHeader, { width: 80 }]}>QUESTION</Text>
                                    <Text style={[styles.tableCellHeader, { width: 100 }]}>TOTAL MARKS</Text>
                                    <Text style={[styles.tableCellHeader, { width: 120 }]}>CORRECT ANSWER</Text>
                                    <Text style={[styles.tableCellHeader, { width: 130 }]}>INCORRECT ANSWER</Text>
                                    <Text style={[styles.tableCellHeader, { width: 120 }]}>EARNED MARKS</Text>
                                    <Text style={[styles.tableCellHeader, { width: 80 }]}>RESULT</Text>
                                </View>

                                {/* Table Body - Single current attempt */}
                                <View style={styles.tableRow}>
                                    <Text style={[styles.tableCell, { width: 140 }]}>{quizResult.timestamp}</Text>
                                    <Text style={[styles.tableCell, { width: 80 }]}>{quizResult.total}</Text>
                                    <Text style={[styles.tableCell, { width: 100 }]}>{quizResult.total}.00</Text>
                                    <Text style={[styles.tableCell, { width: 120, color: '#4CAF50', fontWeight: 'bold' }]}>{quizResult.correctAnswers}</Text>
                                    <Text style={[styles.tableCell, { width: 130, color: '#f44336', fontWeight: 'bold' }]}>{quizResult.incorrectAnswers}</Text>
                                    <Text style={[styles.tableCell, { width: 120 }]}>{quizResult.earnedMarks} ({quizResult.percentage}%)</Text>
                                    <View style={[styles.tableCell, { width: 80 }]}>
                                        <View style={[styles.resultTag, { backgroundColor: quizResult.percentage >= 80 ? '#e8f5e9' : '#ffebee' }]}>
                                            <Text style={[styles.resultTagText, { color: quizResult.percentage >= 80 ? '#2e7d32' : '#c62828' }]}>
                                                {quizResult.percentage >= 80 ? 'Pass' : 'Fail'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.resultActions}>
                            <TouchableOpacity style={styles.retakeBtn} onPress={onRetakeQuiz}>
                                <Text style={styles.retakeBtnText}>Retake Quiz</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.continueBtn} onPress={onFinishQuiz}>
                                <Text style={styles.continueBtnText}>Continue to Next Lesson</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            }

            if (!isQuizStarted) {
                return (
                    <View style={styles.quizStartContainer}>
                        <Text style={styles.quizTag}>QUIZ</Text>
                        <Text style={styles.quizMainTitle}>{lesson.title}</Text>
                        <View style={styles.divider} />

                        <View style={styles.quizMetaRow}>
                            <Text style={styles.quizMetaLabel}>Questions:</Text>
                            <Text style={styles.quizMetaValue}>{lesson.questions?.length || 0} of {lesson.questions?.length || 0}</Text>
                        </View>
                        <View style={styles.quizMetaRow}>
                            <Text style={styles.quizMetaLabel}>Quiz Time:</Text>
                            <Text style={styles.quizMetaValue}>Not timed</Text>
                        </View>
                        <View style={styles.quizMetaRow}>
                            <Text style={styles.quizMetaLabel}>Total Attempted:</Text>
                            <Text style={styles.quizMetaValue}>0/{lesson.questions?.length || 0}</Text>
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
            }

            const currentQuestion = lesson.questions?.[currentQuestionIndex];
            const selectedOption = selectedAnswers[currentQuestionIndex];

            return (
                <View style={styles.quizActiveContainer}>
                    <View style={styles.quizActiveHeader}>
                        <Text style={styles.questionCounter}>Question: <Text style={{ fontWeight: 'bold' }}>{currentQuestionIndex + 1}/{lesson.questions?.length}</Text></Text>
                    </View>

                    <View style={styles.activeQuestionCard}>
                        <Text style={styles.activeQuestionText}>
                            {currentQuestionIndex + 1}. {currentQuestion?.question_text || currentQuestion?.question || ''}
                        </Text>

                        <View style={styles.optionsList}>
                            {(currentQuestion?.options || []).map((option: any, idx: number) => {
                                const isSelected = selectedOption === idx;
                                const optionText = typeof option === 'object' ? option.text : option;
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.webOptionBtn, isSelected && styles.webOptionBtnSelected]}
                                        onPress={() => onOptionSelect(idx)}
                                    >
                                        <View style={[styles.webRadio, isSelected && styles.webRadioSelected]}>
                                            {isSelected && <View style={styles.webRadioInner} />}
                                        </View>
                                        <Text style={[styles.webOptionText, isSelected && styles.webOptionTextSelected]}>{optionText}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.quizFooter}>
                        <TouchableOpacity
                            style={[styles.quizBackBtn, currentQuestionIndex === 0 && { opacity: 0.5 }]}
                            onPress={onBackQuestion}
                            disabled={currentQuestionIndex === 0}
                        >
                            <Text style={styles.quizBackBtnText}>← Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quizSubmitBtn, selectedOption === undefined && { opacity: 0.5 }]}
                            onPress={onSubmitQuestion}
                            disabled={selectedOption === undefined}
                        >
                            <Text style={styles.quizSubmitBtnText}>
                                {currentQuestionIndex === (lesson.questions?.length || 0) - 1 ? 'Finish Quiz' : 'Submit & Next →'}
                            </Text>
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

    // Quiz States
    const [isQuizStarted, setIsQuizStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [quizResult, setQuizResult] = useState<{
        score: number;
        total: number;
        percentage: number;
        correctAnswers: number;
        incorrectAnswers: number;
        earnedMarks: string;
        passingMarks: string;
        timestamp: string;
    } | null>(null);

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
        // Reset quiz when lesson changes
        setIsQuizStarted(false);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setQuizResult(null);
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

    const handleStartQuiz = () => {
        setIsQuizStarted(true);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setQuizResult(null);
    };

    const handleOptionSelect = (index: number) => {
        setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: index }));
    };

    const handleBackQuestion = () => {
        if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1);
    };

    const handleSubmitQuestion = () => {
        const lesson = getCurrentLesson();
        if (!lesson?.questions) return;

        if (currentQuestionIndex < lesson.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Calculate Score
            let score = 0;
            lesson.questions.forEach((q: any, idx: number) => {
                const selected = selectedAnswers[idx];
                const options = q.options || [];
                const option = options[selected];

                // Flexible matching for correct answer
                const isCorrect = q.isCorrect ||
                    (typeof option === 'object' && (option.isCorrect || String(option.id) === String(q.correct_answer))) ||
                    String(option) === String(q.correct_answer);

                if (isCorrect) score++;
            });

            const percentage = Math.round((score / lesson.questions.length) * 100);
            const now = new Date();
            const timestamp = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

            setQuizResult({
                score,
                total: lesson.questions.length,
                percentage,
                correctAnswers: score,
                incorrectAnswers: lesson.questions.length - score,
                earnedMarks: `${score}.00`,
                passingMarks: `${Math.ceil(lesson.questions.length * 0.8)}.00`,
                timestamp
            });
        }
    };

    const handleRetakeQuiz = () => {
        setIsQuizStarted(true);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setQuizResult(null);
    };

    const handleSkipQuiz = () => {
        handleCompleteAndNext();
    };

    const handleFinishQuizResult = () => {
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
                <ContentRenderer
                    lesson={currentLesson}
                    onStartQuiz={handleStartQuiz}
                    isQuizStarted={isQuizStarted}
                    currentQuestionIndex={currentQuestionIndex}
                    selectedAnswers={selectedAnswers}
                    onOptionSelect={handleOptionSelect}
                    onSubmitQuestion={handleSubmitQuestion}
                    onBackQuestion={handleBackQuestion}
                    onSkipQuiz={handleSkipQuiz}
                    quizResult={quizResult}
                    onFinishQuiz={handleFinishQuizResult}
                    onRetakeQuiz={handleRetakeQuiz}
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
    resultCard: { backgroundColor: '#F4F0FF', borderRadius: 15, padding: 25, alignItems: 'center', marginTop: 10 },
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

    // --- Website Style Quiz Styles ---
    quizStartContainer: { padding: 30, backgroundColor: '#fff', borderRadius: 15, margin: 10, elevation: 2 },
    quizTag: { color: '#8A2BE2', fontWeight: 'bold', fontSize: 13, marginBottom: 8 },
    quizMainTitle: { fontSize: 28, fontWeight: 'bold', color: '#111', marginBottom: 20 },
    divider: { height: 1, backgroundColor: '#eee', marginBottom: 25 },
    quizMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    quizMetaLabel: { fontSize: 16, color: '#555' },
    quizMetaValue: { fontSize: 16, fontWeight: 'bold', color: '#111' },
    quizStartActions: { flexDirection: 'row', alignItems: 'center', marginTop: 30 },
    startQuizBtn: { backgroundColor: '#8A2BE2', paddingVertical: 14, paddingHorizontal: 35, borderRadius: 25, marginRight: 20 },
    startQuizBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    skipQuizBtn: { paddingVertical: 10 },
    skipQuizBtnText: { color: '#666', fontSize: 16, fontWeight: '500' },

    quizActiveContainer: { flex: 1 },
    quizActiveHeader: { backgroundColor: '#8A2BE2', paddingVertical: 15, paddingHorizontal: 20 },
    questionCounter: { color: '#fff', fontSize: 16 },
    activeQuestionCard: { padding: 25 },
    activeQuestionText: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 30, lineHeight: 28 },
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
    quizBackBtnText: { color: '#777', fontWeight: 'bold' },
    quizSubmitBtn: { backgroundColor: '#8A2BE2', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
    quizSubmitBtnText: { color: '#fff', fontWeight: 'bold' },

    finishQuizBtn: { backgroundColor: '#8A2BE2', paddingVertical: 15, paddingHorizontal: 35, borderRadius: 30, marginTop: 20 },
    finishQuizBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    resultTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 15 },
    resultScore: { fontSize: 40, fontWeight: 'bold', color: '#8A2BE2', marginVertical: 10 },
    resultText: { fontSize: 18, color: '#666', marginBottom: 20 },

    // --- Expanded Result View Styles ---
    quizResultContainer: { padding: 20, backgroundColor: '#fff', flex: 1 },
    resultSummaryHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 25 },
    summaryItem: { alignItems: 'center', flex: 1 },
    summaryLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 5 },
    summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    historyTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 15 },
    historyScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
    historyTable: { borderTopWidth: 1, borderTopColor: '#f0f0f0', minWidth: 800 },
    tableRowHeader: { flexDirection: 'row', backgroundColor: '#f9f9f9', paddingVertical: 12 },
    tableCellHeader: { fontSize: 11, fontWeight: 'bold', color: '#777', paddingHorizontal: 10 },
    tableRow: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    tableCell: { fontSize: 13, color: '#444', paddingHorizontal: 10 },
    resultTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
    resultTagText: { fontSize: 11, fontWeight: '600' },
    resultActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, gap: 15 },
    retakeBtn: { flex: 1, backgroundColor: '#f0f0f0', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
    retakeBtnText: { color: '#333', fontWeight: 'bold', fontSize: 15 },
    continueBtn: { flex: 2, backgroundColor: '#8A2BE2', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
    continueBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
