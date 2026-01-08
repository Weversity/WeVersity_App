import { CourseCardSkeleton } from '@/src/components/CourseCardSkeleton';
import SearchEmptyState from '@/src/components/SearchEmptyState';
import { bookmarksStore } from '@/src/data/courses';
import { courseService } from '@/src/services/courseService';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';


const { width } = Dimensions.get('window');

// Step 2: Key Name Matching Check
const CourseCard = ({ course, onBookmarkToggle, isBookmarked, onPress }: { course: any; onBookmarkToggle: (id: string) => void; isBookmarked: boolean; onPress: () => void }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.cardLeft}>
        <Image
          source={{ uri: course.thumbnail || course.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2670&auto=format&fit=crop' }}
          style={styles.courseImage}
          transition={200}
          contentFit="cover"
        />
      </View>
      <View style={styles.cardMiddle}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{course.categories || 'General'}</Text>
        </View>
        <Text style={styles.courseTitle} numberOfLines={2}>{course.title || 'Untitled Course'}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.freeText}>Free</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingVal}>{(course.avg_rating || 0).toFixed(1)}</Text>
            <Text style={[styles.ratingVal, { fontSize: 10, marginLeft: 2 }]}>
              ({course.reviewCount || 0})
            </Text>
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
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('All');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'Skills Courses' | 'Technical Courses'>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [error, setError] = useState<string | null>(null); // Keeping error state for explicit error handling if needed

  const filterAnimation = useRef(new Animated.Value(0)).current;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['courses', activeTab],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const data = await courseService.fetchPublishedCourses(pageParam, 10);
        return (data || []).map(c => ({
          ...c,
          is_free: c.price === 0
        }));
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred. Please try again.');
        throw err;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined;
    },
    initialPageParam: 0,
    enabled: !searchQuery && selectedFilterCategory === 'All' && selectedRating === null,
  });

  const courses = useMemo(() => {
    if (!data?.pages) return [];

    // Filter duplicates by ID to ensure unique keys
    const seen = new Set();
    const allCourses = data.pages.flat();
    return allCourses.filter(course => {
      if (!course.id || seen.has(course.id)) return false;
      seen.add(course.id);
      return true;
    });
  }, [data]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    viewableItems.forEach(({ item }: any) => {
      if (item.id) {
        queryClient.prefetchQuery({
          queryKey: ['course', item.id],
          queryFn: () => courseService.fetchCourseById(item.id),
          staleTime: 1000 * 60 * 10, // 10 minutes
        });
      }
    });
  }).current;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCoursePress = (course: any) => {
    const instructor = Array.isArray(course.instructor) ? course.instructor[0] : course.instructor;
    const instructorName = instructor ? `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() : 'Instructor';
    const title = course.title || course.course_name || '';
    const categories = course.categories || '';

    router.push({
      pathname: '/courseDetails/[id]',
      params: {
        id: course.id,
        title: title,
        thumbnail: course.thumbnail || course.image_url,
        instructor: instructorName,
        categories: categories,
        price: course.price,
        rating: course.avg_rating,
        reviewCount: course.reviewCount
      }
    } as any);
  };

  // Force update for Bookmark Store sync
  const [, setTick] = useState(0);
  const forceUpdate = () => setTick(t => t + 1);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', forceUpdate);
    return unsubscribe;
  }, [navigation]);

  const toggleBookmark = (id: string) => {
    bookmarksStore.has(id) ? bookmarksStore.delete(id) : bookmarksStore.add(id);
    forceUpdate();
  };

  // Memoized filtering logic
  const filteredCourses = useMemo(() => {
    let currentCourses = courses;

    // Tab Filtering Logic
    if (activeTab === 'Skills Courses') {
      const skillsKeywords = ['Marketing', 'Content', 'Design', 'Writing', 'Management', 'Sales'];
      currentCourses = currentCourses.filter(c => {
        const title = (c.title || '').toLowerCase();
        const categories = (c.categories || '').toLowerCase();
        const matchesCategory = categories.includes('skills');
        const matchesTitle = skillsKeywords.some(kw => title.includes(kw.toLowerCase()));
        return matchesCategory || matchesTitle;
      });
    } else if (activeTab === 'Technical Courses') {
      const techKeywords = ['Web', 'App', 'HTML', 'WordPress', 'CSS', 'JS', 'Coding', 'Graphic Design', 'Shopify', 'SEO', 'eCommerce'];
      currentCourses = currentCourses.filter(c => {
        const title = (c.title || '').toLowerCase();
        return techKeywords.some(kw => title.includes(kw.toLowerCase()));
      });
    }

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      currentCourses = currentCourses.filter(c => {
        const instructor = Array.isArray(c.instructor) ? c.instructor[0] : c.instructor;
        return (c.title || '').toLowerCase().includes(lower) ||
          (instructor?.first_name || '').toLowerCase().includes(lower);
      });
    }

    if (selectedFilterCategory !== 'All') {
      currentCourses = currentCourses.filter(c => {
        const cat = c.categories || '';
        return cat.includes(selectedFilterCategory);
      });
    }

    if (selectedRating !== null) {
      currentCourses = currentCourses.filter(c => Math.floor(c.avg_rating || 0) >= selectedRating);
    }

    return currentCourses;
  }, [searchQuery, selectedFilterCategory, selectedRating, courses, activeTab]);

  // Animation handlers
  const showFilter = () => {
    setFilterVisible(true);
    Animated.timing(filterAnimation, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };
  const hideFilter = () => {
    Animated.timing(filterAnimation, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setFilterVisible(false));
  };
  const filterTranslateY = filterAnimation.interpolate({ inputRange: [0, 1], outputRange: [500, 0] });
  const resetFilters = () => {
    setSelectedFilterCategory('All');
    setSelectedRating(null);
  };
  const applyFilters = () => hideFilter();

  // Content rendering logic
  const renderContent = () => {
    if (isLoading && !refreshing && courses.length === 0) { // Check courses.length to avoid showing skeleton on subsequent loads
      return (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4, 5, 6].map((key) => (
            <CourseCardSkeleton key={key} />
          ))}
        </ScrollView>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load courses.</Text>
          <Text style={styles.errorSubText}>{error}</Text>
          <TouchableOpacity style={styles.tryAgainButton} onPress={() => refetch()}>
            <Text style={styles.tryAgainButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Define ListEmptyComponent as a separate function or component
    const renderEmptyState = () => {
      if (searchQuery.length > 0) {
        return <SearchEmptyState query={searchQuery} />;
      } else {
        return (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No courses available right now.</Text>
            <Text style={styles.emptySubText}>Check back later or adjust your filters.</Text>
          </View>
        );
      }
    };

    return (
      <View style={{ flex: 1, minHeight: 500 }}>
        <FlatList
          data={filteredCourses}
          renderItem={({ item }: { item: any }) => (
            <CourseCard
              course={item}
              onBookmarkToggle={toggleBookmark}
              isBookmarked={bookmarksStore.has(item.id)}
              onPress={() => handleCoursePress(item)}
            />
          )}
          keyExtractor={(item: any) => `course-${item.id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A2BE2" />
          }
          ListEmptyComponent={renderEmptyState()}
          ListFooterComponent={() => (
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#8A2BE2" />
                <Text style={styles.footerLoaderText}>Loading more courses...</Text>
              </View>
            ) : null
          )}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage && !searchQuery && selectedFilterCategory === 'All' && selectedRating === null) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerText}>Courses</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={showFilter} style={styles.headerIcon}>
            <Ionicons name="filter-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/bookmarkedCourses')} style={styles.headerIcon}>
            <Ionicons name="bookmark-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

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
              onPress={() => {
                const tabValue = tab as 'All' | 'Skills Courses' | 'Technical Courses';
                setActiveTab(tabValue);
                // setFilterVisible(false); // Removed to keep filter visible if necessary
              }}
            >
              <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={() => setSearchVisible(!searchVisible)} style={styles.searchIconContainer}>
          <Ionicons name="search-outline" size={24} color="#8A2BE2" />
        </TouchableOpacity>
      </View>

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

      {renderContent()}

      <Modal transparent visible={filterVisible} onRequestClose={hideFilter}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={hideFilter}>
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: filterTranslateY }] }]}>
            <View style={styles.handleBar} />
            <Text style={styles.filterHeaderTitle}>Filter</Text>
            <Text style={styles.sectionTitle}>Most Demanded Courses</Text>
            <View style={styles.chipsContainer}>
              {['Web Development', 'App Development', 'UI/UX Design', 'Digital Marketing', 'Graphic Design', 'E-Commerce'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, selectedFilterCategory === cat && styles.chipActive]}
                  onPress={() => setSelectedFilterCategory(cat === selectedFilterCategory ? 'All' : cat)}
                >
                  <Text style={[styles.chipText, selectedFilterCategory === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sectionTitle}>Rating</Text>
            <View style={styles.chipsContainer}>
              <TouchableOpacity style={[styles.chip, selectedRating === null && styles.chipActive]} onPress={() => setSelectedRating(null)}>
                <Ionicons name="star" size={14} color={selectedRating === null ? "#fff" : "#8A2BE2"} />
                <Text style={[styles.chipText, selectedRating === null && styles.chipTextActive, { marginLeft: 4 }]}>All</Text>
              </TouchableOpacity>
              {[5, 4, 3, 2].map(star => (
                <TouchableOpacity key={star} style={[styles.chip, selectedRating === star && styles.chipActive]} onPress={() => setSelectedRating(star)}>
                  <Ionicons name="star" size={14} color={selectedRating === star ? "#fff" : "#8A2BE2"} />
                  <Text style={[styles.chipText, selectedRating === star && styles.chipTextActive, { marginLeft: 4 }]}>{star}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.divider} />
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
    </View>
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
    paddingBottom: 15,
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
    gap: 5,
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
    marginLeft: 20,
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
    backgroundColor: '#E6E6FA',
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D92D20',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  tryAgainButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  tryAgainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 10,
  },
  footerLoaderText: {
    color: '#8A2BE2',
    fontSize: 14,
    fontWeight: '500',
  },
  loadMoreBtn: {
    borderWidth: 1,
    borderColor: '#8A2BE2',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  loadMoreBtnText: {
    color: '#8A2BE2',
    fontSize: 15,
    fontWeight: '600',
  }
});