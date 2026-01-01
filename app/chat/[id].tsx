import { useAuth } from '@/src/context/AuthContext';
import { chatService } from '@/src/services/chatService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  group_id?: string;
};

type ChatGroup = {
  id: string;
  name: string;
  image: string | null;
  description?: string;
};

type GroupMember = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
};

const GroupInfoModal = ({
  visible,
  onClose,
  group,
  members,
  onLeave
}: {
  visible: boolean;
  onClose: () => void;
  group: ChatGroup;
  members: GroupMember[];
  onLeave: () => void;
}) => {
  // Safe helper to get first char
  const getFirstChar = (str?: string) => (str || 'C').charAt(0).toUpperCase();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Group Info</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* Group Header */}
          <View style={styles.groupInfoSection}>
            <View style={styles.groupImageContainer}>
              {group?.image ? (
                <Image source={{ uri: group.image }} style={styles.largeGroupImage} />
              ) : (
                <View style={[styles.largeGroupImage, styles.placeholderGroupImage]}>
                  <Text style={styles.placeholderGroupText}>{getFirstChar(group?.name)}</Text>
                </View>
              )}
            </View>
            <Text style={styles.groupNameLarge}>{group?.name || 'Community Chat'}</Text>
            <Text style={styles.memberCount}>{members?.length || 0} Members</Text>
          </View>

          {/* Participants List */}
          <View style={styles.participantsSection}>
            <Text style={styles.sectionHeader}>PARTICIPANTS {members?.length ? `(${members.length})` : ''}</Text>
            {members?.map((member) => (
              <View key={member.id} style={styles.memberItem}>
                <View style={styles.memberAvatarContainer}>
                  {member?.avatar ? (
                    <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                  ) : (
                    <View style={[styles.memberAvatar, styles.placeholderMemberAvatar]}>
                      <Text style={styles.placeholderMemberText}>{getFirstChar(member?.name)}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member?.name || 'Unknown User'}</Text>
                  <View style={[styles.roleBadge, member?.role === 'instructor' || member?.role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeStudent]}>
                    <Text style={[styles.roleText, member?.role === 'instructor' || member?.role === 'admin' ? styles.roleTextAdmin : styles.roleTextStudent]}>
                      {member?.role || 'Student'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Leave Button */}
          <View style={styles.footerActionContainer}>
            <TouchableOpacity style={styles.leaveButton} onPress={onLeave}>
              <Ionicons name="log-out-outline" size={20} color="#FF4444" />
              <Text style={styles.leaveButtonText}>Leave Group</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params; // This is the group_id
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  // Group Info State
  const [groupInfo, setGroupInfo] = useState<ChatGroup>({ id: '', name: 'Loading...', image: null });
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [infoVisible, setInfoVisible] = useState(false);

  // Fetch data
  useEffect(() => {
    const loadChatData = async () => {
      if (!id) return;

      try {
        setLoading(true);

        const [conversationMessages, details, groupMembers] = await Promise.all([
          chatService.fetchConversationMessages(id as string),
          chatService.fetchGroupDetails(id as string),
          chatService.fetchGroupMembers(id as string)
        ]);

        setMessages(conversationMessages || []);

        if (details) {
          setGroupInfo({
            id: details.id,
            name: details.name,
            image: details.image,
            description: details.description
          });
        }

        setMembers(groupMembers || []);

      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChatData();
  }, [id]);

  // Real-time subscription
  useEffect(() => {
    if (!id) return;

    const subscription = chatService.subscribeToConversation(id as string, 'group', (newMessage: Message) => {
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
      const tempId = `temp-${Date.now()}`;
      setInputText('');

      const tempMessage: Message = {
        id: tempId,
        content: messageContent,
        sender_id: user.id,
        created_at: new Date().toISOString(),
        group_id: id as string,
      };
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      try {
        const realMessage = await chatService.sendConversationMessage(id as string, user.id, messageContent);
        if (realMessage) {
          setMessages(prev => prev.map(msg => msg.id === tempId ? realMessage : msg));
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempId));
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (!user || !id) return;

    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            const success = await chatService.leaveGroup(id as string, user.id);
            if (success) {
              setInfoVisible(false);
              router.back();
            } else {
              Alert.alert("Error", "Failed to leave group.");
            }
          }
        }
      ]
    );
  };


  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = user && item.sender_id === user.id;

    // Check if content is an image URL (simple check)
    const isImage = item.content && (item.content.match(/\.(jpeg|jpg|gif|png|webp)$/i) || item.content.startsWith('http'));

    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        {isImage ? (
          <Image
            source={{ uri: item.content }}
            style={{ width: 200, height: 200, borderRadius: 10 }}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
            {item.content}
          </Text>
        )}
      </View>
    );
  };

  const getHeaderChar = (name?: string) => (name || 'C').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeftContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerGroupInfo}>
            <View style={styles.headerAvatarContainer}>
              {groupInfo?.image ? (
                <Image source={{ uri: groupInfo.image }} style={styles.headerAvatar} />
              ) : (
                <View style={[styles.headerAvatar, styles.placeholderHeaderAvatar]}>
                  <Text style={styles.placeholderHeaderText}>
                    {getHeaderChar(groupInfo?.name)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {groupInfo?.name || 'Loading...'}
              </Text>
              <View style={styles.activeStatusContainer}>
                <View style={styles.activeDot} />
                <Text style={styles.activeStatusText}>Active Community</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={() => setInfoVisible(true)} style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8A2BE2" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => item.id || `msg-${index}`}
            contentContainerStyle={styles.listContent}
          />
        )}

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

      <GroupInfoModal
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        group={groupInfo}
        members={members}
        onLeave={handleLeaveGroup}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#8A2BE2', // Solid Purple for System Area
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
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#8A2BE2', // Purple Header
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerGroupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatarContainer: {
    marginRight: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0B0FF',
  },
  placeholderHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0B0FF',
  },
  placeholderHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  activeStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 4,
  },
  activeStatusText: {
    fontSize: 11,
    color: '#E0E0E0',
    fontWeight: '500',
    opacity: 0.8,
  },
  infoButton: {
    padding: 4,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingBottom: 40,
  },
  groupInfoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  groupImageContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  largeGroupImage: {
    width: 100,
    height: 100,
    borderRadius: 50, // Circle
    backgroundColor: '#f0f0f0',
  },
  placeholderGroupImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8A2BE2', // Solid purple for modal fallback
  },
  placeholderGroupText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#fff', // White text
  },
  groupNameLarge: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  memberCount: {
    fontSize: 14,
    color: '#888',
  },
  footerActionContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFEEEE',
  },
  leaveButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  participantsSection: {
    paddingHorizontal: 20,
    flex: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    marginBottom: 16,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberAvatarContainer: {
    marginRight: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
  },
  placeholderMemberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  placeholderMemberText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#555',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeAdmin: {
    backgroundColor: '#E8F0FE', // Light blue
  },
  roleBadgeStudent: {
    backgroundColor: '#F3F4F6', // Light gray
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  roleTextAdmin: {
    color: '#1A73E8',
  },
  roleTextStudent: {
    color: '#6B7280',
  },

  // Chat List
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 20,
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 8,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#8A2BE2', // Purple for my messages
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  theirMessage: {
    backgroundColor: '#fff', // White for their messages
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: '#fff', // White text for my messages
  },
  theirMessageText: {
    color: '#333', // Dark text for their messages
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
});
