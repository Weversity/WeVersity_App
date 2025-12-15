import { Course, INITIAL_COURSES } from '@/src/data/courses';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const ProgressBar = ({ progress }: { progress: string }) => {
    const progressVal = parseInt(progress.replace('%', ''));
    return (
        <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progressVal}%`, backgroundColor: '#4CD964' }]} />
        </View>
    )
};

const WatchedCourseCard = ({ course, onPress }: { course: Course; onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.learningCard} onPress={onPress} activeOpacity={0.9}>
        <Image source={{ uri: course.image }} style={styles.courseCardImage} />
        <View style={styles.learningContent}>
            <View style={styles.learningHeader}>
            <Text style={styles.learningTitle}>{course.title}</Text>
            <Ionicons name="play" size={16} color="#aaa" />
            </View>
            <Text style={styles.instructorName}>{course.instructor}</Text>
            <ProgressBar progress={course.progress} />
            <Text style={styles.learningTime}>{course.progress} complete</Text>
        </View>
    </TouchableOpacity>
  );
};

export default function AllWatchedCoursesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>All Watched Courses</Text>
        <View style={styles.headerRight}>
        </View>
      </View>

      <FlatList
        data={INITIAL_COURSES}
        renderItem={({ item }) => (
          <WatchedCourseCard
            course={item}
            onPress={() => router.push(`/courseDetails/${item.id}` as any)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
        padding: 12,
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
      },
      learningHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      },
      learningTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
      },
      instructorName: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
      },
      progressBarContainer: {
        height: 4,
        backgroundColor: '#f0f0f0',
        borderRadius: 2,
        marginBottom: 6,
        width: '80%', // Not full width to leave space
      },
      progressBar: {
        height: '100%',
        borderRadius: 2,
      },
      learningTime: {
        fontSize: 10,
        color: '#888',
      },
});
