import LiveCourses from '@/src/components/LiveCourses';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { user, profile, role } = useAuth();
  const [liveClassCount, setLiveClassCount] = useState(0);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pulsating animation for live dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Create infinite pulsating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Get first name from profile or metadata
  const firstName = profile?.first_name || user?.user_metadata?.first_name || 'Student';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Purple Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.onAirBadge}>
            <Animated.View
              style={[
                styles.liveDot,
                {
                  transform: [{ scale: pulseAnim }],
                  shadowColor: '#FF3B5C',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 4,
                }
              ]}
            />
            <Text style={styles.onAirText}>ON AIR NOW</Text>
          </View>
          <Text style={styles.headerTitle}>Live Classes</Text>
        </View>

        <TouchableOpacity
          style={styles.searchIcon}
          onPress={() => setSearchVisible(!searchVisible)}
        >
          <Ionicons
            name={searchVisible ? "close" : "search"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar (Below Header) */}
      {searchVisible && (
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchInputIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search live classes..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.contentArea}>
        {/* Live Classes Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerLabel}>GLOBAL LEARNING</Text>
          <Text style={styles.bannerTitle}>{liveClassCount} Active Classes</Text>
          <Text style={styles.bannerSubtitle}>Join thousands of students learning right now.</Text>
        </View>

        <LiveCourses onCoursesLoaded={setLiveClassCount} searchQuery={searchQuery} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F2F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#8A2BE2', // Purple color (matching other headers)
  },
  onAirBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B5C',
    marginRight: 8,
  },
  onAirText: {
    color: '#FF3B5C',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchIcon: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  contentArea: {
    flex: 1,
  },
  banner: {
    backgroundColor: '#E6E0FF', // Light purple
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerLabel: {
    color: '#7C3AED', // Attractive darker purple
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  bannerTitle: {
    color: '#5B21B6', // Deep purple for title
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  bannerSubtitle: {
    color: '#7C3AED', // Medium purple for subtitle
    fontSize: 13,
    fontWeight: '400',
  },
});
