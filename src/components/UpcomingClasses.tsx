import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import NotificationPopup from './NotificationPopup';

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
  names: ["Dr. Evelyn Reed", "Marcus Vance", "Julia Grant", "Leo Fischer", "Chloe Sullivan", "Owen Carter", "Sophia Bennett", "Nathan Hale"],
  courseBases: ["Creative Writing Workshop", "Introduction to Astrophysics", "The Philosophy of Mind", "Mastering Digital Illustration", "Beginner's Guide to Yoga", "History of Ancient Rome", "iOS App Development", "Sustainable Living"],
  expertises: ["Published Author", "Astrophysicist", "Philosopher", "Digital Artist", "Yoga Instructor", "Historian", "iOS Developer", "Sustainability Expert"]
};

const getRealisticPicture = (index: number) => {
    const gender = index % 2 !== 0 ? 'women' : 'men';
    // Use a different range of indices to get different pictures
    return `https://randomuser.me/api/portraits/${gender}/${index + 10}.jpg`;
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

const UpcomingClasses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const coursesPerPage = 6;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);


  useEffect(() => {
    loadMoreCourses();
  }, []);

  const loadMoreCourses = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      const newCourses = allCourses.slice(0, page * coursesPerPage);
      setCourses(newCourses);
      setPage(page + 1);
      setLoading(false);
    }, 1500);
  };

  const handleNotifyMe = (course: Course) => {
    setSelectedCourse(course);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedCourse(null);
  };

  const handleConfirmNotification = () => {
    if (selectedCourse) {
      setNotificationMessage(`You will be notified when "${selectedCourse.title}" starts! A confirmation email has been sent.`);
      handleCloseModal();
    }
  };

  useEffect(() => {
    if (notificationMessage) {
      Alert.alert("Confirmation", notificationMessage, [{ text: "OK", onPress: () => setNotificationMessage(null) }]);
    }
  }, [notificationMessage]);

  const renderItem = ({ item }: { item: Course }) => (
    <View style={styles.courseItem}>
      <View>
        <Image source={{ uri: item.coach.picture }} style={styles.coachImage} />
        <View style={styles.upcomingTag}>
            <Text style={styles.tagText}>UPCOMING</Text>
        </View>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.coachName}>{item.coach.name}</Text>
        <Text style={styles.coachExpertise}>{item.coach.expertise}</Text>
        <Text style={styles.courseTitle} numberOfLines={1} ellipsizeMode='tail'>{item.title}</Text>
        <TouchableOpacity style={styles.joinButton} onPress={() => handleNotifyMe(item)}>
          <Text style={styles.joinButtonText}>Notify Me</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#007BFF" />;
  };

  return (
    <View style={{flex: 1}}>
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
    {selectedCourse && (
        <NotificationPopup
          visible={modalVisible}
          onClose={handleCloseModal}
          onNotify={handleConfirmNotification}
          courseTitle={selectedCourse.title}
        />
      )}
    </View>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  coachImage: {
    width: '100%',
    height: 140,
  },
  upcomingTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(138, 43, 226, 0.9)', // Purple color
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
    alignItems: 'center',
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
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: '#8A2BE2', // Purple color for notify button
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

export default UpcomingClasses;
