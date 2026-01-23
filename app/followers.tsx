import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { videoService } from '@/src/services/videoService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface FollowedInstructor {
  id: string;
  following_id: string;
  instructor: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

export default function FollowersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [followedMentors, setFollowedMentors] = useState<FollowedInstructor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowedMentors = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('follows')
        .select(`
          id,
          following_id,
          instructor:profiles!following_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('follower_id', user.id);

      if (error) throw error;
      setFollowedMentors(data as any || []);
    } catch (error: any) {
      console.error('Error fetching followed mentors:', error.message);
      Alert.alert('Error', 'Failed to load followed instructors');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFollowedMentors();
    }, [user?.id])
  );

  const handleUnfollow = async (followingId: string) => {
    if (!user?.id) return;

    try {
      await videoService.toggleFollow(user.id, followingId);
      // Refresh list
      fetchFollowedMentors();
    } catch (error: any) {
      console.error('Error toggling follow:', error.message);
      Alert.alert('Error', 'Failed to unfollow instructor');
    }
  };

  const filteredMentors = followedMentors.filter(item => {
    const name = `${item.instructor?.first_name || ''} ${item.instructor?.last_name || ''}`.toLowerCase();
    const searchLower = search.toLowerCase();
    return name.includes(searchLower);
  });

  const renderContent = () => {
    if (loading && followedMentors.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <Text style={styles.loadingText}>Loading followed instructors...</Text>
        </View>
      );
    }

    if (filteredMentors.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>{search ? 'No matches found' : 'No followed mentors yet'}</Text>
          <Text style={styles.emptySubtext}>
            {search ? 'Try adjusting your search' : 'Start following mentors to see them here'}
          </Text>
          {!search && (
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/allMentors')}
            >
              <Text style={styles.exploreButtonText}>Explore Mentors</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={filteredMentors}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.instructorItem}
            onPress={() => router.push({ pathname: '/viewProfile/[id]', params: { id: item.following_id } })}
          >
            <Image
              source={{ uri: item.instructor?.avatar_url || 'https://via.placeholder.com/150' }}
              style={styles.avatar}
            />
            <View style={styles.instructorInfo}>
              <Text style={styles.instructorName}>
                {item.instructor?.first_name} {item.instructor?.last_name}
              </Text>
              <Text style={styles.instructorSpecialty}>Instructor</Text>
            </View>
            <TouchableOpacity
              style={styles.unfollowButton}
              onPress={() => handleUnfollow(item.following_id)}
            >
              <Text style={styles.unfollowButtonText}>Unfollow</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={fetchFollowedMentors}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Followed Instructors</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search instructors..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {renderContent()}
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
  backButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#8A2BE2',
    fontSize: 16,
  },
  instructorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#8A2BE2',
  },
  instructorInfo: {
    flex: 1,
  },
  instructorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  instructorSpecialty: {
    fontSize: 13,
    color: '#666',
  },
  unfollowButton: {
    backgroundColor: '#f44336',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  unfollowButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
