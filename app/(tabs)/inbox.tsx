import { useAuth } from '@/src/context/AuthContext';
import { chatService } from '@/src/services/chatService';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
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

// Guest View Component for Unauthorized Users
const GuestView = ({ onGoToProfile }: { onGoToProfile: () => void }) => {
  return (
    <View style={styles.guestContainer}>
      <View style={styles.guestInner}>
        <Image
          source={require('@/assets/images/chatbox.png')}
          style={styles.guestImage}
          resizeMode="contain"
        />

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Follow these steps</Text>

          <View style={styles.timelineContainer}>
            {/* Step 1 */}
            <View style={styles.stepItem}>
              <View style={styles.badgeContainer}>
                <View style={[styles.stepBadge, { backgroundColor: '#8A2BE2' }]}>
                  <Text style={styles.badgeText}>1</Text>
                </View>
                <View style={styles.dashedLine} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepName}>Go to Profile</Text>
                <Text style={styles.stepDesc}>Tap on the Profile option located in the bottom navigation menu.</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.stepItem}>
              <View style={styles.badgeContainer}>
                <View style={[styles.stepBadge, { backgroundColor: '#8A2BE2' }]}>
                  <Text style={styles.badgeText}>2</Text>
                </View>
                <View style={styles.dashedLine} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepName}>Login Your Account</Text>
                <Text style={styles.stepDesc}>Enter your credentials in the profile section to login securely.</Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.stepItem}>
              <View style={styles.badgeContainer}>
                <View style={[styles.stepBadge, { backgroundColor: '#8A2BE2' }]}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepName}>View Your Inbox</Text>
                <Text style={styles.stepDesc}>Once logged in, all your Messages will be automatically displayed here.</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={onGoToProfile}
          activeOpacity={0.8}
          style={styles.profileButtonShadow}
        >
          <LinearGradient
            colors={['#8A2BE2', '#4B0082']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.profileButton}
          >
            <Text style={styles.profileButtonText}>Go to Profile</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Reusable Conversation Item Component
const ConversationItem = memo(({ item, onPress }: { item: any; onPress: (id: string) => void }) => {
  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatarContainer, { backgroundColor: item.avatarColor }]}>
        {item.avatar ? (
          <Image
            source={{ uri: item.avatar }}
            style={{ width: 52, height: 52, borderRadius: 26 }}
            resizeMode="cover"
          />
        ) : item.isGroup ? (
          <Ionicons name="people" size={24} color="#555" />
        ) : item.system ? (
          <Ionicons name="notifications" size={24} color="#555" />
        ) : (
          <Text style={styles.avatarInitials}>{item.name.charAt(0)}</Text>
        )}
        {item.online && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
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

const CommunitiesRoute = memo(({ conversations, onPress, refreshing, onRefresh }: { conversations: any[]; onPress: (id: string) => void; refreshing: boolean; onRefresh: () => void }) => (
  <FlatList
    data={conversations.filter((c) => c.isGroup)}
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

  // NOTE: isFocused can be used for manual refetch logic if needed, but per latest plan 
  // we primarily rely on mount/auth events to keep it simple.
  const isFocused = useIsFocused();

  const [searchQuery, setSearchQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'all', title: 'Chats' },
    { key: 'communities', title: 'Communities' },
  ]);

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  // Restore the format helper
  const formatConversation = useCallback((conv: any) => {
    const msg = conv.last_message || { content: '', created_at: null, sender_id: null };
    const isMe = msg.sender_id === user?.id;
    let timeStr = '';
    let timestamp = 0;
    try {
      const dateInput = msg.created_at || new Date().toISOString();
      const dateObj = new Date(dateInput);
      if (!isNaN(dateObj.getTime())) {
        timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timestamp = dateObj.getTime();
      } else {
        timeStr = 'Now';
        timestamp = Date.now();
      }
    } catch (e) {
      timeStr = '';
    }
    return {
      id: conv.id,
      name: conv.name || 'Group Chat',
      message: (isMe ? 'You: ' : '') + (msg.content || 'Tap to view'),
      time: timeStr,
      unread: conv.unread_count || 0,
      avatar: conv.avatar,
      avatarColor: '#F3F4F6',
      isGroup: !!conv.isGroup,
      timestamp: timestamp,
      system: false
    };
  }, [user?.id]);

  const loadChats = useCallback(async (showFullScreenLoading: boolean = true) => {
    if (!user) return;

    try {
      if (showFullScreenLoading && conversations.length === 0) {
        setLoading(true);
      } else {
        setRefreshing(true); // Silent background refresh or manual pull-to-refresh
      }

      console.log('🔄 [Inbox] Fetching conversations...');
      const inboxData = await chatService.fetchInboxConversations(user.id, (user as any).role || 'student');
      const mapped = inboxData.map(formatConversation);
      setConversations(mapped.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('❌ [Inbox] Error fetching chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, formatConversation, conversations.length]);

  // 1. Initial Load Effect
  useEffect(() => {
    if (!user) return;
    loadChats(true);
  }, [user?.id]); // Only run on mount or if user ID changes (Login/Logout)

  // 2. Realtime Subscription Effect
  useEffect(() => {
    if (!user) return;

    const subscription = chatService.subscribeToGlobalChat((newMessage: any) => {
      setConversations(prev => {
        const chatId = newMessage.group_id || newMessage.conversation_id;
        if (!chatId) return prev;
        const others = prev.filter(c => c.id !== chatId);
        const existing = prev.find(c => c.id === chatId);
        const isMe = newMessage.sender_id === user.id;
        const updatedConv = {
          id: chatId,
          name: existing?.name || newMessage.group_name || 'Community Chat',
          avatar: existing?.avatar,
          message: (isMe ? 'You: ' : '') + newMessage.content,
          time: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: isMe ? 0 : (existing?.unread || 0) + 1,
          avatarColor: '#F3F4F6',
          system: false,
          isGroup: existing?.isGroup || !!newMessage.group_id,
          timestamp: new Date(newMessage.created_at).getTime()
        };
        return [updatedConv, ...others];
      });
    });

    return () => {
      (async () => {
        try {
          const { supabase } = await import('@/src/lib/supabase');
          await supabase.removeChannel(subscription);
        } catch (err) {
          // Ignore clean up errors
        }
        // Local unsubscribe if method exists on the object
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      })();
    };
  }, [user?.id]);

  const onRefresh = useCallback(() => {
    loadChats(false);
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
      <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Inbox</Text>
      </View>
      <View style={styles.contentArea}>
        {!user ? (
          <GuestView onGoToProfile={() => router.push('/profile')} />
        ) : (
          <>
            <View style={styles.searchSection}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9BA3AF" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#9BA3AF"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#9BA3AF" />
                  </TouchableOpacity>
                )}
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
          </>
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
  guestContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  guestInner: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 40,
  },
  guestImage: {
    width: 180,
    height: 150,
    marginBottom: 30,
  },
  stepsCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 30,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  timelineContainer: {
    paddingLeft: 5,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  badgeContainer: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  dashedLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#E5E7EB',
    height: 25,
    position: 'absolute',
    top: 24,
    zIndex: 1,
  },
  stepContent: {
    flex: 1,
    paddingTop: 0,
  },
  stepName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8A2BE2',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  profileButtonShadow: {
    width: '80%',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  profileButton: {
    width: '100%',
    height: 48,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 5 : 45,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#8A2BE2',
  },
  headerIcon: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  contentArea: {
    flex: 1,
  },
  searchSection: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 52,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginHorizontal: 16,
    marginVertical: 12,
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
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 20,
    marginRight: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 2,
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
    marginBottom: 4,
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
