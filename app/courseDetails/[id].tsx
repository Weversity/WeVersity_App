
import { supabase } from '@/src/auth/supabase';
import AccessDeniedModal from '@/src/components/AccessDeniedModal';
import { useAuth } from '@/src/context/AuthContext';
import { courseService } from '@/src/services/courseService';
import { Course, Lesson, LessonType, Review, Section } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Local search params type for this screen
interface CourseDetailsParams extends Record<string, string | string[] | undefined> {
    id: string;
    title?: string;
    thumbnail?: string;
    instructor?: string;
    categories?: string;
    price?: string;
    rating?: string;
    reviewCount?: string;
}

// -----------------------------------------------------------------------------
// Robust Parsing Helpers (Ultra-Flexible)
// -----------------------------------------------------------------------------

/**
 * Helper to find a value from multiple potential key names.
 * Scans object keys to match any of the provided candidates.
 */
const findKey = (obj: any, keys: string[]): any => {
    if (!obj || typeof obj !== 'object') return undefined;
    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) {
            return obj[key];
        }
    }
    return undefined;
};

const getLessonType = (lesson: any): LessonType => {
    // 1. Explicit Type Check
    const explicitType = findKey(lesson, ['type', 'lesson_type', 'category', 'post_type']);
    if (explicitType) {
        const lower = String(explicitType).toLowerCase();
        if (['video', 'movie', 'film', 'mp4'].some(s => lower.includes(s))) return 'video';
        if (['quiz', 'test', 'exam', 'assessment'].some(s => lower.includes(s))) return 'quiz';
        if (['article', 'text', 'reading', 'note', 'document'].some(s => lower.includes(s))) return 'article';
    }

    // 2. Smart URL/Content Detection
    const content = findKey(lesson, ['video_url', 'video_link', 'url', 'file', 'link', 'bg_video', 'src', 'source']);

    if (typeof content === 'string') {
        const lowerContent = content.toLowerCase();
        // Check for common video extensions or provider URLs
        if (
            lowerContent.includes('.mp4') ||
            lowerContent.includes('.mov') ||
            lowerContent.includes('.m3u8') ||
            lowerContent.includes('.avi') ||
            lowerContent.includes('.webm') ||
            lowerContent.includes('youtube.com') ||
            lowerContent.includes('youtu.be') ||
            lowerContent.includes('vimeo.com') ||
            lowerContent.includes('cloudinary.com') ||
            lowerContent.includes('wistia.com') ||
            (lesson.video_url && typeof lesson.video_url === 'string')
        ) {
            return 'video';
        }
    }

    // 3. Quiz Detection
    const questions = findKey(lesson, ['questions', 'quiz_questions', 'items', 'options']);
    // 'items' check is risky as it might be children, so validation is needed
    if (questions && Array.isArray(questions) && questions.length > 0) {
        // Deep check: do items look like questions?
        const firstQ = questions[0];
        if (firstQ && (firstQ.question || firstQ.options || firstQ.correct_answer || firstQ.answers)) {
            return 'quiz';
        }
    }

    return 'article';
};

/**
 * Recursive Lesson Processor
 * Deeply searches for children and flattens/maps them.
 */
