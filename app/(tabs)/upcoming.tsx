import { useAuth } from '@/src/context/AuthContext';
import StatefulPage from '@/src/components/common/StatefulPage';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AnimatedHeaderView, AnimatedBodyView } from '../../src/components/common/ContentTransitions';
import { SafeAreaView } from 'react-native-safe-area-context';
import UpcomingClasses from '../../src/components/UpcomingClasses';
import { HapticsService } from '@/src/utils/haptics';

export default function UpcomingScreen() {
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Purple Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <AnimatedHeaderView>
            <Text style={styles.headerTitle}>Upcoming Classes</Text>
          </AnimatedHeaderView>
          <AnimatedHeaderView delay={150}>
            <Text style={styles.headerSubTitle}>Find your next big learning moment</Text>
          </AnimatedHeaderView>
        </View>

        <TouchableOpacity
          style={styles.searchIcon}
          onPress={() => {
            HapticsService.light();
            setSearchVisible(!searchVisible);
          }}
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
            placeholder="Search upcoming classes..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              HapticsService.light();
              setSearchQuery('');
            }}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <StatefulPage>
        <SafeAreaView style={styles.contentArea}>
          <View style={{ flex: 1 }}>
            <UpcomingClasses searchQuery={searchQuery} />
          </View>
        </SafeAreaView>
      </StatefulPage>
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
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 5 : 45,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#8A2BE2', // Purple color
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
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
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 15,
    height: 50,
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
  }
});
