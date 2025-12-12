import { getFollowedMentors, toggleFollow, Mentor } from '@/src/data/mentorsStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { FlatList, Image, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function FollowersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [followedMentors, setFollowedMentors] = useState<Mentor[]>(getFollowedMentors());

  useFocusEffect(
    useCallback(() => {
      setFollowedMentors(getFollowedMentors());
    }, [])
  );

  const handleUnfollow = (id: string) => {
    toggleFollow(id);
    setFollowedMentors(getFollowedMentors());
  };

  const filteredMentors = followedMentors.filter(mentor =>
    mentor.name.toLowerCase().includes(search.toLowerCase()) ||
    mentor.specialty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
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
      {filteredMentors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No followed mentors yet</Text>
          <Text style={styles.emptySubtext}>Start following mentors to see them here</Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/allMentors')}
          >
            <Text style={styles.exploreButtonText}>Explore Mentors</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredMentors}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.instructorItem}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <View style={styles.instructorInfo}>
                <Text style={styles.instructorName}>{item.name}</Text>
                <Text style={styles.instructorSpecialty}>{item.specialty}</Text>
              </View>
              <TouchableOpacity style={styles.unfollowButton} onPress={() => handleUnfollow(item.id)}>
                <Text style={styles.unfollowButtonText}>Unfollow</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
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
