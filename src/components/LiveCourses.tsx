import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

interface Course {
  id: string;
  title: string;
  coach: {
    name: string;
    expertise: string;
    picture: string;
  };
}

const mockData = {
  names: ["John Doe", "Sarah Smith", "Victoria Chen", "Mike Johnson", "Emily White", "David Lee", "Jessica Brown", "Chris Green"],
  courseBases: ["Web Development", "Mobile UI/UX Design", "Advanced JavaScript", "Public Speaking Mastery", "Data Science with Python", "Digital Marketing", "The Art of Photography", "Financial Planning"],
  expertises: ["Full-Stack Developer", "Design Lead", "JavaScript Engineer", "Communication Coach", "Data Scientist", "Marketing Guru", "Pro Photographer", "Finance Expert"]
};

const getRealisticPicture = (index: number) => {
    // Alternate between men and women portraits
    const gender = index % 2 === 0 ? 'women' : 'men';
    return `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;
}

const allCourses: Course[] = Array.from({ length: 30 }, (_, i) => ({
  id: `_` + (i + 1),
  title: `${mockData.courseBases[i % mockData.courseBases.length]}`,
  coach: {
    name: `${mockData.names[i % mockData.names.length]}`,
    expertise: `${mockData.expertises[i % mockData.expertises.length]}`,
    picture: getRealisticPicture(i),
  }
}));

const LiveCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const coursesPerPage = 6;

  useEffect(() => {
    loadMoreCourses();
  }, []);

  const loadMoreCourses = () => {
    if (loading) {
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const newCourses = allCourses.slice(0, page * coursesPerPage);
      setCourses(newCourses);
      setPage(page + 1);
      setLoading(false);
    }, 1500);
  };

  const renderItem = ({ item }: { item: Course }) => {
    console.log(`Rendering course with ID: ${item.id}`);
    return (
      <View style={styles.courseItem}>
        <View>
          <Image source={{ uri: item.coach.picture }} style={styles.coachImage} />
          <View style={styles.liveTag}>
              <Text style={styles.tagText}>LIVE</Text>
          </View>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.coachName}>{item.coach.name}</Text>
          <Text style={styles.coachExpertise}>{item.coach.expertise}</Text>
          <Text style={styles.courseTitle} numberOfLines={1} ellipsizeMode='tail'>{item.title}</Text>
          <Link href={`/live/${item.id}`} asChild>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Now</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#8A2BE2" />;
  };

  return (
    <FlatList
      data={courses}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      onEndReached={loadMoreCourses}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.container}
      numColumns={2}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 5,
    paddingTop: 10,
  },
  courseItem: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    flex: 1,
    margin: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden', // Ensures the image respects the border radius
  },
  coachImage: {
    width: '100%',
    height: 140, // Increased height for better look
  },
  liveTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.9)', // Red color
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  tagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: 12,
    alignItems: 'center', // Center-aligns all children
  },
  coachName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  coachExpertise: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 12,
    textAlign: 'center', // Explicitly center for good measure
  },
  joinButton: {
    backgroundColor: '#8A2BE2', // Purple color
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LiveCourses;
