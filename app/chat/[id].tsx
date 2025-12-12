import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';

type Message = {
  id: string;
  text: string;
  from: 'me' | 'other';
};

// Mock data - in a real app, you'd fetch this based on the ID
const conversationDetails: { [key: string]: any } = {
  '1': {
    name: 'Dr. Sarah Smith',
    online: true,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop',
    messages: [
      { id: 'a', text: 'Hello! How can I help you with your project?', from: 'other' },
      { id: 'b', text: "Hi Dr. Smith. I'm having trouble with the Redux implementation.", from: 'me' },
      { id: 'c', text: "Don't forget about the live session today! We will be covering Redux state management in depth.", from: 'other' },
    ],
  },
  '2': {
    name: 'Support Team',
    online: false,
    lastSeen: '1h ago',
    avatar: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=2069&auto=format&fit=crop',
    messages: [
        { id: 'f', text: 'Your ticket #492 has been resolved. Please let us know if you need anything else.', from: 'other' },
    ],
  },
  '3': {
    name: 'John Doe',
    online: false,
    lastSeen: '5m ago',
    avatar: 'https://images.unsplash.com/photo-1547425260-76bc4ddd9f32?q=80&w=2070&auto=format&fit=crop',
    messages: [
      { id: 'd', text: 'Hey, can you help me with the assignment? I am stuck on the third problem.', from: 'other' },
      { id: 'e', text: 'Sure, which part are you struggling with?', from: 'me' },
    ],
  },
  '4': {
    name: 'Course System',
    online: true,
    system: true,
    avatar: 'https://images.unsplash.com/photo-1636772523547-5577d04e8dc1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y291cnNlJTIwc3lzdGVtfGVufDB8fDB8fHww',
    messages: [
        { id: 'g', text: 'New materials have been added to Python 101. Check out the new module on Decorators.', from: 'other' },
    ],
  },
  '5': {
    name: 'Emily Chen',
    online: true,
    avatar: 'https://images.unsplash.com/photo-1602233158242-3ba0ac4d2167?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z2lybHxlbnwwfHwwfHx8MA%3D%3D',
    messages: [
        { id: 'h', text: "Thanks for the notes! They were super helpful for the exam prep.", from: 'other' },
    ],
  }
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
  const { id } = params;
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const chatPartner = conversationDetails[id as string] || { name: 'Unknown', messages: [], online: false, avatar: '' };

  useEffect(() => {
    // Set initial messages
    if (chatPartner.messages) {
        setMessages([...chatPartner.messages].reverse()); // Reverse for flatlist
    }
    // Scroll to bottom on initial load
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  }, [id, chatPartner.messages]);

  const handleSend = () => {
    if (inputText.trim().length > 0) {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        text: inputText,
        from: 'me',
      };
      setMessages(prevMessages => [newMessage, ...prevMessages]);
      setInputText('');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.from === 'me';
    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Image source={{ uri: chatPartner.avatar }} style={styles.headerAvatar} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>{chatPartner.name}</Text>
          <Text style={styles.headerStatus}>{chatPartner.online ? 'Online' : `Last seen ${chatPartner.lastSeen}`}</Text>
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
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          inverted // Typical for chat interfaces
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
