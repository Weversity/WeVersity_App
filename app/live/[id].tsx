import { supabase } from '@/src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const getInitials = (firstName: string = '', lastName: string = '') => {
  const f = firstName ? firstName.charAt(0).toUpperCase() : '';
  const l = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${f}${l}` || '?';
};

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

const LiveClassScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchSessionData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select(`
          *,
          course:courses(
            id,
            title,
            instructor:profiles(
              id,
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setSession(data);

      // Fetch initial likes
      const { count: likesCount } = await supabase
        .from('live_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', id)
        .eq('type', 'like');

      setLikes(likesCount || 0);

      // Fetch initial chat
      const { data: messages } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profile:profiles(first_name, last_name, avatar_url)
        `)
        .eq('session_id', id)
        .order('created_at', { ascending: false });

      setCommentsList(messages || []);

      // Check if user has already liked
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        setCurrentUser(userData.user);
        const { data: likeData } = await supabase
          .from('live_interactions')
          .select('id')
          .eq('session_id', id)
          .eq('user_id', userData.user.id)
          .eq('type', 'like')
          .maybeSingle();

        setIsLiked(!!likeData);
      }

    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSessionData();

    // Subscribe to interactions (likes)
    const interactionSubscription = supabase
      .channel(`live_interactions:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_interactions',
          filter: `session_id=eq.${id}`
        },
        async () => {
          const { count } = await supabase
            .from('live_interactions')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', id)
            .eq('type', 'like');
          setLikes(count || 0);
        }
      )
      .subscribe();

    // Subscribe to chat
    const chatSubscription = supabase
      .channel(`chat_messages:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${id}`
        },
        async (payload) => {
          // Fetch the profile for the new message
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage: Comment = {
            ...payload.new as any,
            profile: profileData || undefined
          };
          setCommentsList(prev => [newMessage, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(interactionSubscription);
      supabase.removeChannel(chatSubscription);
    };
  }, [id, fetchSessionData]);

  const handleLike = async () => {
    if (!currentUser) return;

    try {
      if (isLiked) {
        await supabase
          .from('live_interactions')
          .delete()
          .eq('session_id', id)
          .eq('user_id', currentUser.id)
          .eq('type', 'like');
        setIsLiked(false);
      } else {
        await supabase
          .from('live_interactions')
          .insert({
            session_id: id,
            user_id: currentUser.id,
            type: 'like'
          });
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !currentUser) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: id,
          user_id: currentUser.id,
          content: commentText.trim()
        });

      if (error) throw error;
      setCommentText('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const username = `${item.profile?.first_name || ''} ${item.profile?.last_name || ''}`.trim() || 'User';
    const initials = getInitials(item.profile?.first_name, item.profile?.last_name);

    return (
      <View style={styles.commentItem}>
        {item.profile?.avatar_url ? (
          <Image source={{ uri: item.profile.avatar_url }} style={styles.commentAvatarImage} />
        ) : (
          <View style={[styles.commentAvatarImage, styles.initialsCircle, { width: 36, height: 36, borderRadius: 18 }]}>
            <Text style={[styles.initialsText, { fontSize: 14 }]}>{initials}</Text>
          </View>
        )}
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentUsername}>{username}</Text>
            <Text style={styles.commentTimestamp}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <Text style={styles.commentText}>{item.content}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Live session not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const instructor = session.course?.instructor || {};
  const instructorName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || 'Instructor';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background Video */}
      {session.meeting_url ? (
        <Video
          source={{ uri: session.meeting_url }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted={false}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="videocam-off" size={60} color="#333" />
          <Text style={{ color: '#666', marginTop: 10 }}>Stream unavailable</Text>
        </View>
      )}

      {/* Main Overlay */}
      <SafeAreaView style={styles.overlay}>
        {/* Header - Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* Bottom Content Wrapper */}
        <View style={styles.bottomWrapper}>
          {/* Instructor Info - Bottom Left */}
          <View style={styles.instructorContainer}>
            <View style={styles.instructorProfileRow}>
              {instructor.avatar_url ? (
                <Image source={{ uri: instructor.avatar_url }} style={styles.instructorAvatar} />
              ) : (
                <View style={[styles.instructorAvatar, styles.initialsCircle]}>
                  <Text style={styles.initialsText}>{getInitials(instructor.first_name, instructor.last_name)}</Text>
                </View>
              )}
              <View style={styles.instructorTextContainer}>
                <View style={styles.liveBadgeRow}>
                  <Text style={styles.instructorName}>{instructorName}</Text>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                </View>
                <Text style={styles.courseTitle} numberOfLines={1}>{session.course?.title}</Text>
              </View>
            </View>
          </View>

          {/* Right Side Actions */}
          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <View style={[styles.iconWrapper, isLiked && styles.iconWrapperActive]}>
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={30} color={isLiked ? "#FF0050" : "white"} />
              </View>
              <Text style={styles.actionCount}>{likes >= 1000 ? (likes / 1000).toFixed(1) + 'k' : likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => setShowComments(true)}>
              <View style={styles.iconWrapper}>
                <Ionicons name="chatbubble-ellipses" size={28} color="white" />
              </View>
              <Text style={styles.actionCount}>{commentsList.length}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.iconWrapper}>
                <Ionicons name="share-social" size={28} color="white" />
              </View>
              <Text style={styles.actionCount}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Chat Modal */}
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
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>{commentsList.length} Comments</Text>
                <TouchableOpacity onPress={() => setShowComments(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={commentsList}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              style={styles.commentsList}
              showsVerticalScrollIndicator={false}
              inverted={false}
            />

            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Support with a comment..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                onPress={handleSubmitComment}
                disabled={!commentText.trim()}
                style={[styles.sendButton, !commentText.trim() && { opacity: 0.5 }]}
              >
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    padding: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  instructorContainer: {
    flex: 1,
    marginRight: 60,
  },
  instructorProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#8A2BE2',
  },
  instructorTextContainer: {
    flex: 1,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  instructorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  liveBadge: {
    backgroundColor: '#FF0050',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  courseTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  rightActions: {
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconWrapperActive: {
    borderColor: 'rgba(255, 0, 80, 0.3)',
  },
  actionCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  commentSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: SCREEN_HEIGHT * 0.75,
  },
  sheetHeader: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  commentsList: {
    flex: 1,
    padding: 16,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  commentAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  commentTimestamp: {
    fontSize: 11,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  initialsCircle: {
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default LiveClassScreen;
