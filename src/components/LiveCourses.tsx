import { Link } from 'expo-router';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { courseService } from '../services/courseService';

const CourseItem = memo(({ item }: { item: any }) => {
  const instructorName = `${item.instructor?.first_name || ''} ${item.instructor?.last_name || ''}`.trim() || 'Instructor';
  const instructorExpertise = item.categories || 'Expert';
  const instructorPicture = item.instructor?.avatar_url || `https://randomuser.me/api/portraits/lego/1.jpg`;

  return (
    <View style={styles.courseItem}>
      <View>
        <Image source={{ uri: instructorPicture }} style={styles.coachImage} />
        <View style={styles.liveTag}>
          <Text style={styles.tagText}>LIVE</Text>
        </View>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.coachName}>{instructorName}</Text>
        <Text style={styles.coachExpertise}>{instructorExpertise}</Text>
        <Text style={styles.courseTitle} numberOfLines={1} ellipsizeMode='tail'>{item.title}</Text>
        <Link href={`/courseDetails/${item.id}`} asChild>
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join Now</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
});

const LiveCourses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // Start with false
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadCourses = useCallback(async () => {
    if (loading) return; // Prevent re-fetching if already loading
    
    setLoading(true);
    try {
      const data = await courseService.fetchPublishedCourses();
      setCourses(data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading]); // Add loading to dependency array

  useEffect(() => {
    loadCourses();
  }, []); // Remove loadCourses from dependency array to only run on mount

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCourses();
  }, [loadCourses]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <CourseItem item={item} />
  ), []);

  const renderEmpty = useCallback(() => {
    if (loading) return null; // Don't show empty text while loading
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No live courses available right now.</Text>
      </View>
    );
  }, [loading]);

  const renderFooter = useCallback(() => {
    // Show footer loading indicator only on initial load
    if (!loading || courses.length > 0) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#8A2BE2" />;
  }, [loading, courses]);

  return (
    <FlatList
      data={courses}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A2BE2" />
      }
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
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
  liveTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
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
    backgroundColor: '#8A2BE2',
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LiveCourses;