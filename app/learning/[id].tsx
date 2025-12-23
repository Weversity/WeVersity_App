import { courseService } from '@/src/services/courseService';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    LayoutAnimation, Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.85;

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

// --- Content Renderer ---
const ContentRenderer = ({ lesson }: { lesson: Lesson }) => {
    if (!lesson) return null;

    switch (lesson.type) {
        case 'video':
            return (
                <View style={styles.contentContainer}>
                    <View style={styles.videoPlaceholder}>
                        <Ionicons name="play-circle" size={64} color="#fff" />
                        <Text style={styles.videoPlaceholderText}>Video Player Placeholder</Text>
                    </View>
                    <Text style={styles.heading}>{lesson.title}</Text>
                    <Text style={styles.paragraph}>
                        {lesson.content || "This video lesson covers key concepts. Watch carefully and take notes."}
                    </Text>
                </View>
            );
        case 'quiz':
            return (
                <View style={styles.contentContainer}>
                    <Text style={styles.heading}>{lesson.title}</Text>
                    <View style={styles.quizCard}>
                        <Ionicons name="help-circle-outline" size={48} color="#8A2BE2" />
                        <Text style={styles.quizText}>
                            Total Questions: {lesson.questions?.length || 5}
                        </Text>
                        <Text style={styles.quizSubText}>
                            Test your knowledge on this topic.
                        </Text>
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
                    {lesson.image && (
                        <Image
                            source={{ uri: lesson.image }}
                            style={styles.contentImage}
                        />
                    )}
                    <Text style={styles.paragraph}>
                        {lesson.content || "No content available for this lesson."}
                    </Text>
                </View>
            );
    }
};

// --- Types ---
interface Lesson {
    title: string;
    duration?: string;
    type?: 'video' | 'quiz' | 'article';
    content?: string;
    image?: string;
    questions?: any[];
}

interface Section {
    title: string;
    data: Lesson[];
    isExpanded?: boolean;
}

