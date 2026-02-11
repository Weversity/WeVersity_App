import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

const CourseItem = memo(({ item }: { item: any }) => {
  // item is a live_session object
  const course = item.course || {};
  const instructor = item.instructor || {};
  const instructorName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || 'Instructor';
  const instructorPicture = instructor.avatar_url || `https://ui-avatars.com/api/?name=${instructorName}&background=8A2BE2&color=fff`;
  const courseImage = course.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2670&auto=format&fit=crop';
  const category = (typeof course.categories === 'string' ? course.categories : null) || 'DEVELOPMENT';

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
          {course.title || 'Live Session'}
        </Text>

        {/* Footer - Instructor & Join Button */}
        <View style={styles.footer}>
          <View style={styles.instructorInfo}>
            <Image source={{ uri: instructorPicture }} style={styles.instructorAvatar} />
            <View style={styles.instructorTextContainer}>
              <Text style={styles.instructorLabel}>INSTRUCTOR</Text>
              <Text style={styles.instructorName}>{instructorName}</Text>
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

// Error Display Component
const ErrorBox = ({ message }: { message: string }) => (
  <View style={styles.errorContainer}>
    <Ionicons name="alert-circle" size={24} color="#FF3B30" />
    <Text style={styles.errorText}>Error fetching live classes:</Text>
    <Text style={styles.errorMessage}>{message}</Text>
  </View>
);

const LiveCourses: React.FC<LiveCoursesProps> = ({ onCoursesLoaded, searchQuery = '' }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadSessions = useCallback(async (showLoading = true) => {
    if (loading) return;
    if (showLoading) setLoading(true);
    setFetchError(null);

    try {
      console.log('DEBUG: Starting fetch with status: [live, upcoming]...');

      const { data, error } = await supabase
        .from('live_sessions')
        .select('*, instructor:profiles!instructor_id(first_name, last_name, avatar_url), course:courses(title, image_url, categories)')
        .in('status', ['live', 'upcoming', 'Live', 'Upcoming']);

      console.log('DEBUG: Query Result:', data);
      console.log('DEBUG: Query Error:', error);

      if (error) {
        setFetchError(error.message);
        throw error;
      }

      setSessions(data || []);
    } catch (error: any) {
      console.error('Failed to fetch live sessions:', error);
      setFetchError(error.message || 'An unknown error occurred');
      if (onCoursesLoaded) {
        onCoursesLoaded(0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, onCoursesLoaded]);

  useEffect(() => {
    loadSessions();

    // Set up real-time subscription for live_sessions
    const subscription = supabase
      .channel('live_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'live_sessions'
        },
        (payload) => {
          console.log('Live session change detected:', payload.eventType);
          loadSessions(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSessions();
  }, [loadSessions]);

  // Filter based on status, time, and search query
  const filteredSessions = useMemo(() => {
    const now = new Date().getTime();
    const fiveMinutesInMs = 5 * 60 * 1000;
    const todayDate = new Date().toDateString();

    const liveOrSoonSessions = sessions.filter(session => {
      const status = (session.status || '').toLowerCase();

      // Always show if live
      if (status === 'live') return true;

      // If upcoming, check time
      if (status === 'upcoming') {
        if (!session.scheduled_at) return false;

        const scheduledTime = new Date(session.scheduled_at).getTime();
        const scheduledDate = new Date(session.scheduled_at).toDateString();

        const isSoonOrPassed = scheduledTime <= (now + fiveMinutesInMs);
        const isToday = scheduledDate === todayDate;

        return isSoonOrPassed && isToday;
      }

      return false;
    });

    if (!searchQuery.trim()) {
      return liveOrSoonSessions;
    }

    const query = searchQuery.toLowerCase();
    return liveOrSoonSessions.filter(session => {
      const course = session.course || {};
      const title = course.title?.toLowerCase() || '';
      return title.includes(query);
    });
  }, [sessions, searchQuery]);

  // Sync count with parent component
  useEffect(() => {
    if (onCoursesLoaded) {
      onCoursesLoaded(filteredSessions.length);
    }
  }, [filteredSessions.length, onCoursesLoaded]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <CourseItem item={item} />
  ), []);

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="videocam-off" size={48} color="#8A2BE2" />
        </View>
        <Text style={styles.emptyText}>No classes are live right now</Text>
        <Text style={styles.emptySubText}>
          Our instructors aren't live at the moment. Check back later!
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading, onRefresh]);

  const renderFooter = useCallback(() => {
    if (!loading || filteredSessions.length > 0) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#8A2BE2" />;
  }, [loading, filteredSessions]);

  return (
    <View style={{ flex: 1 }}>
      {fetchError && <ErrorBox message={fetchError} />}
      <FlatList
        key="single-column-list"
        data={filteredSessions}
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
    </View>
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
    paddingRight: 10,
  },
  instructorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  instructorTextContainer: {
    flex: 1,
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
    backgroundColor: '#fcfaff',
    borderRadius: 24,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#f0e6ff',
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3ebff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    color: '#1a1a1a',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubText: {
    color: '#666',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorMessage: {
    color: '#FF3B30',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default LiveCourses;
