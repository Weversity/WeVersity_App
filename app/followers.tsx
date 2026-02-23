import { useAuth } from '@/src/context/AuthContext';
// @ts-ignore
import { supabase } from '@/src/lib/supabase';
// @ts-ignore
import { videoService } from '@/src/services/videoService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
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

    if (!search && followedMentors.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <LinearGradient
              colors={['#A450E5', '#6A0DAD']}
              style={styles.emptyIconCircle}
            >
              <Ionicons name="people-circle-outline" size={50} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.emptyTitle}>Your Following List is Empty</Text>

          <Text style={styles.emptySubtitle}>
            Follow your favorite instructors to stay updated with their latest shorts and courses.
          </Text>

          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>How to follow an instructor:</Text>

            <View style={styles.stepRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
              <Text style={styles.stepText}>Go to the <Text style={styles.boldText}>Shorts Feed</Text></Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
              <Text style={styles.stepText}>Tap on the <Text style={styles.boldText}>Instructor's Profile icon</Text> on any short</Text>
            </View>

            <View style={[styles.stepRow, { marginBottom: 0 }]}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
              <Text style={styles.stepText}>Hit the <Text style={styles.boldText}>Follow button</Text> to stay updated!</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/')}
            style={styles.exploreButtonWrapper}
          >
            <LinearGradient
              colors={['#8A2BE2', '#6A0DAD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.exploreButton}
            >
              <Text style={styles.exploreButtonText}>Explore Shorts</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    if (search && filteredMentors.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#ccc" style={{ marginBottom: 20 }} />
          <Text style={styles.emptyTitle}>No matches found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your search terms</Text>
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearch('')}
          >
            <Text style={styles.clearSearchText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredMentors}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const instructor = Array.isArray(item.instructor) ? item.instructor[0] : item.instructor;
          const firstName = instructor?.first_name || '';
          const lastName = instructor?.last_name || '';
          const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || '?';
          const avatarUrl = instructor?.avatar_url;

          return (
            <TouchableOpacity
              style={styles.instructorItem}
              onPress={() => router.push({ pathname: '/viewProfile/[id]', params: { id: item.following_id } })}
            >
              {avatarUrl && avatarUrl.trim() !== '' && avatarUrl.startsWith('http') ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.initialsAvatar}>
                  <Text style={styles.initialsText}>{initials}</Text>
                </View>
              )}
              <View style={styles.instructorInfo}>
                <Text style={styles.instructorName}>
                  {firstName} {lastName}
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
          );
        }}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={fetchFollowedMentors}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Followed Instructors</Text>
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
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
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
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#8A2BE2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 10,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#8A2BE2',
  },
  initialsAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#8A2BE2',
  },
  initialsText: {
    color: '#8A2BE2',
    fontWeight: 'bold',
    fontSize: 20,
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
    paddingHorizontal: 30,
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  instructionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 32,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8A2BE220',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2, // Align with the first line of text
  },
  stepNumberText: {
    color: '#8A2BE2',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#444',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#8A2BE2',
  },
  exploreButtonWrapper: {
    width: '100%',
  },
  exploreButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearSearchButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  clearSearchText: {
    color: '#8A2BE2',
    fontWeight: '600',
    fontSize: 16,
  },
});
