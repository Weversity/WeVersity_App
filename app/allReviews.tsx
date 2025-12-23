import { FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  PanResponder,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { useCoursesContext } from '../src/context/CoursesContext';

const { width, height } = Dimensions.get('window');

// Review interface matching Course type definition
interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  date: string;
  message: string;
}

// StarRatingProps interface
interface StarRatingProps {
  rating: number;
  setRating: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, setRating }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.starContainer}>
      {stars.map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)}>
          <FontAwesome
            name={rating >= star ? 'star' : 'star-o'}
            size={30}
            color="#8A2BE2"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const AllReviewsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { courseId } = params;

  const { courses, addReview } = useCoursesContext();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    typeof courseId === 'string' ? courseId : null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [courseForReview, setCourseForReview] = useState<string | null>(
    selectedCourseId
  );

  const panY = useRef(new Animated.Value(height)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          closeModal();
        } else {
          resetModalPosition();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (courseId && typeof courseId === 'string') {
      setSelectedCourseId(courseId);
      setCourseForReview(courseId);
    }
  }, [courseId]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const openModal = () => {
    setModalVisible(true);
    Animated.timing(panY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(panY, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      panY.setValue(height);
    });
  };

  const resetModalPosition = () => {
    Animated.spring(panY, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const handleAddReview = () => {
    if (!courseForReview || !newReviewText || newReviewRating === 0) {
      Alert.alert(
        'Incomplete Information',
        'Please select a course, write a review, and provide a rating.'
      );
      return;
    }

    const course = courses.find(c => c.id === courseForReview);
    const newReview: Review = {
      id: `${courseForReview}-review-${(course?.reviews || []).length + 1}`,
      user: 'Anonymous', // In a real app, you'd get the current user
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
      rating: newReviewRating,
      message: newReviewText,
      date: new Date().toISOString().split('T')[0],
    };

    addReview(courseForReview, newReview);
    closeModal();
    setNewReviewText('');
    setNewReviewRating(0);
    Alert.alert('Success', 'Your review has been submitted!');
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {courses.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={[
              styles.tabItem,
              selectedCourseId === course.id && styles.selectedTabItem,
            ]}
            onPress={() => setSelectedCourseId(course.id)}
          >
            <Text
              style={[
                styles.tabText,
                selectedCourseId === course.id && styles.selectedTabText,
              ]}
            >
              {course.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewAuthor}>{item.user}</Text>
        <View style={styles.reviewRating}>
          {[...Array(5)].map((_, i) => (
            <FontAwesome
              key={i}
              name="star"
              size={16}
              color={i < item.rating ? "#8A2BE2" : Colors.mediumGray}
            />
          ))}
        </View>
      </View>
      <Text style={styles.reviewText}>{item.message}</Text>
      <Text style={styles.reviewDate}>{item.date}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Courses Reviews</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.feedbackSection}>
        <Text style={styles.feedbackTitle}>Students Feedback</Text>
      </View>

      {renderTabBar()}

      <FlatList
        data={selectedCourse?.reviews || []}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.noReviewsText}>
              No reviews for this course yet. Be the first to write one!
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.addButton} onPress={openModal}>
        <Text style={styles.addButtonText}>Add Your Review</Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: panY }] },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.modalContent}>
            <View style={styles.handleBar} />
            <Text style={styles.modalTitle}>Add a Review</Text>

            <Picker
              selectedValue={courseForReview}
              onValueChange={(itemValue) => setCourseForReview(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {courses.map((course) => (
                <Picker.Item
                  key={course.id}
                  label={course.title}
                  value={course.id}
                />
              ))}
            </Picker>

            <TextInput
              style={styles.input}
              placeholder="Write your review..."
              placeholderTextColor={Colors.darkGray}
              value={newReviewText}
              onChangeText={setNewReviewText}
              multiline
            />

            <StarRating rating={newReviewRating} setRating={setNewReviewRating} />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddReview}
            >
              <Text style={styles.submitButtonText}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20,
    paddingBottom: 15,
    backgroundColor: '#8A2BE2',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  backButton: {
    padding: 5,
  },
  container: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.2,
  },
  feedbackSection: {
    backgroundColor: Colors.white,
    paddingVertical: 15,
    paddingHorizontal: 20,
    // alignItems: 'start',
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8A2BE2',
  },
  tabBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.mediumGray,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 5,
    backgroundColor: Colors.lightGray,
  },
  selectedTabItem: {
    backgroundColor: '#8A2BE2',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGray,
  },
  selectedTabText: {
    color: Colors.white,
  },
  noReviewsText: {
    textAlign: 'center',
    fontSize: 16,
    color: Colors.darkGray,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewText: {
    fontSize: 14,
    color: Colors.darkGray,
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.mediumGray,
    textAlign: 'right',
  },
  addButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '75%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  modalContent: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: Colors.mediumGray,
    borderRadius: 2.5,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#8A2BE2',
  },
  picker: {
    width: '100%',
    height: 150,
  },
  pickerItem: {
    fontSize: 16,
  },
  input: {
    width: '100%',
    height: 120,
    borderWidth: 1,
    borderColor: Colors.mediumGray,
    borderRadius: 10,
    padding: 15,
    textAlignVertical: 'top',
    fontSize: 16,
    color: Colors.black,
    backgroundColor: Colors.lightGray,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginVertical: 25,
  },
  submitButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AllReviewsScreen;
