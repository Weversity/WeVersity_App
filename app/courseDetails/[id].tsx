import { supabase } from '@/src/auth/supabase';
import { courseService } from '@/src/services/courseService';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

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

interface Review {
    id: any;
    rating: number;
    content: string;
    created_at: string;
    user: {
        name: string;
        avatar: string;
        initials: string;
    };
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
    instructorInitials?: string;
    rating: number;
    reviews: Review[];
    reviewCount: number;
    students: number;
    lessonCount: number;
    duration: string;
    tools?: any[];
    course_content?: any;
    what_you_will_learn?: string[] | null;
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
    const params = useLocalSearchParams();
    const { id, title, thumbnail, instructor, categories, price, rating, reviewCount } = params;
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'About' | 'Lessons' | 'Reviews'>('About');

    // Use params as initial course state for instant rendering
    const [course, setCourse] = useState<MappedCourse | null>(() => {
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

    const [loading, setLoading] = useState(!course); // Only show initial loading if no metadata
    const [error, setError] = useState<string | null>(null);

    // Enrollment and Progress States
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [progress, setProgress] = useState(0);
    const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
    const [enrollmentLoading, setEnrollmentLoading] = useState(false);

    // 1. Fetch Metadata (Fast)
    const { data: fullCourseData, isLoading: isQueryLoading, error: queryError } = useQuery({
        queryKey: ['course', id],
        queryFn: () => courseService.fetchCourseById(Number(id)),
        enabled: !!id,
    });

    // 2. Fetch Content (Heavy - Separate Request) - MATCHING LEARNING SCREEN LOGIC
    const { data: contentData, isLoading: isContentLoading, error: contentError } = useQuery({
        queryKey: ['courseContent', id],
        queryFn: () => courseService.fetchCourseContent(Number(id)),
        enabled: !!id,
    });

    useEffect(() => {
        const processData = async () => {
            // We need at least one source of data: either fresh full data, fresh content, or existing state
            if (!fullCourseData && !contentData && !course) return;

            try {
                // 1. DETERMINE CONTENT SOURCE
                let contentToProcess = contentData;
                if (!contentToProcess && fullCourseData) {
                    contentToProcess = (fullCourseData as any).course_content;
                }

                if (typeof contentToProcess === 'string') {
                    try {
                        contentToProcess = JSON.parse(contentToProcess);
                    } catch (e) {
                        console.warn("Could not parse course_content string", e);
                    }
                }

                let transformedSections: Section[] = course?.sections || [];
                let lessonCount = course?.lessonCount || 0;
                let durationStr = course?.duration || '...';

                if (contentToProcess) {
                    transformedSections = processCourseContent(contentToProcess);
                    let totalL = 0;
                    let totalMin = 0;
                    const traverseStats = (lessons: Lesson[]) => {
                        lessons.forEach(l => {
                            totalL++;
                            if (l.duration) {
                                const dStr = String(l.duration).toLowerCase();
                                let mins = 0;
                                const hMatch = dStr.match(/(\d+)\s*h/);
                                const mMatch = dStr.match(/(\d+)\s*m/);
                                const bareMatch = dStr.match(/^(\d+)(\s*mins?)?$/);
                                if (hMatch) mins += parseInt(hMatch[1]) * 60;
                                if (mMatch) mins += parseInt(mMatch[1]);
                                if (bareMatch && !hMatch && !mMatch) mins += parseInt(bareMatch[1]);
                                totalMin += mins;
                            }
                            if (l.lessons && Array.isArray(l.lessons)) traverseStats(l.lessons);
                        });
                    };
                    transformedSections.forEach(s => traverseStats(s.data));
                    lessonCount = totalL;

                    if (totalMin > 0) {
                        const h = Math.floor(totalMin / 60);
                        const m = totalMin % 60;
                        durationStr = h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m}m`;
                    } else if (lessonCount > 0) {
                        const estMin = lessonCount * 5;
                        const h = Math.floor(estMin / 60);
                        const m = estMin % 60;
                        durationStr = h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''} (Est.)`.trim() : `${m}m (Est.)`;
                    }
                }

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

                if (fullCourseData) {
                    const data = fullCourseData;
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
                            const sum = reviewsRaw!.reduce((acc, r: any) => acc + (r.rating || 0), 0);
                            calculatedAvgRating = sum / reviewsCount;

                            const studentIds = Array.from(new Set(reviewsRaw!.map((r: any) => r.student_id).filter(Boolean)));
                            let profileMap: Record<string, any> = {};

                            if (studentIds.length > 0) {
                                const { data: profilesData } = await supabase
                                    .from('profiles')
                                    .select('id, first_name, last_name, avatar_url')
                                    .in('id', studentIds);

                                profilesData?.forEach(p => {
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

                    return {
                        ...base,
                        description: currentDescription,
                        sections: transformedSections,
                        instructor: instructorName,
                        instructorAvatar,
                        instructorInitials,
                        rating: calculatedAvgRating,
                        reviews: mappedReviews,
                        reviewCount: reviewsCount,
                        students: finalStudentCount,
                        lessonCount,
                        duration: durationStr,
                        tools,
                        categories: categoryDisplay,
                        price: priceDisplay,
                        course_content: contentToProcess,
                        what_you_will_learn: whatWillILearn
                    };
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
    }, [fullCourseData, contentData]);

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
    }, [course, completedLessonIds]);

    const handleEnroll = async () => {
        if (!course?.id) return;
        if (isEnrolled) {
            router.push(`/learning/${course.id}` as any);
            return;
        }

        try {
            setEnrollmentLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Insert enrollment record
                const { error: insertError } = await supabase
                    .from('enrollments')
                    .insert([
                        {
                            student_id: user.id,
                            course_id: course.id,
                            status: 'active',
                            completed_lessons: []
                        }
                    ]);

                if (insertError) {
                    // Check if already enrolled to avoid duplicates causing error
                    if (insertError.code === '23505') { // Unique constraint violation
                        setIsEnrolled(true);
                        router.push(`/learning/${course.id}` as any);
                    } else {
                        Alert.alert("Enrollment Failed", "Could not enroll in this course. Please try again.");
                    }
                } else {
                    setIsEnrolled(true);
                    setCompletedLessonIds([]);
                    setProgress(0);
                    router.push(`/learning/${course.id}` as any);
                }

            } else {
                Alert.alert(
                    "Login Required",
                    "Please login to enroll and start learning this course.",
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Login", onPress: () => router.push('/profile' as any) }
                    ]
                );
            }
        } catch (err) {
            console.error("Enrollment error:", err);
            Alert.alert("Error", "An unexpected error occurred.");
        } finally {
            setEnrollmentLoading(false);
        }
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
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                <View style={styles.header}>
                    <Image source={{ uri: course.image }} style={styles.headerImg} />
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
                        {activeTab === 'Lessons' && <LessonsTab sections={course.sections} isEnrolled={isEnrolled} completedIds={completedLessonIds} onLessonPress={handleEnroll} isLoading={isContentLoading} />}
                        {activeTab === 'Reviews' && <ReviewsTab course={course} isLoading={isQueryLoading} />}
                    </View>
                </View>
            </ScrollView>

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
                    onPress={handleEnroll}
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

const AboutTab = ({ course, isLoading }: { course: MappedCourse; isLoading: boolean }) => {
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

const LessonsTab = ({ sections, isEnrolled, completedIds, onLessonPress, isLoading }: { sections: Section[], isEnrolled: boolean, completedIds: string[], onLessonPress: () => void, isLoading: boolean }) => {
    const [localSections, setLocalSections] = useState(sections);

    useEffect(() => {
        setLocalSections(sections);
    }, [sections]);

    if (isLoading) {
        return (
            <View style={styles.tabCenter}>
                <ActivityIndicator size="small" color="#8A2BE2" />
                <Text style={styles.loadingText}>Loading course lessons...</Text>
            </View>
        );
    }

    if (!localSections || localSections.length === 0) {
        return (
            <View style={{ padding: 20, alignItems: 'center' }}>
                <Ionicons name="documents-outline" size={48} color="#ccc" />
                <Text style={{ color: '#666', marginTop: 10, textAlign: 'center' }}>No lessons available for this course yet.</Text>
            </View>
        );
    }

    const toggle = (i: number) => {
        const newSections = [...localSections];
        newSections[i].isExpanded = !newSections[i].isExpanded;
        setLocalSections(newSections);
    };

    const renderLessons = (lessons: Lesson[], sectionIndex: number, level = 0) => {
        return lessons.map((l, li) => {
            const getIcon = () => {
                if (l.type === 'quiz') return 'help-circle';
                if (l.type === 'video') return 'play-circle';
                return 'document-text';
            };

            const currentPathKey = getPathKey(sectionIndex, li);
            const isLessonCompleted = completedIds.includes(currentPathKey);
            const trailingIcon = isEnrolled
                ? (isLessonCompleted ? "checkmark-circle" : "play-circle")
                : "lock-closed";
            const iconColor = isLessonCompleted ? "#4CAF50" : (isEnrolled ? "#8A2BE2" : "#ccc");

            const hasSub = l.lessons && l.lessons.length > 0;

            return (
                <View key={li}>
                    <TouchableOpacity style={[styles.lessonRow, { paddingLeft: 15 + level * 15 }]} onPress={onLessonPress}>
                        <View style={styles.iconCircle}>
                            <Ionicons name={getIcon()} size={16} color="#8A2BE2" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.lessonTitle}>{l.title}</Text>
                            {l.duration && <Text style={styles.lessonDur}>{l.duration}</Text>}
                        </View>
                        <Ionicons name={trailingIcon} size={18} color={iconColor} />
                    </TouchableOpacity>
                    {hasSub && l.lessons && l.lessons.map((sl, sli) => {
                        const subPathKey = getPathKey(sectionIndex, li, sli);
                        const isSubCompleted = completedIds.includes(subPathKey);
                        const subTrailingIcon = isEnrolled ? (isSubCompleted ? "checkmark-circle" : "play-circle") : "lock-closed";
                        const subIconColor = isSubCompleted ? "#4CAF50" : (isEnrolled ? "#8A2BE2" : "#ccc");

                        return (
                            <TouchableOpacity key={`${li}-${sli}`} style={[styles.lessonRow, { paddingLeft: 30 + level * 15 }]} onPress={onLessonPress}>
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
    };

    return (
        <View>
            {localSections.map((sec, i) => (
                <View key={i} style={styles.accContainer}>
                    <TouchableOpacity style={styles.accHeader} onPress={() => toggle(i)}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.accTitle}>{sec.title}</Text>
                            <Text style={styles.accSub}>{sec.data.length} Lessons</Text>
                        </View>
                        <Ionicons name={sec.isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#333" />
                    </TouchableOpacity>
                    {sec.isExpanded && (
                        <View style={styles.accContent}>
                            {renderLessons(sec.data, i)}
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
};

const ReviewsTab = ({ course, isLoading }: { course: MappedCourse; isLoading: boolean }) => {
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
            ) : course.reviews.length > 0 ? course.reviews.map((r, i) => (
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
