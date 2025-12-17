import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface UploadedCourse {
    id: string;
    title: string;
    category: string;
    status: 'PUBLISHED' | 'DRAFT';
    image: string;
}

// Mock Data
const MOCK_UPLOADED_COURSES: UploadedCourse[] = [
    {
        id: '1',
        title: 'Advanced React Patterns',
        category: 'Development',
        status: 'PUBLISHED',
        image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop',
    },
    {
        id: '2',
        title: 'Next.js 14 Fundamentals',
        category: 'Development',
        status: 'DRAFT',
        image: 'https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?q=80&w=2664&auto=format&fit=crop',
    },
    {
        id: '3',
        title: 'Mastering Figma Variables',
        category: 'Design',
        status: 'PUBLISHED',
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop',
    },
    {
        id: '4',
        title: 'Modern UI Design Principles',
        category: 'Design',
        status: 'DRAFT',
        image: 'https://images.unsplash.com/photo-1586717791821-3f44a5638d48?q=80&w=2670&auto=format&fit=crop',
    },
];

export default function MyUploadedCoursesScreen() {
    const router = useRouter();
    const [courses, setCourses] = useState<UploadedCourse[]>(MOCK_UPLOADED_COURSES);

    const handleEditCourse = (id: string) => {
        // Navigate to edit course page (placeholder)
        console.log('Edit course:', id);
    };

    const renderCourseItem = ({ item }: { item: UploadedCourse }) => (
        <View style={styles.courseCard}>
            <Image source={{ uri: item.image }} style={styles.courseImage} />
            <View style={styles.courseContent}>
                <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.courseCategory}>{item.category}</Text>
                <View style={[styles.statusBadge, item.status === 'PUBLISHED' ? styles.statusPublished : styles.statusDraft]}>
                    <Text style={[styles.statusText, item.status === 'PUBLISHED' ? styles.statusTextPublished : styles.statusTextDraft]}>
                        {item.status}
                    </Text>
                </View>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => handleEditCourse(item.id)}>
                <Ionicons name="pencil-outline" size={20} color="#666" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" />

            {/* Custom Header Matching Upcoming Screen */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Your Uploaded Courses</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={courses}
                keyExtractor={(item) => item.id}
                renderItem={renderCourseItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No courses uploaded yet.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 5 : 45,
        paddingBottom: 20, /* Adjusted padding */
        paddingHorizontal: 20,
        backgroundColor: '#8A2BE2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    backButton: {
        padding: 5,
    },
    listContent: {
        padding: 20,
    },
    courseCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        alignItems: 'center',
    },
    courseImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
    },
    courseContent: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    courseTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    courseCategory: {
        fontSize: 12,
        color: '#888',
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusPublished: {
        backgroundColor: '#E8F5E9',
    },
    statusDraft: {
        backgroundColor: '#F5F5F5',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    statusTextPublished: {
        color: '#4CAF50',
    },
    statusTextDraft: {
        color: '#757575',
    },
    editButton: {
        padding: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});
