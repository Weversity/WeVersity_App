import React from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EnrolledCourse {
  id: string;
  courseImage: string;
  enrolledDate: string;
  lessons: number;
  rating: number;
  title: string;
  instructor: {
    name: string;
    picture: string;
  };
  progress: number; // Percentage from 0 to 100
}

const enrolledCoursesData: EnrolledCourse[] = [
  {
    id: '1',
    courseImage: 'https://picsum.photos/seed/c1/700/400',
    enrolledDate: 'Dec 3, 2025',
    lessons: 24,
    rating: 4.8,
    title: 'Advanced React Native',
    instructor: {
      name: 'John Doe',
      picture: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    progress: 60,
  },
  {
    id: '2',
    courseImage: 'https://picsum.photos/seed/c2/700/400',
    enrolledDate: 'Nov 15, 2025',
    lessons: 18,
    rating: 4.5,
    title: 'Data Science with Python',
    instructor: {
      name: 'Sarah Smith',
      picture: 'https://randomuser.me/api/portraits/women/2.jpg',
    },
    progress: 25,
  },
    {
    id: '3',
    courseImage: 'https://picsum.photos/seed/c3/700/400',
    enrolledDate: 'Oct 1, 2025',
    lessons: 32,
    rating: 4.9,
    title: 'The Art of Public Speaking',
    instructor: {
      name: 'Victoria Chen',
      picture: 'https://randomuser.me/api/portraits/women/3.jpg',
    },
    progress: 90,
  },
];

const ProgressBar = ({ progress }: { progress: number }) => (
  <View>
    <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
    </View>
    <Text style={styles.progressText}>{progress}% Completed</Text>
  </View>
);

const EnrolledCoursesList: React.FC = () => {
  const renderItem = ({ item }: { item: EnrolledCourse }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.courseImage }} style={styles.courseImage} />
      
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>Enrolled: {item.enrolledDate}</Text>
        <View style={styles.lessonsAndRating}>
            <Text style={styles.infoText}>{item.lessons} Lessons</Text>
            <Text style={styles.infoText}><Ionicons name="star" color="#FFD700" /> {item.rating}</Text>
        </View>
      </View>
      
      <Text style={styles.courseTitle}>{item.title}</Text>
      
      <View style={styles.instructorRow}>
        <Image source={{ uri: item.instructor.picture }} style={styles.instructorImage} />
        <Text style={styles.instructorName}>{item.instructor.name}</Text>
      </View>
      
      <ProgressBar progress={item.progress} />
      
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Start Learning</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={enrolledCoursesData}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  courseImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  lessonsAndRating: {
    flexDirection: 'row',
    gap: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  instructorImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  instructorName: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    height: 8,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8A2BE2',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#8A2BE2',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EnrolledCoursesList;
