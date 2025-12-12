import { useCoursesContext } from '@/src/context/CoursesContext';
import { Course } from '@/src/data/courses';
import { Ionicons } from '@expo/vector-icons';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function CourseDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'About' | 'Lessons' | 'Reviews'>('About');

    const { courses } = useCoursesContext();
    const course = courses.find(c => c.id === id);

    if (!course) {
        return (
            <View style={styles.container}>
                <Text>Course not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: course.title,
                    headerStyle: { backgroundColor: '#8A2BE2' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Header Image & Back Button */}
                <View style={styles.header}>
                    <Image source={{ uri: course.image }} style={styles.headerImage} />
                    <View style={styles.playButtonContainer}>
                        <View style={styles.playButton}>
                            <Ionicons name="play" size={30} color="#8A2BE2" />
                        </View>
                    </View>
                </View>

                {/* Content Body */}
                <View style={styles.body}>
                    {/* Title & Stats */}
                    <Text style={styles.title}>{course.title}</Text>
                    <View style={styles.tagRow}>
                        <View style={styles.categoryTag}>
                            <Text style={styles.categoryText}>{course.category === 'Skills Courses' ? '3D Design' : 'Development'}</Text>
                        </View>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.ratingText}>{course.rating} (4,479 reviews)</Text>
                        </View>
                    </View>

                    <Text style={styles.price}>{course.isFree ? 'Free' : '$99.99'}</Text>

                    <View style={styles.courseStats}>
                        <View style={styles.statItem}>
                            <Ionicons name="people" size={18} color="#8A2BE2" />
                            <Text style={styles.statText}>{course.students || '1,000'} Students</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="time-outline" size={18} color="#8A2BE2" />
                            <Text style={styles.statText}>{course.duration || '2h 30m'} Hours</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="document-text-outline" size={18} color="#8A2BE2" />
                            <Text style={styles.statText}>Certificate</Text>
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        {['About', 'Lessons', 'Reviews'].map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab as any)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Dynamic Content */}
                    <View style={styles.tabContent}>
                        {activeTab === 'About' && <AboutTab course={course} />}
                        {activeTab === 'Lessons' && <LessonsTab course={course} />}
                        {activeTab === 'Reviews' && <ReviewsTab course={course} />}
                    </View>

                </View>
            </ScrollView>

            {/* Footer Enroll Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.enrollButton}>
                    <Text style={styles.enrollButtonText}>Enroll Course - {course.isFree ? 'Free' : '$99.99'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Sub-components for Tabs

const AboutTab = ({ course }: { course: Course }) => (
    <View>
        <Text style={styles.sectionTitle}>Mentor</Text>
        <View style={styles.instructorCard}>
            <Image source={{ uri: course.instructorAvatar || 'https://via.placeholder.com/50' }} style={styles.instructorImage} />
            <View>
                <Text style={styles.instructorName}>{course.instructor}</Text>
                <Text style={styles.instructorRole}>Senior Instructor</Text>
            </View>
            <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color="#8A2BE2" />
            </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>About Course</Text>
        <Text style={styles.descriptionText}>
            {course.description || 'No description available.'}
        </Text>

        <Text style={styles.sectionTitle}>Tools</Text>
        <View style={styles.toolsContainer}>
            {course.tools?.length ? course.tools.map((tool, idx) => (
                <View key={idx} style={styles.toolItem}>
                    <Image source={{ uri: tool.icon }} style={styles.toolIcon} />
                    <Text style={styles.toolName}>{tool.name}</Text>
                </View>
            )) : <Text style={styles.emptyText}>No tools listed</Text>}
        </View>
    </View>
);

const LessonsTab = ({ course }: { course: Course }) => (
    <View>
        <View style={styles.lessonsHeader}>
            <Text style={styles.lessonsCount}>{course.lessons?.length || 0} Lessons</Text>
            <Text style={styles.seeAllText}>See All</Text>
        </View>

        <Text style={styles.sectionSubtitle}>Section 1 - Introduction</Text>

        {course.lessons?.map((lesson, index) => (
            <View key={lesson.id} style={styles.lessonItem}>
                <View style={styles.lessonNumber}>
                    <Text style={styles.lessonNumberText}>{index + 1 < 10 ? `0${index + 1}` : index + 1}</Text>
                </View>
                <View style={styles.lessonInfo}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                </View>
                <View style={styles.lessonStatus}>
                    {lesson.isLocked ? (
                        <Ionicons name="lock-closed-outline" size={20} color="#999" />
                    ) : (
                        <Ionicons name="play-circle" size={24} color="#8A2BE2" />
                    )}
                </View>
            </View>
        ))}
    </View>
);

const ReviewsTab = ({ course }: { course: Course }) => (
    <View>
        <View style={styles.reviewSummary}>
            <View style={styles.ratingBig}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.ratingBigText}>{course.rating} (4,479 reviews)</Text>
            </View>
            <Link href={{ pathname: "/allReviews", params: { courseId: course.id } }} asChild>
                <TouchableOpacity>
                    <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
            </Link>
        </View>

        {course.reviews?.length ? course.reviews.map(review => (
            <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                    <Image source={{ uri: review.avatar }} style={styles.reviewerAvatar} />
                    <View style={styles.reviewerInfo}>
                        <Text style={styles.reviewerName}>{review.user}</Text>
                        <View style={styles.reviewRatingRow}>
                            <Ionicons name="star" size={12} color="#8A2BE2" />
                            <Text style={styles.reviewRatingVal}>{review.rating}</Text>
                            <Text style={styles.reviewDate}>{review.date}</Text>
                        </View>
                    </View>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
                </View>
                <Text style={styles.reviewMessage}>{review.message}</Text>
                <View style={styles.reviewActions}>
                    <Ionicons name="heart-outline" size={16} color="#999" />
                    <Text style={styles.likesCount}>342</Text>
                    <Text style={styles.replyText}>7 weeks ago</Text>
                </View>
            </View>
        )) : <Text style={styles.emptyText}>No reviews yet.</Text>}
    </View>
);


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingBottom: 100, // Space for footer
    },
    header: {
        height: 250,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    playButtonContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        width: 60, height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    body: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 10,
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 10,
    },
    categoryTag: {
        backgroundColor: '#E0D4FC',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    categoryText: {
        color: '#8A2BE2',
        fontSize: 12,
        fontWeight: 'bold',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    ratingText: {
        fontSize: 12,
        color: '#666',
        fontWeight: 'bold',
    },
    price: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#8A2BE2',
        marginBottom: 20,
    },
    courseStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    statText: {
        fontSize: 12,
        color: '#666',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginBottom: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        paddingBottom: 10,
        flex: 1,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: '#8A2BE2',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#8A2BE2',
    },
    tabContent: {
        minHeight: 200,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        marginTop: 10,
        color: '#000',
    },
    instructorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 20,
    },
    instructorImage: {
        width: 50, height: 50, borderRadius: 25,
    },
    instructorName: {
        fontSize: 16, fontWeight: 'bold', color: '#000',
    },
    instructorRole: {
        fontSize: 12, color: '#666',
    },
    iconButton: {
        marginLeft: 'auto',
    },
    descriptionText: {
        fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 20,
    },
    toolsContainer: {
        flexDirection: 'row', gap: 15, flexWrap: 'wrap',
    },
    toolItem: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
    },
    toolIcon: {
        width: 24, height: 24, resizeMode: 'contain',
    },
    toolName: {
        fontSize: 14, color: '#666', fontWeight: '500',
    },
    emptyText: {
        color: '#999', fontStyle: 'italic',
    },

    // Lessons
    lessonsHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15,
    },
    lessonsCount: {
        fontSize: 18, fontWeight: 'bold', color: '#000',
    },
    seeAllText: {
        color: '#8A2BE2', fontWeight: 'bold', fontSize: 14,
    },
    sectionSubtitle: {
        fontSize: 14, color: '#999', marginBottom: 15,
    },
    lessonItem: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9',
    },
    lessonNumber: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4F0FF', justifyContent: 'center', alignItems: 'center', marginRight: 15,
    },
    lessonNumberText: {
        color: '#8A2BE2', fontWeight: 'bold',
    },
    lessonInfo: {
        flex: 1,
    },
    lessonTitle: {
        fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 4,
    },
    lessonDuration: {
        fontSize: 12, color: '#999',
    },
    lessonStatus: {
        padding: 10,
    },

    // Footer
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingBottom: 30,
    },
    enrollButton: {
        backgroundColor: '#8A2BE2',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    enrollButtonText: {
        color: '#fff', fontSize: 18, fontWeight: 'bold',
    },

    // Reviews
    reviewSummary: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
    },
    ratingBig: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
    },
    ratingBigText: {
        fontSize: 16, fontWeight: 'bold',
    },
    reviewItem: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 20,
    },
    reviewHeader: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 10,
    },
    reviewerAvatar: {
        width: 40, height: 40, borderRadius: 20,
    },
    reviewerInfo: {
        flex: 1,
    },
    reviewerName: {
        fontSize: 14, fontWeight: 'bold', color: '#000',
    },
    reviewRatingRow: {
        flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2,
    },
    reviewRatingVal: {
        fontSize: 12, fontWeight: 'bold', color: '#8A2BE2',
    },
    reviewDate: {
        fontSize: 12, color: '#999',
    },
    reviewMessage: {
        fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 10,
    },
    reviewActions: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
    },
    likesCount: {
        fontSize: 12, color: '#666', marginRight: 15,
    },
    replyText: {
        fontSize: 12, color: '#999',
    },
});
