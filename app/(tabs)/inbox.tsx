import { useAuth } from '@/src/context/AuthContext';
import { chatService } from '@/src/services/chatService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { TabBar, TabView } from 'react-native-tab-view';

// Reusable Conversation Item Component
const ConversationItem = memo(({ item, onPress }: { item: any; onPress: (id: string) => void }) => {
  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onPress(item.id)}
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
});

// Scenes for TabView
const renderEmptyMessages = (message: string) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

const AllChatsRoute = memo(({ conversations, onPress, refreshing, onRefresh }: { conversations: any[]; onPress: (id: string) => void; refreshing: boolean; onRefresh: () => void }) => (
  <FlatList
    data={conversations}
    renderItem={({ item }) => <ConversationItem item={item} onPress={onPress} />}
    keyExtractor={(item) => item.id}
    contentContainerStyle={styles.listContent}
    showsVerticalScrollIndicator={false}
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A2BE2" />
    }
    ListEmptyComponent={() => renderEmptyMessages('No messages found.')}
  />
));

const UnreadRoute = memo(({ conversations, onPress, refreshing, onRefresh }: { conversations: any[]; onPress: (id: string) => void; refreshing: boolean; onRefresh: () => void }) => (
  <FlatList
    data={conversations.filter((c) => c.unread > 0)}
    renderItem={({ item }) => <ConversationItem item={item} onPress={onPress} />}
    keyExtractor={(item) => item.id}
    contentContainerStyle={styles.listContent}
    showsVerticalScrollIndicator={false}
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A2BE2" />
    }
    ListEmptyComponent={() => renderEmptyMessages('No unread messages.')}
  />
));

const CommunitiesRoute = memo(({ conversations, onPress, refreshing, onRefresh }: { conversations: any[]; onPress: (id: string) => void; refreshing: boolean; onRefresh: () => void }) => (
  <FlatList
    data={conversations.filter((c) => c.system)}
    renderItem={({ item }) => <ConversationItem item={item} onPress={onPress} />}
    keyExtractor={(item) => item.id}
    contentContainerStyle={styles.listContent}
    showsVerticalScrollIndicator={false}
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A2BE2" />
    }
    ListEmptyComponent={() => renderEmptyMessages('No community updates yet.')}
  />
));

export default function InboxScreen() {
  const router = useRouter();
  const layout = useWindowDimensions();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'all', title: 'All' },
    { key: 'unread', title: 'Unread' },
    { key: 'communities', title: 'Communities' },
  ]);

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      const messages = await chatService.fetchMessages();
      setConversations(messages.map(m => ({
        id: m.id,
        name: m.sender_id === user?.id ? 'Me' : 'Instructor',
        message: m.content,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: 0,
        avatarColor: '#F3F4F6',
        system: false,
      })));
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadChats();

    const subscription = chatService.subscribeToGlobalChat((newMessage: any) => {
      setConversations(prev => [
        {
          id: newMessage.id,
          name: newMessage.sender_id === user?.id ? 'Me' : 'Instructor',
          message: newMessage.content,
          time: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: 1,
          avatarColor: '#F3F4F6',
          system: false,
        },
        ...prev
      ]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadChats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadChats();
  }, [loadChats]);

  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation =>
      conversation.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.message?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, conversations]);

  const handleChatPress = useCallback((id: string) => {
    router.push(`/chat/${id}`);
  }, [router]);

  const renderScene = useCallback(({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'all':
        return <AllChatsRoute conversations={filteredConversations} onPress={handleChatPress} refreshing={refreshing} onRefresh={onRefresh} />;
      case 'unread':
        return <UnreadRoute conversations={filteredConversations} onPress={handleChatPress} refreshing={refreshing} onRefresh={onRefresh} />;
      case 'communities':
        return <CommunitiesRoute conversations={filteredConversations} onPress={handleChatPress} refreshing={refreshing} onRefresh={onRefresh} />;
      default:
        return null;
    }
  }, [filteredConversations, handleChatPress, refreshing, onRefresh]);

  const renderTabBar = useCallback((props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: 'white' }}
      style={{ backgroundColor: '#8A2BE2' }}
      labelStyle={{ fontWeight: '700' }}
      activeColor={'#fff'}
      inactiveColor={'#E0B0FF'}
    />
  ), []);

  return (
    <View style={styles.container}>
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

        {loading && conversations.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8A2BE2" />
          </View>
        ) : (
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={renderTabBar}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 5 : 45,
    paddingBottom: 15,
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
    backgroundColor: '#22C55E',
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
    alignItems: 'flex-start',
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
  emptyContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
