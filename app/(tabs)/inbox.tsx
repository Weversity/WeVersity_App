import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';

const conversationsData = [
    {
      id: '1',
      name: 'Dr. Sarah Smith',
      message: "Don't forget about the live session today! We will be covering Redux state management in depth.",
      time: '10:30 AM',
      unread: 2,
      online: true,
      avatarColor: '#E0E7FF' // Light Indigo
    },
    {
      id: '2',
      name: 'Support Team',
      message: 'Your ticket #492 has been resolved. Please let us know if you need anything else.',
      time: 'Yesterday',
      unread: 0,
      isRead: true, // blue check equivalent
      avatarColor: '#F0FDF4' // Light Green
    },
    {
      id: '3',
      name: 'John Doe',
      message: 'Hey, can you help me with the assignment? I am stuck on the third problem.',
      time: 'Tue',
      unread: 0,
      isRead: true,
      online: true,
      avatarColor: '#FFF7ED' // Light Orange
    },
    {
      id: '4',
      name: 'Course System',
      message: 'New materials have been added to Python 101. Check out the new module on Decorators.',
      time: 'Mon',
      unread: 1,
      system: true,
      avatarColor: '#F3F4F6' // Light Gray
    },
    {
      id: '5',
      name: 'Emily Chen',
      message: "Thanks for the notes! They were super helpful for the exam prep.",
      time: 'Sun',
      unread: 0,
      isRead: true,
      avatarColor: '#FCE7F3' // Light Pink
    },
    {
      id: '6',
      name: 'Python Course',
      message: 'The deadline for the project is approaching. Make sure to submit it on time.',
      time: 'Fri',
      unread: 1,
      system: true,
      avatarColor: '#F3F4F6' // Light Gray
    },
    {
      id: '7',
      name: 'HTML Course',
      message: 'A new discussion has been started on the topic of "CSS Grid vs. Flexbox".',
      time: 'Thu',
      unread: 0,
      system: true,
      avatarColor: '#F3F4F6' // Light Gray
    },
];

// Reusable Conversation Item Component
const ConversationItem = ({ item }: { item: any }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => router.push(`/chat/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatarContainer, { backgroundColor: item.avatarColor }]}>
        {item.system ? (
          <Ionicons name="notifications" size={24} color="#555" />
        ) : (
          <Text style={styles.avatarInitials}>{item.name.charAt(0)}</Text>
        )}
        {item.online && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.metaContainer}>
            <Text style={[styles.time, item.unread > 0 && styles.activeTime]}>{item.time}</Text>
          </View>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.messagePreview} numberOfLines={2}>
            {item.message}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
          {item.unread === 0 && item.isRead && (
            <Ionicons name="checkmark-done" size={16} color="#6C63FF" style={styles.readIcon} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};


// Scenes for TabView
const AllChatsRoute = ({ conversations }: { conversations: any[] }) => (
  <FlatList
    data={conversations}
    renderItem={({ item }) => <ConversationItem item={item} />}
    keyExtractor={(item) => item.id}
    contentContainerStyle={styles.listContent}
    showsVerticalScrollIndicator={false}
  />
);

const UnreadRoute = ({ conversations }: { conversations: any[] }) => (
    <FlatList
        data={conversations.filter((c) => c.unread > 0)}
        renderItem={({ item }) => <ConversationItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
    />
);

const CommunitiesRoute = ({ conversations }: { conversations: any[] }) => (
    <FlatList
        data={conversations.filter((c) => c.system)}
        renderItem={({ item }) => <ConversationItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
    />
);

export default function InboxScreen() {
  const layout = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'all', title: 'All' },
    { key: 'unread', title: 'Unread' },
    { key: 'communities', title: 'Communities' },
  ]);

  const [filteredConversations, setFilteredConversations] = useState(conversationsData);

  useEffect(() => {
    const filtered = conversationsData.filter(conversation =>
      conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredConversations(filtered);
  }, [searchQuery]);

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'all':
        return <AllChatsRoute conversations={filteredConversations} />;
      case 'unread':
        return <UnreadRoute conversations={filteredConversations} />;
      case 'communities':
        return <CommunitiesRoute conversations={filteredConversations} />;
      default:
        return null;
    }
  };

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: 'white' }}
      style={{ backgroundColor: '#8A2BE2' }}
      labelStyle={{ fontWeight: '700' }}
      activeColor={'#fff'}
      inactiveColor={'#E0B0FF'}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Inbox</Text>
      </View>
      <View style={styles.contentArea}>
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sceneText: {
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    // paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 5 : 45, // Tab bar is part of header now
    paddingBottom: 5,
    paddingTop: 40,
    paddingHorizontal: 20,
    backgroundColor: '#8A2BE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  contentArea: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '600',
    color: '#555',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E', // Green
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  activeTime: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align mainly to top of text
  },
  messagePreview: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: '#6C63FF',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginTop: 2,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  readIcon: {
    marginTop: 2,
  },
});
