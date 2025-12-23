import { INITIAL_COURSES, bookmarksStore } from '@/src/data/courses';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
  const [bookmarkedList, setBookmarkedList] = useState(INITIAL_COURSES.filter(c => bookmarksStore.has(c.id)));

  // Re-fetch on focus in case something changed elsewhere (though unlikely here, good practice)
  // Also needed if we remove something here, we want UI to update.
  const refreshList = () => {
    setBookmarkedList(INITIAL_COURSES.filter(c => bookmarksStore.has(c.id)));
  };

  const removeBookmark = (id: string) => {
    bookmarksStore.delete(id);
    refreshList(); // Update local list immediately
  };

  const renderItem = ({ item }: { item: typeof INITIAL_COURSES[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Image source={{ uri: item.image }} style={styles.courseImage} />
      </View>
      <View style={styles.cardMiddle}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{item.subCategory}</Text>
        </View>
        <Text style={styles.courseTitle}>{item.title}</Text>
        <View style={styles.priceRow}>
          {item.isFree && <Text style={styles.freeText}>Free</Text>}
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingVal}>{item.rating.toFixed(2)}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.bookmarkBtn} onPress={() => removeBookmark(item.id)}>
        <Ionicons name="bookmark" size={24} color="#8A2BE2" />
        {/* Filled because it IS bookmarked if it is in this list */}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookmarked Courses</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={bookmarkedList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No saved courses yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  listContent: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  cardLeft: {
    marginRight: 15,
  },
  courseImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#8A2BE2',
  },
  cardMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryTag: {
    backgroundColor: '#ECE6F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
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
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#333',
    fontWeight: 'bold',
  },
  bookmarkBtn: {
    padding: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  }
});