export default function LearningPlayerScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    // State
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<any>(null);
    const [sections, setSections] = useState<Section[]>([]);

    // Tracking current active lesson
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

    const [sidebarVisible, setSidebarVisible] = useState(false);

    // Animation for Sidebar
    const slideAnimation = useState(new Animated.Value(-SIDEBAR_WIDTH))[0];

    useEffect(() => {
        fetchCourseData();
    }, [id]);

    const fetchCourseData = async () => {
        try {
            if (!id) return;
            setLoading(true);
            const data: any = await courseService.fetchCourseById(Number(id));

            let parsedContent: any = [];
            try {
                parsedContent = typeof data.course_content === 'string'
                    ? JSON.parse(data.course_content)
                    : (data.course_content || []);
            } catch (e) {
                console.error("Failed to parse course content", e);
            }

            const transformedSections: Section[] = [];

            // Check if content is grouped (array of sections) or flat (array of lessons)
            const isGrouped = parsedContent.length > 0 && parsedContent[0].data;

            if (isGrouped) {
                // Already in section format
                transformedSections.push(...parsedContent.map((sec: any, index: number) => ({
                    ...sec,
                    isExpanded: index === 0 // Expand first section
                })));
            } else if (parsedContent.length > 0) {
                // Flat list - Group generically or using a 'section' field if available
                // We will group by 'section' property if it exists, otherwise generic chunks

                // Simple grouping strategy: Check unique 'section' keys
                const sectionMap: Record<string, Lesson[]> = {};
                let hasSectionField = false;

                parsedContent.forEach((lesson: any) => {
                    const secTitle = lesson.section || 'General';
                    if (!sectionMap[secTitle]) sectionMap[secTitle] = [];
                    sectionMap[secTitle].push({ ...lesson, type: lesson.type || 'video' }); // Default to video
                    if (lesson.section) hasSectionField = true;
                });

                if (hasSectionField) {
                    Object.keys(sectionMap).forEach((title, index) => {
                        transformedSections.push({
                            title,
                            data: sectionMap[title],
                            isExpanded: index === 0
                        });
                    });
                } else {
                    // Fallback chunking if no section names provided
                    const chunkSize = 4;
                    for (let i = 0; i < parsedContent.length; i += chunkSize) {
                        const chunk = parsedContent.slice(i, i + chunkSize);
                        transformedSections.push({
                            title: `Module ${Math.floor(i / chunkSize) + 1}`,
                            data: chunk.map((l: any) => ({ ...l, type: l.type || 'video' })),
                            isExpanded: i === 0
                        });
                    }
                }
            } else {
                // Empty state fallback
            }

            setCourse(data);
            setSections(transformedSections);
        } catch (error) {
            console.error(error);
            // Safety fallback
            setSections([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleSidebar = (show: boolean) => {
        if (show) setSidebarVisible(true);
        Animated.timing(slideAnimation, {
            toValue: show ? 0 : -SIDEBAR_WIDTH,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            if (!show) setSidebarVisible(false);
        });
    };

    const toggleSection = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newSections = [...sections];
        newSections[index].isExpanded = !newSections[index].isExpanded;
        setSections(newSections);
    };

    const handleLessonSelect = (sIndex: number, lIndex: number) => {
        setCurrentSectionIndex(sIndex);
        setCurrentLessonIndex(lIndex);
        toggleSidebar(false);
    };

    const handleNextLesson = () => {
        if (sections.length === 0) return;

        const currentSection = sections[currentSectionIndex];
        // If more lessons in current section
        if (currentLessonIndex < currentSection.data.length - 1) {
            setCurrentLessonIndex(prev => prev + 1);
        } else {
            // Move to next section
            if (currentSectionIndex < sections.length - 1) {
                // Expand next section automatically
                const newSections = [...sections];
                newSections[currentSectionIndex + 1].isExpanded = true;
                setSections(newSections);

                setCurrentSectionIndex(prev => prev + 1);
                setCurrentLessonIndex(0);
            } else {
                alert("Course Completed!");
            }
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#8A2BE2" />
            </View>
        );
    }

    const currentSection = sections[currentSectionIndex] || { data: [] };
    const currentLesson = currentSection.data[currentLessonIndex]; // Can be undefined

    const totalLessons = sections.reduce((acc, sec) => acc + sec.data.length, 0);
    const globalCurrentIndex = sections.slice(0, currentSectionIndex).reduce((acc, sec) => acc + sec.data.length, 0) + currentLessonIndex + 1;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* --- Header --- */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => toggleSidebar(true)} style={styles.hamburgerBtn}>
                    <Ionicons name="menu" size={32} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {course?.title || 'Learning Player'}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* --- Sidebar (Overlay) --- */}
            {sidebarVisible && (
                <View style={styles.sidebarOverlay}>
                    {/* Dark Backdrop */}
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={() => toggleSidebar(false)}
                    />

                    {/* Drawer Content */}
                    <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnimation }] }]}>
                        <View style={styles.sidebarHeader}>
                            <Text style={styles.sidebarTitle}>Course Content</Text>
                            <TouchableOpacity onPress={() => toggleSidebar(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.sidebarScroll}>
                            {sections.length > 0 ? sections.map((section, sIndex) => (
                                <View key={sIndex} style={styles.sectionContainer}>
                                    {/* Section Header */}
                                    <TouchableOpacity
                                        style={styles.sectionHeader}
                                        onPress={() => toggleSection(sIndex)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.sectionTitle} numberOfLines={2}>
                                            {section.title}
                                        </Text>
                                        <View style={styles.sectionMetaRow}>
                                            <Text style={styles.sectionProgressText}>
                                                {sIndex === currentSectionIndex ? `${currentLessonIndex + 1}/${section.data.length}` : `0/${section.data.length}`}
                                            </Text>
                                            <Ionicons
                                                name={section.isExpanded ? "chevron-up" : "chevron-down"}
                                                size={18}
                                                color="#666"
                                            />
                                        </View>
                                    </TouchableOpacity>

                                    {/* Child Items */}
                                    {section.isExpanded && (
                                        <View style={styles.sectionBody}>
                                            {section.data.map((lesson, lIndex) => {
                                                const isActive = sIndex === currentSectionIndex && lIndex === currentLessonIndex;
                                                return (
                                                    <TouchableOpacity
                                                        key={lIndex}
                                                        style={[styles.lessonItem, isActive && styles.activeLessonItem]}
                                                        onPress={() => handleLessonSelect(sIndex, lIndex)}
                                                    >
                                                        <Ionicons
                                                            name={lesson.type === 'quiz' ? "help-circle-outline" : (lesson.type === 'article' ? "document-text-outline" : "play-circle-outline")}
                                                            size={20}
                                                            color={isActive ? "#8A2BE2" : "#888"}
                                                            style={{ marginRight: 10 }}
                                                        />
                                                        <Text
                                                            style={[styles.lessonItemTitle, isActive && styles.activeLessonText]}
                                                            numberOfLines={2}
                                                        >
                                                            {lesson.title}
                                                        </Text>
                                                        {isActive && (
                                                            <View style={styles.activeIndicator} />
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    )}
                                </View>
                            )) : (
                                <View style={{ padding: 20 }}>
                                    <Text style={{ color: '#999', textAlign: 'center' }}>No lessons available.</Text>
                                </View>
                            )}
                        </ScrollView>
                    </Animated.View>
                </View>
            )}

            {/* --- Main Content --- */}
            <ScrollView style={styles.scrollBody} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Lesson Title Header inside content */}
                <View style={styles.lessonHeader}>
                    <Text style={styles.lessonTitle}>{currentLesson?.title || 'Select a Lesson'}</Text>
                    <Text style={styles.lessonBreadcrumb}>
                        {currentSection?.title || 'Course Overview'}
                    </Text>
                </View>

                {currentLesson ? (
                    <ContentRenderer lesson={currentLesson} />
                ) : (
                    <View style={[styles.contentContainer, styles.center]}>
                        <Text style={{ color: '#888' }}>Please select a lesson from the menu.</Text>
                    </View>
                )}
            </ScrollView>

            {/* --- Footer Navigation --- */}
            <View style={styles.footer}>
                <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                        {totalLessons > 0 ? `Lesson ${globalCurrentIndex} of ${totalLessons}` : 'No Lessons'}
                    </Text>
                    {/* Simple Progress Bar */}
                    <View style={styles.progressBarBg}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${totalLessons > 0 ? (globalCurrentIndex / totalLessons) * 100 : 0}%` }
                            ]}
                        />
                    </View>
                </View>

                <TouchableOpacity style={[styles.nextButton, sections.length === 0 && { opacity: 0.5 }]} onPress={handleNextLesson} disabled={sections.length === 0}>
                    <Text style={styles.nextButtonText}>Next</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { justifyContent: 'center', alignItems: 'center' },

    // Header Refined
    header: {
        height: 100, // Taller header to accommodate status bar spacing
        paddingTop: 40, // Push content down
        backgroundColor: '#8A2BE2',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    hamburgerBtn: {
        padding: 5,
        zIndex: 10,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 10,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    backBtn: {
        padding: 5,
        zIndex: 10,
    },

    // Sidebar
    sidebarOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1000,
        flexDirection: 'row',
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sidebar: {
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: SIDEBAR_WIDTH,
        backgroundColor: '#fff',
        zIndex: 1001,
        shadowColor: "#000",
        shadowOffset: { width: 5, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    sidebarHeader: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    sidebarTitle: {
        fontSize: 18, fontWeight: 'bold', color: '#000',
    },
    sidebarScroll: {
        paddingBottom: 50,
    },

    // Accordion Sections
    sectionContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    sectionTitle: {
        fontSize: 15, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10,
    },
    sectionMetaRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
    },
    sectionProgressText: {
        fontSize: 12, color: '#999',
    },
    sectionBody: {
        backgroundColor: '#fff',
        paddingBottom: 10,
    },

    // Lesson Items
    lessonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 30, // Indented
    },
    activeLessonItem: {
        backgroundColor: '#F7F0FF', // Subtle purple tint
    },
    lessonItemTitle: {
        fontSize: 14, color: '#555', flex: 1,
    },
    activeLessonText: {
        color: '#8A2BE2', fontWeight: 'bold',
    },
    activeIndicator: {
        width: 8, height: 8, borderRadius: 4, backgroundColor: '#8A2BE2', marginLeft: 10,
    },

    // Content Area
    scrollBody: { flex: 1, backgroundColor: '#fff' },
    lessonHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    lessonTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    lessonBreadcrumb: { fontSize: 13, color: '#888' },

    contentContainer: { padding: 20 },
    heading: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    subHeading: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: '#444' },
    contentImage: {
        width: '100%', height: 200, borderRadius: 8, marginBottom: 20,
        resizeMode: 'cover',
    },
    paragraph: {
        fontSize: 15, lineHeight: 24, color: '#555', marginBottom: 15, textAlign: 'justify',
    },
    // Video Placeholder
    videoPlaceholder: {
        width: '100%',
        height: 220,
        backgroundColor: '#000',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    videoPlaceholderText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 14,
    },
    // Quiz Card
    quizCard: {
        backgroundColor: '#F4F0FF',
        borderRadius: 15,
        padding: 30,
        alignItems: 'center',
        marginTop: 10,
    },
    quizText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 15 },
    quizSubText: { fontSize: 14, color: '#666', marginTop: 5, marginBottom: 20, textAlign: 'center' },
    quizButton: {
        backgroundColor: '#8A2BE2',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 25,
    },
    quizButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // Footer
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        paddingBottom: 25, // For iPhone home bar
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 10,
    },
    progressContainer: { flex: 1, marginRight: 20 },
    progressText: { fontSize: 12, color: '#888', marginBottom: 6 },
    progressBarBg: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#8A2BE2' },

    nextButton: {
        backgroundColor: '#8A2BE2',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    nextButtonText: { color: '#fff', fontWeight: 'bold', marginRight: 5, fontSize: 15 },
});
