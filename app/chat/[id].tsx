import { useAuth } from '@/src/context/AuthContext';
import { chatService } from '@/src/services/chatService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
  const [inputHeight, setInputHeight] = useState(40);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Group Info State
  const [groupInfo, setGroupInfo] = useState<ChatGroup>({ id: '', name: 'Loading...', image: null });
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [infoVisible, setInfoVisible] = useState(false);

  // Message Options State
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [optionsVisible, setOptionsVisible] = useState(false);

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

    const subscription = chatService.subscribeToConversation(id as string, 'group', (payload: any) => {
      const { event, new: newMessage, old: oldMessage } = payload;

      if (event === 'INSERT') {
        setMessages(prevMessages => {
          // 1. If ID already exists, ignore
          if (prevMessages.some(msg => msg.id === newMessage.id)) {
            return prevMessages;
          }

          const combined = [...prevMessages, newMessage];
          return combined.filter((msg, index, self) =>
            index === self.findIndex((m) => m.id === msg.id)
          );
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      } else if (event === 'DELETE') {
        setMessages(prev => prev.filter(msg => msg.id !== oldMessage.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  const handleSend = async () => {
    if (inputText.trim().length > 0 && user && id) {
      const messageContent = inputText.trim();
      const tempId = `temp-${user.id}-${Date.now()}`;
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
          setMessages(prev => {
            // Check if this real message already arrived via subscription
            const alreadyExists = prev.some(msg => msg.id === realMessage.id);
            if (alreadyExists) {
              // If it exists, just remove the temp message
              return prev.filter(msg => msg.id !== tempId);
            }
            // Otherwise replace temp with real
            return prev.map(msg => msg.id === tempId ? realMessage : msg);
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempId));
      }
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setIsUploading(true);

        try {
          const publicUrl = await chatService.uploadAttachment(asset.uri);

          if (publicUrl && id && user) {
            await chatService.sendConversationMessage(id as string, user.id, publicUrl);
          }
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          Alert.alert('Upload Error', 'Failed to upload file. Please check your internet.');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('Error', 'Something went wrong while picking the image.');
    }
  };

  const handleOpenMenu = async (message: Message) => {
    const isMyMessage = user && message.sender_id === user.id;
    if (!isMyMessage) return;

    // Trigger Medium Haptic Feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setSelectedMessage(message);
    setOptionsVisible(true);
  };

  const handleCopy = (content: string) => {
    Clipboard.setString(content);
    setOptionsVisible(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    // Optimistic UI Update
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    setOptionsVisible(false);

    try {
      await chatService.deleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Failed to delete message.');
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
    const isSelected = selectedMessage?.id === item.id && optionsVisible;

    // Check if content is an image URL (simple check)
    const isImage = item.content && (item.content.match(/\.(jpeg|jpg|gif|png|webp)$/i) || item.content.includes('supabase.co/storage/v1/object/public/chat-attachments'));
    const isVideo = item.content && (item.content.match(/\.(mp4|mov|m4v)$/i) || (item.content.includes('chat-attachments') && item.content.includes('video')));

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleOpenMenu(item)}
        style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessage : styles.theirMessage,
          isSelected && styles.selectedBubble
        ]}
      >
        <View style={styles.messageContentContainer}>
          {isImage ? (
            <Image
              source={{ uri: item.content }}
              style={{ width: 200, height: 200, borderRadius: 10 }}
              resizeMode="cover"
            />
          ) : isVideo ? (
            <View style={{ width: 200, height: 120, borderRadius: 10, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="play-circle" size={50} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, marginTop: 5 }}>Video Attachment</Text>
            </View>
          ) : (
            <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
              {item.content}
            </Text>
          )}

          {isMyMessage && (
            <View style={styles.messageStatusContainer}>
              <Ionicons
                name="chevron-down"
                size={12}
                color={isMyMessage ? "rgba(255,255,255,0.5)" : "#CCC"}
                style={{ marginLeft: 4 }}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
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
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={0}
      >
        <View style={styles.chatBody}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8A2BE2" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item, index) => item.id ? item.id.toString() : `index-${index}-${Date.now()}`}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>

        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={pickImage}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#8A2BE2" />
              ) : (
                <Ionicons name="add" size={28} color="#555" />
              )}
            </TouchableOpacity>
            <TextInput
              style={[styles.textInput, { height: Math.max(40, inputHeight) }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              multiline
              editable={!isUploading}
              onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
              onBlur={() => setInputHeight(40)}
            />
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleSend}
              disabled={isUploading || inputText.trim().length === 0}
            >
              <Ionicons name="send" size={24} color={isUploading || inputText.trim().length === 0 ? "#CCC" : "#8A2BE2"} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <GroupInfoModal
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        group={groupInfo}
        members={members}
        onLeave={handleLeaveGroup}
      />

      {/* Message Options Bottom Sheet */}
      <Modal
        visible={optionsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOptionsVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setOptionsVisible(false)}
        >
          <View style={styles.actionSheetContainer}>
            <View style={styles.actionSheetHandle} />

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => selectedMessage && handleCopy(selectedMessage.content)}
            >
              <Ionicons name="copy-outline" size={22} color="#555" />
              <Text style={styles.actionText}>Copy Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionItem, styles.deleteAction]}
              onPress={() => selectedMessage && handleDeleteMessage(selectedMessage.id)}
            >
              <Ionicons name="trash-outline" size={22} color="#FF4444" />
              <Text style={[styles.actionText, styles.deleteText]}>Delete Message</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#8A2BE2', // Solid Purple for System Area
  },
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  chatBody: {
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
    paddingBottom: 0,
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 8,
    maxWidth: '80%',
    position: 'relative',
  },
  selectedBubble: {
    backgroundColor: '#9D50EE', // Slightly lighter highlight for my message
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
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
  messageContentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageStatusContainer: {
    alignSelf: 'flex-end',
    marginBottom: -2,
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
  inputWrapper: {
    backgroundColor: '#8A2BE2', // Purple Bottom Area
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    marginBottom: -1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 30,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    fontSize: 16,
    marginHorizontal: 5,
  },
  iconButton: {
    padding: 8,
  },
  // Action Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
  },
  actionSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#DDD',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionText: {
    fontSize: 17,
    color: '#333',
    marginLeft: 15,
    fontWeight: '500',
  },
  deleteAction: {
    borderBottomWidth: 0, // Last item
  },
  deleteText: {
    color: '#FF4444',
  },
});