const processLesson = (lessonData: any, level: number = 0): Lesson => {
    // 1. Handle simple string case
    if (typeof lessonData !== 'object' || lessonData === null) {
        return {
            id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: String(lessonData),
            type: 'article',
            duration: '',
            is_free: false,
        };
    }

    // 2. Extract Fields (Deep Search)
    const title = findKey(lessonData, ['title', 'name', 'label', 'header', 'caption']) || `Lesson`;
    const rawId = findKey(lessonData, ['id', '_id', 'lesson_id', 'uuid', 'ID']);
    const id = rawId !== undefined ? rawId : `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duration = findKey(lessonData, ['duration', 'time', 'length', 'runtime']);
    const isFree = findKey(lessonData, ['is_free', 'free', 'preview', 'is_preview']);
    const content = findKey(lessonData, ['content', 'description', 'html', 'body', 'text']);
    const videoUrl = findKey(lessonData, ['video_url', 'url', 'video_link', 'file', 'link', 'bg_video']);

    // 3. Determine Type
    let type = getLessonType(lessonData);

    // 4. Recursive Children Check (Deep & Wide)
    // Check ALL possible keys for children
    const childrenKeys = ['items', 'lessons', 'children', 'sub_lessons', 'data', 'contents', 'child_items', 'modules', 'topics', 'sections', 'chapters'];
    const childrenRaw = findKey(lessonData, childrenKeys);

    let validChildren: Lesson[] = [];
    if (childrenRaw && Array.isArray(childrenRaw) && childrenRaw.length > 0) {
        validChildren = childrenRaw.map((child: any) => processLesson(child, level + 1));
    }

    return {
        id: id,
        title: String(title),
        type,
        duration: duration ? String(duration) : undefined,
        content: content ? String(content) : undefined,
        video_url: videoUrl ? String(videoUrl) : undefined,
        is_free: !!isFree,
        lessons: validChildren.length > 0 ? validChildren : undefined,
        ...lessonData
    };
};

const processCourseContent = (content: any): Section[] => {
    if (!content) return [];

    console.log('[Parser] STARTING PARSE. Root Type:', Array.isArray(content) ? 'Array' : typeof content);
    if (typeof content === 'object' && !Array.isArray(content)) {
        console.log('[Parser] Root Keys:', Object.keys(content));
    }

    let rawSections: any[] = [];

    // 1. Normalize to Array of Sections
    if (Array.isArray(content)) {
        rawSections = content;
    } else if (typeof content === 'object') {
        const potentialArray = findKey(content, ['sections', 'modules', 'weeks', 'chapters', 'data', 'items', 'contents', 'course_content']);
        if (potentialArray && Array.isArray(potentialArray)) {
            rawSections = potentialArray;
        } else {
            // Fallback: values of object
            const values = Object.values(content);
            // If values look like objects, treat as potential sections
            if (values.length > 0 && typeof values[0] === 'object') {
                rawSections = values;
            } else {
                // Last resort: content itself is a single section?
                rawSections = [content];
            }
        }
    }

    if (!Array.isArray(rawSections)) {
        console.warn('[Parser] Failed to extract sections array.');
        return [];
    }

    console.log(`[Parser] Found ${rawSections.length} potential sections.`);

    return rawSections.map((sectionData: any, index: number) => {
        if (!sectionData) return { title: `Section ${index + 1}`, data: [], isExpanded: false };

        console.log(`[Parser] Processing Section ${index + 1} Keys:`, Object.keys(sectionData));

        // Section Title
        let title = findKey(sectionData, ['title', 'name', 'label', 'section_title', 'module_title', 'header']) || `Section ${index + 1}`;

        // Items (Lessons) Array - Deep Search
        const lessonsRaw = findKey(sectionData, ['items', 'lessons', 'data', 'contents', 'child_items', 'topics', 'lectures', 'sub_items', 'sections', 'modules', 'chapters']);

        let processedLessons: Lesson[] = [];

        if (lessonsRaw && Array.isArray(lessonsRaw)) {
            // Standard Case: Found an array of lessons
            processedLessons = lessonsRaw.map((l: any) => processLesson(l, 0));
        } else if (Array.isArray(sectionData)) {
            // "Empty" Section Case: The section itself is just an array of items (no wrapper object)
            // Or the 'content' was an array of arrays?
            processedLessons = sectionData.map((l: any) => processLesson(l, 0));
        } else {
            // Fallback Case: Section object has no clear children array.
            // Does it look like a lesson itself?
            const potentialType = getLessonType(sectionData);
            const hasVideo = !!findKey(sectionData, ['video_url', 'url', 'video_link']);

            if (potentialType !== 'article' || hasVideo) {
                console.log(`[Parser] Section "${title}" looks like a lesson. Promoting.`);
                processedLessons = [processLesson(sectionData, 0)];
            }
        }

        console.log(`[Parser] Section "${title}": Parsed ${processedLessons.length} items`);

        return {
            title: String(title),
            data: processedLessons, // UI always uses 'data'
            isExpanded: index === 0,
        };
    });
};

const stripHtmlTags = (htmlString: string) => {
    if (!htmlString) return '';
    let cleanText = htmlString.replace(/<!--[\s\S]*?-->/g, "");
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
    const params = useLocalSearchParams() as unknown as CourseDetailsParams;
    const { id, title, thumbnail, instructor, categories, price, rating, reviewCount } = params;
    const router = useRouter();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'About' | 'Lessons' | 'Reviews'>('About');

    // Use params as initial course state for instant rendering
    const [course, setCourse] = useState<Course | null>(() => {
        if (!id || !title) return null;
        return {
            id: id,
            title: title as string,
            categories: (categories as string) || 'General',
            is_free: price === '0' || price === 'Free',
            image: (thumbnail as string) || 'https://via.placeholder.com/400x250',
            price: (price as string) || 'Free',
            description: '',
            sections: [],
            instructor: (instructor as string) || 'Instructor',
            rating: Number(rating) || 0,
            reviews: [],
            reviewCount: Number(reviewCount) || 0,
            students: 0,
            lessonCount: 0,
            duration: '...',
            course_content: null,
            what_you_will_learn: null,
        };
    });

    const [loading, setLoading] = useState(!course);
    const [error, setError] = useState<string | null>(null);

    // Enrollment and Progress States
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [progress, setProgress] = useState(0);
    const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

    // Access Denied Modal State
    const [isAccessDeniedVisible, setIsAccessDeniedVisible] = useState(false);
    const [enrollmentLoading, setEnrollmentLoading] = useState(false);

    // 1. Fetch Metadata
    const { data: fullCourseData, isLoading: isQueryLoading } = useQuery({
        queryKey: ['course', id],
        queryFn: () => courseService.fetchCourseById(String(id)),
        enabled: !!id,
    });

    // 2. Fetch Content
    const { data: contentData, isLoading: isContentLoading } = useQuery({
        queryKey: ['courseContent', id],
        queryFn: () => courseService.fetchFullCurriculum(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 30, // 30 mins cached
    });

    // MEMOIZED CALCULATION: Process content and stats
    const processedContent = useMemo(() => {
        let contentToProcess = contentData;

        // If contentData is null (empty relational result), we don't have a fallback anymore
        // since we're using the relational model and course_content is null by definition.

        let transformedSections: Section[] = [];
        let lessonCount = 0;
        let durationStr = "0 lessons";

        if (contentToProcess && Array.isArray(contentToProcess)) {
            // The relational fetch already returns a normalized Section[] format
            transformedSections = contentToProcess;

            // Calculate total lessons
            transformedSections.forEach(section => {
                lessonCount += section.data?.length || 0;
            });

            durationStr = `${lessonCount} ${lessonCount === 1 ? 'lesson' : 'lessons'}`;
        }

        return { contentToProcess, transformedSections, lessonCount, durationStr };
    }, [contentData]);

    useEffect(() => {
        const processData = async () => {
            // Use local log to track execution
            console.log('[CourseDetails] processData triggering. ID:', id, {
                hasContent: !!contentData
            });

            const { contentToProcess, transformedSections, lessonCount, durationStr } = processedContent;

            if (!fullCourseData && !course && transformedSections.length === 0) return;

            try {

                // 2. DETERMINE METADATA SOURCE
                let finalStudentCount = course?.students || 0;
                let calculatedAvgRating = course?.rating || Number(rating) || 0;
                let mappedReviews = course?.reviews || [];
                let reviewsCount = course?.reviewCount || Number(reviewCount) || 0;

                let instructorName = course?.instructor || (instructor as string) || 'Instructor';
                let instructorAvatar = course?.instructorAvatar;
                let instructorInitials = course?.instructorInitials || 'IN';
                let currentDescription = course?.description || '';
                let priceDisplay = course?.price || 'Free';
                let tools = course?.tools || [];
                let categoryDisplay = course?.categories || 'General';
                let whatWillILearn: string[] | null = null;
                let image = course?.image || (thumbnail as string);

                if (fullCourseData) {
                    const data = fullCourseData;
                    if (data.title) image = data.thumbnail || data.image || image; // Update image if available
                    currentDescription = data.description || '';
                    priceDisplay = (data as any).price || 'Free';
                    tools = (data as any).tools || [];
                    categoryDisplay = (data as any).categories || 'General';
                    const rawPoints = (data as any).what_you_will_learn;
                    if (Array.isArray(rawPoints)) {
                        whatWillILearn = rawPoints;
                    } else if (typeof rawPoints === 'string') {
                        try {
                            const parsed = JSON.parse(rawPoints);
                            whatWillILearn = Array.isArray(parsed) ? parsed : [rawPoints];
                        } catch {
                            whatWillILearn = [rawPoints];
                        }
                    }

                    if (data.instructor) {
                        const inst = Array.isArray(data.instructor) ? data.instructor[0] : data.instructor;
                        if (inst) {
                            instructorName = `${inst.first_name || ''} ${inst.last_name || ''}`.trim();
                            instructorAvatar = inst.avatar_url;
                            instructorInitials = ((inst.first_name?.[0] || '') + (inst.last_name?.[0] || '')).toUpperCase() || 'IN';
                        }
                    }

                    try {
                        const { count: realStudentCount } = await supabase
                            .from('enrollments')
                            .select('*', { count: 'exact', head: true })
                            .eq('course_id', id);
                        finalStudentCount = realStudentCount || 0;
                    } catch (e) {
                        console.warn("Non-critical: Error fetching student count", e);
                    }

                    try {
                        const { data: reviewsRaw } = await supabase
                            .from('reviews')
                            .select('id, rating, content, created_at, student_id')
                            .eq('course_id', id)
                            .order('created_at', { ascending: false });

                        reviewsCount = reviewsRaw?.length || 0;
                        if (reviewsCount > 0) {
                            const sum = reviewsRaw!.reduce((acc: any, r: any) => acc + (r.rating || 0), 0);
                            calculatedAvgRating = sum / reviewsCount;

                            const studentIds = Array.from(new Set(reviewsRaw!.map((r: any) => r.student_id).filter(Boolean)));
                            let profileMap: Record<string, any> = {};

                            if (studentIds.length > 0) {
                                const { data: profilesData } = await supabase
                                    .from('profiles')
                                    .select('id, first_name, last_name, avatar_url')
                                    .in('id', studentIds);

                                profilesData?.forEach((p: any) => {
                                    profileMap[p.id] = p;
                                });
                            }

                            mappedReviews = reviewsRaw!.map((r: any) => {
                                const prof = profileMap[r.student_id];
                                const first = prof?.first_name || '';
                                const last = prof?.last_name || '';
                                const initials = (first?.[0] || '') + (last?.[0] || '');

                                return {
                                    id: r.id,
                                    rating: r.rating,
                                    content: r.content,
                                    created_at: r.created_at,
                                    user: {
                                        name: prof ? `${first} ${last}`.trim() : 'Anonymous Student',
                                        avatar: prof?.avatar_url,
                                        initials: initials.toUpperCase() || 'AS'
                                    }
                                };
                            });
                        }
                    } catch (e) {
                        console.warn("Non-critical: Error fetching reviews", e);
                    }
                }

                setCourse(prev => {
                    const base = prev || {
                        id: id,
                        title: title as string,
                        categories: 'General',
                        is_free: true,
                        image: (thumbnail as string) || 'https://via.placeholder.com/400x250',
                        price: 'Free',
                        description: '',
                        sections: [],
                        instructor: 'Instructor',
                        rating: 0,
                        reviews: [],
                        reviewCount: 0,
                        students: 0,
                        lessonCount: 0,
                        duration: '...',
                        course_content: null,
                        what_you_will_learn: null,
                    };

                    const sectionsChanged = JSON.stringify(prev?.sections) !== JSON.stringify(transformedSections);
                    const reviewsChanged = prev?.reviews.length !== mappedReviews.length;

                    // Force update if we have new sections and previous were empty
                    const robustSections = transformedSections.length > 0 ? transformedSections : base.sections;

                    if (!prev || sectionsChanged || reviewsChanged) {
                        return {
                            ...base,
                            image: image || base.image,
                            title: fullCourseData?.title || base.title,
                            description: currentDescription,
                            sections: robustSections,
                            instructor: instructorName,
                            instructorAvatar,
                            instructorInitials,
                            rating: calculatedAvgRating,
                            reviews: mappedReviews,
                            reviewCount: reviewsCount,
                            students: finalStudentCount,
                            lessonCount: lessonCount > 0 ? lessonCount : base.lessonCount,
                            duration: durationStr !== '...' ? durationStr : base.duration,
                            tools,
                            categories: categoryDisplay,
                            price: priceDisplay,
                            course_content: contentToProcess,
                            what_you_will_learn: whatWillILearn
                        };
                    }
                    return prev;
                });
            } catch (err: any) {
                console.error("Critical error in processData:", err);
                if (!course) {
                    setError(err.message || 'Failed to process course data');
                }
            } finally {
                setLoading(false);
            }
        };

        processData();
        // Add id, fullCourseData, contentData, and parsed result as dependencies
    }, [fullCourseData, contentData, processedContent, id]);

    useEffect(() => {
        const fetchEnrollment = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && id) {
                const { data: enrollData } = await supabase
                    .from('enrollments')
                    .select('student_id, course_id, completed_lessons')
                    .eq('student_id', user.id)
                    .eq('course_id', id)
                    .maybeSingle();

                if (enrollData) {
                    setIsEnrolled(true);
                    let completedIds: string[] = [];
                    if (enrollData.completed_lessons && Array.isArray(enrollData.completed_lessons)) {
                        completedIds = enrollData.completed_lessons.map(String);
                    }
                    setCompletedLessonIds(completedIds);
                }
            }
        };
        fetchEnrollment();
    }, [id]);

    useEffect(() => {
        if (course && course.lessonCount > 0 && completedLessonIds.length > 0) {
            setProgress(Math.round((completedLessonIds.length / course.lessonCount) * 100));
        } else {
            setProgress(0);
        }
    }, [course?.lessonCount, completedLessonIds]);

    const handleEnroll = useCallback(async (sIdx?: number, lIdx?: number, slIdx?: number) => {
        if (!course?.id) return;

        if (isEnrolled && user) {
            router.push({
                pathname: `/learning/${course.id}`,
                params: {
                    sectionIndex: sIdx !== undefined ? sIdx : 0,
                    lessonIndex: lIdx !== undefined ? lIdx : 0,
                    subLessonIndex: slIdx !== undefined ? slIdx : undefined
                }
            } as any);
        } else {
            // trying to access lesson without being enrolled
            if (sIdx !== undefined) {
                setIsAccessDeniedVisible(true);
            } else {
                // Main Enroll Button
                if (!user) {
                    Alert.alert(
                        "Login Required",
                        "Please login to enroll and start learning this course.",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Login", onPress: () => router.push('/profile' as any) }
                        ]
                    );
                    return;
                }

                try {
                    setEnrollmentLoading(true);

                    // Check if already enrolled to avoid unique constraint error
                    const { data: existingEnrollment } = await supabase
                        .from('enrollments')
                        .select('id')
                        .eq('student_id', user.id)
                        .eq('course_id', course.id)
                        .maybeSingle();

                    if (existingEnrollment) {
                        setIsEnrolled(true);
                        router.push(`/learning/${course.id}` as any);
                        return;
                    }

                    const { error } = await supabase
                        .from('enrollments')
                        .insert([
                            {
                                student_id: user.id,
                                course_id: course.id,
                                enrolled_at: new Date().toISOString(),
                                completed_lessons: []
                            }
                        ]);

                    if (error) throw error;

                    setIsEnrolled(true);
                    setCompletedLessonIds([]);
                    setProgress(0);
                    // Open first lesson by default on fresh enroll
                    router.push(`/learning/${course.id}` as any);

                } catch (error) {
                    console.error("Enrollment failed:", error);
                    Alert.alert("Error", "Failed to enroll in course. Please try again.");
                } finally {
                    setEnrollmentLoading(false);
                }
            }
        }
    }, [course?.id, isEnrolled, user, router]);

    const handleModalEnroll = () => {
        setIsAccessDeniedVisible(false);
        handleEnroll();
    };

    if (loading || (isContentLoading && (!course?.sections || course.sections.length === 0))) return (
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
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                <View style={styles.header}>
                    <Image source={{ uri: course.image }} style={styles.headerImg} />
                    <TouchableOpacity style={styles.backButtonFloating} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.body}>
                    <Text style={styles.title}>{course.title}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.badge}><Text style={styles.badgeText}>{course.categories}</Text></View>
                        <View style={styles.rating}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.ratingText}>{course.rating.toFixed(1)} ({course.reviewCount})</Text>
                        </View>
                    </View>

                    <Text style={styles.price}>{course.price}</Text>

                    <View style={styles.statsPanel}>
                        <StatItem icon="people" label={`${course.students} Students`} />
                        <StatItem icon="play-circle-outline" label={`${course.lessonCount} Lessons`} />
                        <StatItem icon="time-outline" label={course.duration} />
                    </View>

                    <View style={styles.tabs}>
                        {['About', 'Lessons', 'Reviews'].map(t => (
                            <TouchableOpacity key={t} onPress={() => setActiveTab(t as any)} style={[styles.tab, activeTab === t && styles.activeTab]}>
                                <Text style={[styles.tabText, activeTab === t && styles.activeTabText]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.tabContent}>
                        {activeTab === 'About' && <AboutTab course={course} isLoading={isQueryLoading} />}
                        {activeTab === 'Lessons' && <LessonsTab sections={course.sections || []} isEnrolled={isEnrolled} completedIds={completedLessonIds} onLessonPress={handleEnroll} isLoading={isContentLoading} />}
                        {activeTab === 'Reviews' && <ReviewsTab course={course} isLoading={isQueryLoading} />}
                    </View>
                </View>
            </ScrollView>

            {/* Access Denied Modal */}
            <AccessDeniedModal
                visible={isAccessDeniedVisible}
                onClose={() => setIsAccessDeniedVisible(false)}
                onEnroll={handleModalEnroll}
            />

            <View style={styles.footer}>
                {isEnrolled && (
                    <View style={styles.enrollmentContainer}>
                        <Text style={styles.enrolledText}>You are enrolled!</Text>
                        <View style={styles.progressRow}>
                            <Text style={styles.progressLabel}>Progress</Text>
                            <Text style={styles.progressPercent}>{progress}%</Text>
                        </View>
                        <View style={styles.progressBackground}>
                            <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                    </View>
                )}
                <TouchableOpacity
                    style={[styles.enrollBtn, isEnrolled && styles.continueBtn]}
                    onPress={() => handleEnroll()}
                    disabled={enrollmentLoading}
                >
                    {enrollmentLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.enrollBtnText}>{isEnrolled ? "Continue Learning" : "Enroll Now"}</Text>
                    )}
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

const AboutTab = ({ course, isLoading }: { course: Course; isLoading: boolean }) => {
    const [extractedPoints, setExtractedPoints] = useState<string[]>([]);

    useEffect(() => {
        if (!course || !course.description) {
            setExtractedPoints([]);
            return;
        }

        // 1. Priority: Use database column if it exists and has data
        if (course.what_you_will_learn && Array.isArray(course.what_you_will_learn) && course.what_you_will_learn.length > 0) {
            setExtractedPoints(course.what_you_will_learn);
            return;
        }

        // 2. Fallback: Extraction from description
        let pointsArray: string[] = [];

        // Step A: HTML <li> tags check
        const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        let match;
        while ((match = liRegex.exec(course.description)) !== null) {
            const clean = stripHtmlTags(match[1]).trim();
            if (clean && clean.length > 2) pointsArray.push(clean);
        }

        // Step B: Bullet symbols fallback
        if (pointsArray.length === 0) {
            const lines = course.description.split(/[\n\r<br>]+/);
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
                    const cleanLine = stripHtmlTags(trimmedLine.replace(/^[•\-\*]\s*/, '')).trim();
                    if (cleanLine.length > 3) pointsArray.push(cleanLine);
                }
            });
        }

        setExtractedPoints(Array.from(new Set(pointsArray)));
    }, [course?.id, course?.description, course?.what_you_will_learn]);

    if (isLoading && !course?.description) {
        return (
            <View style={styles.tabCenter}>
                <ActivityIndicator size="small" color="#8A2BE2" />
            </View>
        );
    }

    return (
        <View style={{ paddingBottom: 20 }}>
            {/* 1. Mentor Section - TOP PRIORITY */}
            <Text style={styles.sectionTitle}>Mentor</Text>
            <View style={styles.mentorCard}>
                {course.instructorAvatar ? (
                    <Image source={{ uri: course.instructorAvatar }} style={styles.mentorImg} />
                ) : (
                    <View style={[styles.mentorImg, { backgroundColor: '#F3E5F5', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={[styles.initialsTextSmall, { color: '#8A2BE2' }]}>{course.instructorInitials}</Text>
                    </View>
                )}
                <View>
                    <Text style={styles.mentorName}>{course.instructor}</Text>
                    <Text style={styles.mentorRole}>Senior Instructor</Text>
                </View>
            </View>

            {/* 2. About Course Description */}
            <Text style={styles.sectionTitle}>About Course</Text>
            <Text style={styles.desc}>
                {course.description ? stripHtmlTags(course.description) : "No description available."}
            </Text>

            {/* 3. What you'll learn Section */}
            {extractedPoints.length > 0 && (
                <View style={[styles.learningSection, { marginTop: 20 }]}>
                    <Text style={styles.learningSectionTitle}>What you’ll learn</Text>
                    <View style={styles.learningGrid}>
                        {extractedPoints.map((point, index) => (
                            <View key={index} style={styles.learningPointItem}>
                                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                                <Text style={styles.learningPointText}>{point}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
};

const getPathKey = (s: number, l: number, sl?: number) => {
    return sl !== undefined ? `s-${s}-l-${l}-sl-${sl}` : `s-${s}-l-${l}`;
};

// Optimized Lesson Item Component
const LessonItem = React.memo(({
    lesson,
    sIdx,
    lIdx,
    level = 0,
    isEnrolled,
    completedIds,
    onPress
}: {
    lesson: Lesson,
    sIdx: number,
    lIdx: number,
    level?: number,
    isEnrolled: boolean,
    completedIds: string[],
    onPress: (sIdx: number, lIdx: number, slIdx?: number) => void
}) => {
    const getIcon = () => {
        if (lesson.type === 'quiz') return 'help-circle';
        if (lesson.type === 'video') return 'play-circle';
        return 'document-text';
    };

    const currentPathKey = getPathKey(sIdx, lIdx);
    const isLessonCompleted = completedIds.includes(currentPathKey);
    const trailingIcon = isEnrolled
        ? (isLessonCompleted ? "checkmark-circle" : "play-circle")
        : "lock-closed";
    const iconColor = isLessonCompleted ? "#4CAF50" : (isEnrolled ? "#8A2BE2" : "#ccc");
    const hasSub = lesson.lessons && lesson.lessons.length > 0;

    return (
        <View>
            <TouchableOpacity style={[styles.lessonRow, { paddingLeft: 15 + level * 15 }]} onPress={() => onPress(sIdx, lIdx)}>
                <View style={styles.iconCircle}>
                    <Ionicons name={getIcon()} size={16} color="#8A2BE2" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    {lesson.duration && <Text style={styles.lessonDur}>{lesson.duration}</Text>}
                </View>
                <Ionicons name={trailingIcon} size={18} color={iconColor} />
            </TouchableOpacity>

            {hasSub && lesson.lessons && lesson.lessons.map((sl, sli) => {
                const subPathKey = getPathKey(sIdx, lIdx, sli);
                const isSubCompleted = completedIds.includes(subPathKey);
                const subTrailingIcon = isEnrolled ? (isSubCompleted ? "checkmark-circle" : "play-circle") : "lock-closed";
                const subIconColor = isSubCompleted ? "#4CAF50" : (isEnrolled ? "#8A2BE2" : "#ccc");

                return (
                    <TouchableOpacity key={`${lIdx}-${sli}`} style={[styles.lessonRow, { paddingLeft: 30 + level * 15 }]} onPress={() => onPress(sIdx, lIdx, sli)}>
                        <View style={styles.iconCircle}>
                            <Ionicons name={getIcon()} size={14} color="#8A2BE2" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.lessonTitle}>{sl.title}</Text>
                            {sl.duration && <Text style={styles.lessonDur}>{sl.duration}</Text>}
                        </View>
                        <Ionicons name={subTrailingIcon} size={18} color={subIconColor} />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
});

const LessonsTab = React.memo(({ sections, isEnrolled, completedIds, onLessonPress, isLoading }: { sections: Section[]; isEnrolled: boolean; completedIds: string[]; onLessonPress: (sIdx: number, lIdx: number, slIdx?: number) => void; isLoading: boolean }) => {
    // Local state for expanded sections
    const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

    // Initialize expanded sections when sections change (expand first one)
    useEffect(() => {
        if (sections && sections.length > 0) {
            setExpandedSections(prev => ({
                ...prev,
                0: true
            }));
        }
    }, [sections]);

    const toggle = useCallback((i: number) => {
        setExpandedSections(prev => ({
            ...prev,
            [i]: !prev[i]
        }));
    }, []);

    if (isLoading && (!sections || sections.length === 0)) {
        return (
            <View style={styles.tabCenter}>
                <ActivityIndicator size="small" color="#8A2BE2" />
                <Text style={styles.loadingText}>Loading course lessons...</Text>
            </View>
        );
    }

    if (!sections || sections.length === 0) {
        return (
            <View style={{ padding: 20, alignItems: 'center' }}>
                <Ionicons name="documents-outline" size={48} color="#ccc" />
                <Text style={{ color: '#666', marginTop: 10, textAlign: 'center' }}>Lessons coming soon</Text>
            </View>
        );
    }

    return (
        <View>
            {sections.map((sec, i) => (
                <View key={i} style={styles.accContainer}>
                    <TouchableOpacity style={styles.accHeader} onPress={() => toggle(i)}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.accTitle}>{sec.title}</Text>
                            <Text style={styles.accSub}>{sec.data.length} Lessons</Text>
                        </View>
                        <Ionicons name={expandedSections[i] ? "chevron-up" : "chevron-down"} size={20} color="#333" />
                    </TouchableOpacity>
                    {expandedSections[i] && (
                        <View style={styles.accContent}>
                            {sec.data.map((l: Lesson, li: number) => (
                                <LessonItem
                                    key={li}
                                    lesson={l}
                                    sIdx={i}
                                    lIdx={li}
                                    isEnrolled={isEnrolled}
                                    completedIds={completedIds}
                                    onPress={onLessonPress}
                                />
                            ))}
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
});

const ReviewsTab = ({ course, isLoading }: { course: Course; isLoading: boolean }) => {
    const renderStars = (rating: number) => {
        return (
            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                        key={s}
                        name="star"
                        size={14}
                        color={s <= rating ? "#FFD700" : "#E0E0E0"}
                        style={{ marginRight: 2 }}
                    />
                ))}
            </View>
        );
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <View>
            <Text style={styles.tabSectionTitle}>Student Reviews</Text>
            {isLoading ? (
                <View style={styles.tabCenter}>
                    <ActivityIndicator size="small" color="#8A2BE2" />
                    <Text style={styles.loadingText}>Loading reviews...</Text>
                </View>
            ) : course.reviews.length > 0 ? course.reviews.map((r: Review, i: number) => (
                <View key={i} style={styles.reviewCard}>
                    {r.user.avatar ? (
                        <Image
                            source={{ uri: r.user.avatar }}
                            style={styles.reviewerImg}
                        />
                    ) : (
                        <View style={[styles.reviewerImg, styles.initialsContainerSmall]}>
                            <Text style={styles.initialsTextSmall}>{r.user.initials}</Text>
                        </View>
                    )}
                    <View style={{ flex: 1 }}>
                        <View style={styles.reviewHeader}>
                            <Text style={styles.reviewerName}>{r.user.name}</Text>
                            <Text style={styles.reviewDate}>{formatDate(r.created_at)}</Text>
                        </View>
                        {renderStars(r.rating)}
                        <Text style={styles.reviewMsg}>{r.content}</Text>
                    </View>
                </View>
            )) : <Text style={styles.empty}>No reviews yet</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    error: { color: 'red', marginBottom: 20 },
    backBtn: { backgroundColor: '#8A2BE2', padding: 10, borderRadius: 5 },
    header: { height: 250 },
    headerImg: { width: '100%', height: '100%' },
    backButtonFloating: {
        position: 'absolute',
        top: 40,
        left: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        padding: 8,
        zIndex: 10,
    },
    body: { padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 },
    badge: { backgroundColor: '#E0D4FC', padding: 5, borderRadius: 5 },
    badgeText: { color: '#8A2BE2', fontSize: 12, fontWeight: 'bold' },
    rating: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    ratingText: { fontSize: 12, color: '#666' },
    price: { fontSize: 20, fontWeight: 'bold', color: '#8A2BE2', marginBottom: 20 },
    statsPanel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    tabCenter: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 10, color: '#666', fontSize: 14 },
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
    accHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#F9F9F9' },
    accTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
    accSub: { fontSize: 12, color: '#666', marginTop: 2 },
    accContent: { backgroundColor: '#fff' },
    lessonRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
    iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F0FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    lessonTitle: { fontSize: 14, fontWeight: '500', color: '#444' },
    lessonDur: { fontSize: 12, color: '#999' },
    tabSectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 20, marginTop: 10 },
    reviewCard: { flexDirection: 'row', gap: 15, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 20 },
    reviewerImg: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    reviewerName: { fontSize: 15, fontWeight: '700', color: '#333' },
    reviewDate: { fontSize: 12, color: '#999', fontWeight: '400' },
    starsRow: { flexDirection: 'row', marginBottom: 8 },
    reviewMsg: { fontSize: 14, color: '#555', lineHeight: 20 },
    empty: { color: '#999', textAlign: 'center', marginTop: 20 },
    footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    enrollBtn: { backgroundColor: '#8A2BE2', padding: 16, borderRadius: 30, alignItems: 'center' },
    continueBtn: { backgroundColor: '#8A2BE2' },
    enrollBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    enrollmentContainer: { marginBottom: 15 },
    enrolledText: { color: '#2E7D32', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    progressLabel: { fontSize: 14, color: '#666', fontWeight: '500' },
    progressPercent: { fontSize: 14, color: '#333', fontWeight: 'bold' },
    progressBackground: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },
    initialsContainerSmall: {
        backgroundColor: '#E6E6FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsTextSmall: {
        color: '#8A2BE2',
        fontSize: 16,
        fontWeight: 'bold',
    },
    learningSection: {
        marginTop: 30,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    learningSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 15 },
    learningGrid: { flexDirection: 'column' },
    learningPointItem: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: 12,
        alignItems: 'flex-start'
    },
    learningPointText: {
        fontSize: 14,
        color: '#444',
        marginLeft: 10,
        flex: 1,
        lineHeight: 20
    },
});
