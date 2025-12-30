import { useAuth } from '@/src/context/AuthContext';
import { chatService } from '@/src/services/chatService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  conversation_id?: string;
};

type ChatPartner = {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  lastSeen?: string;
};

const ChatMenu = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  if (!visible) return null;

  const menuOptions = [
    { id: '1', title: 'View Contact', icon: 'person-circle-outline' },
    { id: '2', title: 'Media, links, and docs', icon: 'folder-outline' },
    { id: '3', title: 'Search', icon: 'search-outline' },
    { id: '4', title: 'Mute notifications', icon: 'notifications-off-outline' },
    { id: '5', title: 'Wallpaper', icon: 'image-outline' },
  ];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.menuOverlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.menuContent}>
          {menuOptions.map(option => (
            <TouchableOpacity key={option.id} style={styles.menuOption}>
              <Ionicons name={option.icon as any} size={22} color="#333" />
              <Text style={styles.menuOptionText}>{option.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};


export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params; // This is the conversation_id
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatPartner, setChatPartner] = useState<ChatPartner>({
    id: '',
    name: 'Loading...',
    avatar: '',
    online: false,
  });

  // Fetch messages and chat partner info
  useEffect(() => {
    const loadChatData = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Fetch messages for this conversation
        const conversationMessages = await chatService.fetchConversationMessages(id as string);
        setMessages(conversationMessages);

        // Determine chat partner ID from messages
        if (conversationMessages.length > 0 && user) {
          const partnerMessage = conversationMessages.find(msg => msg.sender_id !== user.id);
          const partnerId = partnerMessage?.sender_id;

          if (partnerId) {
            const partnerProfile = await chatService.fetchChatPartner(partnerId);
            if (partnerProfile) {
              setChatPartner({
                id: partnerProfile.id,
                name: `${partnerProfile.first_name || ''} ${partnerProfile.last_name || ''}`.trim() || 'Unknown User',
                avatar: partnerProfile.avatar_url || 'https://via.placeholder.com/100',
                online: false, // You can add online status logic later
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChatData();

    // Scroll to bottom on initial load
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  }, [id, user]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!id) return;

    const subscription = chatService.subscribeToConversation(id as string, (newMessage: Message) => {
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  const handleSend = async () => {
    if (inputText.trim().length > 0 && user && id) {
      const messageContent = inputText.trim();
      setInputText('');

      // Optimistically add message to UI
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        sender_id: user.id,
        created_at: new Date().toISOString(),
        conversation_id: id as string,
      };
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      try {
        // Send message to Supabase
        await chatService.sendConversationMessage(id as string, user.id, messageContent);
      } catch (error) {
        console.error('Error sending message:', error);
        // Remove optimistic message on error
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessage.id));
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = user && item.sender_id === user.id;
    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        <Text style={styles.messageText}>{item.content}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerName}>Loading...</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          {chatPartner.avatar ? (
            <Image source={{ uri: chatPartner.avatar }} style={styles.headerAvatar} />
          ) : null}
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>{chatPartner.name}</Text>
          <Text style={styles.headerStatus}>{chatPartner.online ? 'Online' : `Last seen ${chatPartner.lastSeen || 'recently'}`}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="videocam-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="call-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={() => setMenuVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item.id || `msg-${index}`}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="add" size={28} color="#555" />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
          />
          <TouchableOpacity style={styles.iconButton} onPress={handleSend}>
            <Ionicons name="send" size={24} color="#8A2BE2" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <ChatMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#8A2BE2', // Purple header color
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F7FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 45,
    backgroundColor: '#8A2BE2',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 10,
  },
  headerName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  headerStatus: {
    color: '#E0E0E0',
    fontSize: 13,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 8,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#E1E1E1',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  theirMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#F4F7FC',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
    marginHorizontal: 8,
  },
  iconButton: {
    padding: 5,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  menuContent: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 60,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  menuOptionText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
});
