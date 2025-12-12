import SearchEmptyState from '@/src/components/SearchEmptyState';
import { CATEGORIES, Course, INITIAL_COURSES, bookmarksStore } from '@/src/data/courses';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

// Card Component matching Image 0
const CourseCard = ({ course, onBookmarkToggle, isBookmarked, onPress }: { course: Course; onBookmarkToggle: (id: string) => void; isBookmarked: boolean; onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardLeft}>
        <Image source={{ uri: course.image }} style={styles.courseImage} />
      </View>
      <View style={styles.cardMiddle}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{course.subCategory}</Text>
        </View>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <View style={styles.priceRow}>
          {course.isFree && <Text style={styles.freeText}>Free</Text>}
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingVal}>{course.rating.toFixed(2)}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.bookmarkBtn} onPress={() => onBookmarkToggle(course.id)}>
        <Ionicons
          name={isBookmarked ? "bookmark" : "bookmark-outline"}
          size={24}
          color="#8A2BE2"
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function MyCoursesScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  // State
  const [activeTab, setActiveTab] = useState('All');
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filterAnimation = useRef(new Animated.Value(0)).current;

  // Filter Modal State
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('All');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  // Force update for Bookmark Store sync
  const [, setTick] = useState(0);
  const forceUpdate = () => setTick(t => t + 1);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      forceUpdate();
    });
    return unsubscribe;
  }, [navigation]);

  const toggleBookmark = (id: string) => {
    if (bookmarksStore.has(id)) {
      bookmarksStore.delete(id);
    } else {
      bookmarksStore.add(id);
    }
    forceUpdate();
  };

  const filteredCourses = useMemo(() => {
    let currentCourses = INITIAL_COURSES;

    // 1. Top Tab Filter (Main Tabs: All, Skills, Technical)
    if (activeTab === 'Skills Courses') {
      currentCourses = currentCourses.filter(course => course.category === 'Skills Courses');
    } else if (activeTab === 'Technical Courses') {
      currentCourses = currentCourses.filter(course => course.category === 'Technical Courses');
    }

    // 2. Search
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      currentCourses = currentCourses.filter(c =>
        c.title.toLowerCase().includes(lower) ||
        c.instructor.toLowerCase().includes(lower)
      );
    }

    // 3. Modal Filters (Category & Rating)
    if (selectedFilterCategory !== 'All') {
      // Filter by subCategory (e.g., 'Learn HTML', 'Web Design')
      currentCourses = currentCourses.filter(c => c.subCategory === selectedFilterCategory);
    }

    if (selectedRating !== null) {
      // Filter by Rating (assuming >= logic)
      currentCourses = currentCourses.filter(c => Math.floor(c.rating) >= selectedRating);
    }

    return currentCourses;
  }, [activeTab, searchQuery, selectedFilterCategory, selectedRating]);

  // Animation
  const showFilter = () => {
    setFilterVisible(true);
    Animated.timing(filterAnimation, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const hideFilter = () => {
    Animated.timing(filterAnimation, {
      toValue: 0,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => setFilterVisible(false));
  };

  const filterTranslateY = filterAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  });

  const resetFilters = () => {
    setSelectedFilterCategory('All');
    setSelectedRating(null);
  };

  const applyFilters = () => {
    hideFilter();
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>My Courses</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={showFilter} style={styles.headerIcon}>
            <Ionicons name="filter-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/bookmarkedCourses')} style={styles.headerIcon}>
            <Ionicons name="bookmark-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs & Search */}
      <View style={styles.tabsAndSearchContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}
          style={{ flex: 1 }}
        >
          {['All', 'Skills Courses', 'Technical Courses'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={() => setSearchVisible(!searchVisible)} style={styles.searchIconContainer}>
          <Ionicons name="search-outline" size={24} color="#8A2BE2" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      {searchVisible && (
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchInputIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => { setSearchVisible(false); setSearchQuery('') }}>
            <Ionicons name="close-circle-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredCourses}
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onBookmarkToggle={toggleBookmark}
            isBookmarked={bookmarksStore.has(item.id)}
            onPress={() => router.push(`/courseDetails/${item.id}` as any)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          searchQuery.length > 0 ? (
            <SearchEmptyState query={searchQuery} />
          ) : null
        }
      />

      {/* Filter Modal */}
      <Modal transparent visible={filterVisible} onRequestClose={hideFilter}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={hideFilter}>
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: filterTranslateY }] }]}>

            <View style={styles.handleBar} />
            <Text style={styles.filterHeaderTitle}>Filter</Text>

            {/* Category Section */}
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.chipsContainer}>
              {CATEGORIES.filter(c => c !== 'All' && c !== 'Skills Courses' && c !== 'Technical Courses').map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    selectedFilterCategory === cat && styles.chipActive
                  ]}
                  onPress={() => setSelectedFilterCategory(cat === selectedFilterCategory ? 'All' : cat)}
                >
                  <Text style={[
                    styles.chipText,
                    selectedFilterCategory === cat && styles.chipTextActive
                  ]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rating Section */}
            <Text style={styles.sectionTitle}>Rating</Text>
            <View style={styles.chipsContainer}>
              <TouchableOpacity
                style={[styles.chip, selectedRating === null && styles.chipActive]}
                onPress={() => setSelectedRating(null)}
              >
                <Ionicons name="star" size={14} color={selectedRating === null ? "#fff" : "#8A2BE2"} />
                <Text style={[styles.chipText, selectedRating === null && styles.chipTextActive, { marginLeft: 4 }]}>All</Text>
              </TouchableOpacity>
              {[5, 4, 3, 2].map(star => (
                <TouchableOpacity
                  key={star}
                  style={[styles.chip, selectedRating === star && styles.chipActive]}
                  onPress={() => setSelectedRating(star)}
                >
                  <Ionicons name="star" size={14} color={selectedRating === star ? "#fff" : "#8A2BE2"} />
                  <Text style={[styles.chipText, selectedRating === star && styles.chipTextActive, { marginLeft: 4 }]}>{star}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            {/* Footer Buttons */}
            <View style={styles.filterFooter}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>Filter</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 5 : 45,
    paddingBottom: 5,
    backgroundColor: '#8A2BE2',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerIcon: {
    padding: 5,
  },
  tabsAndSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 5, // Reduced gap
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: '#8A2BE2',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  searchIconContainer: {
    padding: 5,
    marginLeft: 20, // Added margin to separation
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    height: 44,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  searchInputIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#8A2BE2',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    marginRight: 10,
  },
  courseImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#8A2BE2',
  },
  cardMiddle: {
    flex: 1,
    marginRight: 10,
  },
  categoryTag: {
    backgroundColor: '#ECE6F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  categoryText: {
    color: '#8A2BE2',
    fontSize: 10,
    fontWeight: 'bold',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 10,
  },
  freeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingVal: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  bookmarkBtn: {
    padding: 5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    minHeight: 450,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  filterHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 25,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8A2BE2',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#8A2BE2',
  },
  chipText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  filterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 25,
    backgroundColor: '#E6E6FA', // Light purple
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#8A2BE2',
    fontWeight: 'bold',
    fontSize: 16,
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 25,
    backgroundColor: '#8A2BE2',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});