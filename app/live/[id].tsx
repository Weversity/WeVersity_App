import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock data for multiple instructors with local images
const mockLiveStreams = [
  {
    id: '1',
    instructorName: 'Priscilla Ehrman',
    role: 'UI Designer',
    courseTitle: 'Web Development Masterclass',
    imageSource: require('@/assets/images/liveone.jpg'),
    profileImage: require('@/assets/images/liveone.jpg'),
  },
  {
    id: '2',
    instructorName: 'John Anderson',
    role: 'Senior Developer',
    courseTitle: 'Advanced JavaScript',
    imageSource: require('@/assets/images/livetwo.jpg'),
    profileImage: require('@/assets/images/livetwo.jpg'),
  },
  {
    id: '3',
    instructorName: 'Sarah Mitchell',
    role: 'React Expert',
    courseTitle: 'React Native Development',
    imageSource: require('@/assets/images/livethree.jpg'),
    profileImage: require('@/assets/images/livethree.jpg'),
  },
];

interface Comment {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  likes: number;
  replies: number;
}

interface LiveStreamItemProps {
  item: typeof mockLiveStreams[0];
  isActive: boolean;
}

const LiveStreamItem: React.FC<LiveStreamItemProps> = ({ item, isActive }) => {
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<Comment[]>([
    {
      id: '1',
      username: 'Sarah Johnson',
      text: 'Great explanation! This helps a lot 👍',
      timestamp: '2 hours ago',
      likes: 245,
      replies: 12,
    },
    {
      id: '2',
      username: 'Mike Chen',
      text: 'Can you explain the difference between const and let?',
      timestamp: '1 hour ago',
      likes: 89,
      replies: 5,
    },
  ]);

  const handleLike = () => {
    if (isLiked) {
      setLikes(likes - 1);
      setIsLiked(false);
    } else {
      setLikes(likes + 1);
      setIsLiked(true);
      if (isDisliked) {
        setDislikes(dislikes - 1);
        setIsDisliked(false);
      }
    }
  };

  const handleDislike = () => {
    if (isDisliked) {
      setDislikes(dislikes - 1);
      setIsDisliked(false);
    } else {
      setDislikes(dislikes + 1);
      setIsDisliked(true);
      if (isLiked) {
        setLikes(likes - 1);
        setIsLiked(false);
      }
    }
  };

  const handleCommentPress = () => {
    setShowComments(true);
  };

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      const newComment: Comment = {
        id: Date.now().toString(),
        username: 'You',
        text: commentText.trim(),
        timestamp: 'Just now',
        likes: 0,
        replies: 0,
      };
      setCommentsList([newComment, ...commentsList]);
      setCommentText('');
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        <Ionicons name="person-circle" size={40} color="#8A2BE2" />
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername}>{item.username}</Text>
          <Text style={styles.commentTimestamp}>{item.timestamp}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.commentAction}>
            <Ionicons name="heart-outline" size={16} color="#666" />
            <Text style={styles.commentActionText}>{item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.commentAction}>
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.commentActionText}>Reply</Text>
          </TouchableOpacity>
          {item.replies > 0 && (
            <TouchableOpacity>
              <Text style={styles.viewRepliesText}>View {item.replies} replies</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.streamContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {/* Background Image */}
      <Image
        source={item.imageSource}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <View style={styles.overlay}>
        <SafeAreaView style={styles.contentContainer}>
          {/* Instructor Info */}
          <View style={styles.userInfo}>
            <Image
              source={item.profileImage}
              style={styles.profileImage}
            />
            <View style={styles.userTextInfo}>
              <Text style={styles.userName}>{item.instructorName}</Text>
              <Text style={styles.userRole}>{item.role}</Text>
              <Text style={styles.courseTitle}>{item.courseTitle}</Text>
            </View>
          </View>

          {/* Right Actions */}
          <View style={styles.rightActions}>
            {/* Like Button */}
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={35}
                color={isLiked ? '#FF0050' : 'white'}
              />
              <Text style={styles.actionLabel}>{likes}</Text>
            </TouchableOpacity>

            {/* Dislike Button */}
            <TouchableOpacity style={styles.actionButton} onPress={handleDislike}>
              <Ionicons
                name={isDisliked ? 'heart-dislike' : 'heart-dislike-outline'}
                size={35}
                color={isDisliked ? '#FF0050' : 'white'}
              />
              <Text style={styles.actionLabel}>{dislikes}</Text>
            </TouchableOpacity>

            {/* Comment Button */}
            <TouchableOpacity style={styles.actionButton} onPress={handleCommentPress}>
              <Ionicons name="chatbubble-outline" size={35} color="white" />
              <Text style={styles.actionLabel}>{commentsList.length}</Text>
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-social-outline" size={35} color="white" />
              <Text style={styles.actionLabel}>Share</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* YouTube-Style Comment Bottom Sheet */}
      <Modal
        visible={showComments}
        transparent
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowComments(false)}
          />
          <View style={styles.commentSheet}>
            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>{commentsList.length.toLocaleString()} comments</Text>
                <TouchableOpacity onPress={() => setShowComments(false)}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Comments List */}
            <FlatList
              data={commentsList}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              style={styles.commentsList}
              showsVerticalScrollIndicator={false}
            />

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              <View style={styles.commentInputWrapper}>
                <Ionicons name="person-circle" size={36} color="#8A2BE2" />
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add comment..."
                  placeholderTextColor="#999"
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
                <TouchableOpacity
                  style={styles.emojiButton}
                  onPress={() => { }}
                >
                  <Ionicons name="happy-outline" size={24} color="#666" />
                </TouchableOpacity>
                {commentText.trim().length > 0 && (
                  <TouchableOpacity
                    style={styles.sendIconButton}
                    onPress={handleSubmitComment}
                  >
                    <Ionicons name="send" size={20} color="#8A2BE2" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const LiveClassScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <SafeAreaView style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
      </SafeAreaView>

      <FlatList
        ref={flatListRef}
        data={mockLiveStreams}
        renderItem={({ item, index }) => (
          <LiveStreamItem item={item} isActive={index === currentIndex} />
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  streamContainer: {
    height: SCREEN_HEIGHT,
    width: '100%',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 15,
  },
  rightActions: {
    position: 'absolute',
    right: 15,
    bottom: 100,
    alignItems: 'center',
    gap: 25,
  },
  actionButton: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  actionLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  userInfo: {
    position: 'absolute',
    bottom: 80,
    left: 15,
    right: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
  },
  userTextInfo: {
    flex: 1,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 1,
  },
  userRole: {
    color: 'white',
    fontSize: 13,
    marginBottom: 4,
    opacity: 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 1,
  },
  courseTitle: {
    color: 'white',
    fontSize: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 1,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    marginTop: 40,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal & Comment Sheet Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  commentSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: SCREEN_HEIGHT * 0.9,
    paddingBottom: 20,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
    minHeight: SCREEN_HEIGHT * 0.6,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentAvatar: {
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  viewRepliesText: {
    fontSize: 13,
    color: '#8A2BE2',
    fontWeight: '600',
  },
  commentInputContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  emojiButton: {
    padding: 5,
  },
  sendIconButton: {
    padding: 5,
  },
});

export default LiveClassScreen;
