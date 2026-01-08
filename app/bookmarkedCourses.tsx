import { bookmarksStore } from '@/src/data/courses';
import { courseService } from '@/src/services/courseService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookmarkedCoursesScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Re-fetch or re-filter on focus
  useFocusEffect(
    useCallback(() => {
      const loadAndFilter = async () => {
        setLoading(true);
        try {
          const allCourses = await courseService.fetchPublishedCourses();
          const bookmarked = allCourses.filter(c => bookmarksStore.has(c.id));
          setCourses(bookmarked);
        } catch (error) {
          console.error('[BookmarkedCourses] Fetch error:', error);
        } finally {
          setLoading(false);
        }
      };

      loadAndFilter();
    }, [])
  );

  const removeBookmark = (id: string) => {
    bookmarksStore.delete(id);
    // Update local state immediately for better UX
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/courseDetails/${item.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.cardLeft}>
        <Image
          source={{ uri: item.thumbnail || item.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2670&auto=format&fit=crop' }}
          style={styles.courseImage}
        />
      </View>
      <View style={styles.cardMiddle}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{item.categories || 'General'}</Text>
        </View>
        <Text style={styles.courseTitle} numberOfLines={2}>{item.title || 'Untitled Course'}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.freeText}>Free</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingVal}>{(item.avg_rating || 0).toFixed(1)}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.bookmarkBtn} onPress={() => removeBookmark(item.id)}>
        <Ionicons name="bookmark" size={24} color="#8A2BE2" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Courses</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
        </View>
      ) : (
        <FlatList
          data={courses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No saved courses yet.</Text>
              <Text style={styles.emptySubText}>Save courses to watch them later.</Text>
            </View>
          }
        />
      )}
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
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#8A2BE2',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardLeft: {
    marginRight: 15,
  },
  courseImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  cardMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryTag: {
    backgroundColor: '#ECE6F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
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
    marginBottom: 6,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  freeText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingVal: {
    fontSize: 13,
    color: '#333',
    fontWeight: 'bold',
  },
  bookmarkBtn: {
    padding: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 20,
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  }
});
