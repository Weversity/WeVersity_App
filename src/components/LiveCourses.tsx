import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { courseService } from '../services/courseService';

const CourseItem = memo(({ item }: { item: any }) => {
  const instructorName = `${item.instructor?.first_name || ''} ${item.instructor?.last_name || ''}`.trim() || 'Instructor';
  const instructorPicture = item.instructor?.avatar_url || `https://ui-avatars.com/api/?name=${instructorName}&background=8A2BE2&color=fff`;
  const courseImage = item.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2670&auto=format&fit=crop';
  const category = item.categories || 'DEVELOPMENT';
  const rating = item.avg_rating || 4.8;

  // Use real viewer count from database, default to 0 if not present
  const viewerCount = item.active_viewers || 0;

  return (
    <View style={styles.courseCard}>
      {/* Image Section with Badges */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: courseImage }} style={styles.courseImage} />

        {/* LIVE Badge - Top Left */}
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Viewer Count - Top Right */}
        <View style={styles.viewerBadge}>
          <Ionicons name="eye" size={14} color="#fff" />
          <Text style={styles.viewerText}>{viewerCount.toLocaleString()} viewers</Text>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Category Row */}
        <View style={styles.metaRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{category.toUpperCase()}</Text>
          </View>
        </View>

        {/* Course Title */}
        <Text style={styles.courseTitle} numberOfLines={2} ellipsizeMode="tail">
          {item.title}
        </Text>

        {/* Footer - Instructor & Join Button */}
        <View style={styles.footer}>
          <View style={styles.instructorInfo}>
            <Image source={{ uri: instructorPicture }} style={styles.instructorAvatar} />
            <View>
              <Text style={styles.instructorLabel}>INSTRUCTOR</Text>
              <Text style={styles.instructorName} numberOfLines={1}>{instructorName}</Text>
            </View>
          </View>

          <Link href={`/live/${item.id}`} asChild>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Now</Text>
              <Ionicons name="play" size={14} color="#fff" style={styles.playIcon} />
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
});

interface LiveCoursesProps {
  onCoursesLoaded?: (count: number) => void;
  searchQuery?: string;
}

const LiveCourses: React.FC<LiveCoursesProps> = ({ onCoursesLoaded, searchQuery = '' }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadCourses = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    try {
      const data = await courseService.fetchPublishedCourses();
      setCourses(data);
      // Notify parent about course count
      if (onCoursesLoaded) {
        onCoursesLoaded(data.length);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, onCoursesLoaded]);

  useEffect(() => {
    loadCourses();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCourses();
  }, [loadCourses]);

  // Filter courses based on search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) {
      return courses;
    }

    const query = searchQuery.toLowerCase();
    return courses.filter(course => {
      const title = course.title?.toLowerCase() || '';
      const instructorName = `${course.instructor?.first_name || ''} ${course.instructor?.last_name || ''}`.toLowerCase();
      const category = course.categories?.toLowerCase() || '';

      return title.includes(query) || instructorName.includes(query) || category.includes(query);
    });
  }, [courses, searchQuery]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <CourseItem item={item} />
  ), []);

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="videocam-off-outline" size={60} color="#ccc" />
        <Text style={styles.emptyText}>No live courses available right now.</Text>
        <Text style={styles.emptySubText}>Check back later for live sessions!</Text>
      </View>
    );
  }, [loading]);

  const renderFooter = useCallback(() => {
    if (!loading || filteredCourses.length > 0) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#8A2BE2" />;
  }, [loading, filteredCourses]);

  return (
    <FlatList
      key="single-column-list"
      data={filteredCourses}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A2BE2" />
      }
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  courseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  viewerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  viewerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  contentSection: {
    padding: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryPill: {
    backgroundColor: '#E6E0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  categoryText: {
    color: '#6C63FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  instructorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  instructorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  instructorLabel: {
    fontSize: 9,
    color: '#999',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  instructorName: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 6,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  playIcon: {
    marginLeft: 2,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default LiveCourses;