import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const WatchedCourseCard = ({ course, onPress }: { course: any; onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.learningCard} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: course.image }} style={styles.courseCardImage} />
      <View style={styles.learningContent}>
        <View style={styles.learningHeader}>
          <Text style={styles.learningTitle}>{course.title}</Text>
        </View>
        <Text style={styles.instructorName}>{course.instructor}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${(course.progress || 0) * 100}%` }]} />
        </View>
        <Text style={styles.learningTime}>{Math.round((course.progress || 0) * 100)}% complete</Text>
      </View>
      <Ionicons name="play" size={18} color="#aaa" />
    </TouchableOpacity>
  );
};

export default function AllWatchedCoursesScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const { supabase } = await import('@/src/auth/supabase');
        const { data: { user } } = await (supabase as any).auth.getUser();

        if (user) {
          const { data, error } = await (supabase as any)
            .from('enrollments')
            .select(`
              completed_lessons,
              course:courses(
                id,
                title,
                image_url,
                course_content,
                instructor:profiles(first_name, last_name)
              )
            `)
            .eq('student_id', user.id);

          if (!error && data) {
            const mapped = data.map((e: any) => {
              const c = e.course;
              const instructorName = c.instructor
                ? `${c.instructor.first_name || ''} ${c.instructor.last_name || ''}`.trim()
                : 'Unknown Instructor';

              // Calculate progress
              let lessonCount = 0;
              if (c.course_content) {
                try {
                  const content = typeof c.course_content === 'string' ? JSON.parse(c.course_content) : c.course_content;
                  let rawSections = [];
                  if (Array.isArray(content)) {
                    rawSections = content;
                  } else if (content && typeof content === 'object') {
                    rawSections = content.sections || content.data || Object.values(content).filter(v => Array.isArray(v));
                  }

                  if (Array.isArray(rawSections)) {
                    rawSections.forEach((section: any) => {
                      const lessons = section.lessons || section.data || section.items || (Array.isArray(section) ? section : []);
                      lessonCount += Array.isArray(lessons) ? lessons.length : 0;
                    });
                  }
                } catch (e) { console.error('Error parsing course content', e); }
              }

              const completedCount = Array.isArray(e.completed_lessons)
                ? e.completed_lessons.length
                : (typeof e.completed_lessons === 'number' ? e.completed_lessons : 0);
              const progressPercentage = lessonCount > 0 ? (completedCount / lessonCount) : 0;

              return {
                id: c.id,
                title: c.title,
                instructor: instructorName,
                image: c.image_url || 'https://via.placeholder.com/150',
                progress: progressPercentage
              };
            });
            setCourses(mapped);
          }
        }
      } catch (err) {
        console.error('Error fetching enrollments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>All Watched Courses</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <Text style={styles.loadingText}>Loading your courses...</Text>
        </View>
      ) : courses.length > 0 ? (
        <FlatList
          data={courses}
          renderItem={({ item }) => (
            <WatchedCourseCard
              course={item}
              onPress={() => router.push(`/learning/${item.id}` as any)}
            />
          )}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.center}>
          <Ionicons name="school-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No watched courses yet</Text>
          <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/myCourses')}>
            <Text style={styles.exploreButtonText}>Explore Courses</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  exploreButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 45,
    paddingBottom: 20,
    backgroundColor: '#8A2BE2',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 24
  },
  headerIcon: {
    padding: 5,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  learningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12, // Balanced padding
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  courseCardImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#8A2BE2',
  },
  learningContent: {
    flex: 1,
    marginLeft: 15,
    marginRight: 15,
  },
  learningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  learningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  instructorName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginBottom: 6,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#8A2BE2', // Purple Fill
  },
  learningTime: {
    fontSize: 10,
    color: '#888',
  },
});
