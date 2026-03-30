// @ts-ignore
import { supabase } from '@/src/auth/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { chatService } from '@/src/services/chatService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SectionList, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ReactNativeModal from 'react-native-modal';


// Mapping of notification types to badge icons
const badgeIconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  enrollment: 'school',
  announcement: 'megaphone',
  comment: 'chatbubble',
  course_approval: 'checkmark-circle',
  message: 'mail',
  payment: 'wallet',
  quiz_completion: 'trophy-outline',
  course_rating: 'star-outline',
  chat_invitation: 'chatbubbles',
  message_request: 'chatbubbles',
  request_accepted: 'checkmark-done-circle',
  request_declined: 'close-circle',
  new_follower: 'person-add',
  follow_back: 'people',
  live_now: 'videocam',
  upcoming_event: 'calendar',
  default: 'notifications',
};

// Enhanced Notification Type with actor and course data
interface Notification {
  id: string;
  recipient_id: string;
  content: string | { message?: string; title?: string; body?: string };
  type: string;
  actor_id?: string;
  course_id?: string;
  created_at: string;
  actor?: {
    id?: string;
    avatar_url?: string;
    first_name?: string;
    last_name?: string;
  };
  course?: {
    title?: string;
  };
  is_dummy?: boolean;
}


// Get relative time string (e.g., "2 days ago", "1 hour ago")
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

const groupNotificationsByDate = (notifications: Notification[]) => {
  const groups: { [key: string]: Notification[] } = {};

  notifications.forEach(notification => {
    const notificationDate = new Date(notification.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key;
    if (notificationDate.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (notificationDate.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = notificationDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(notification);
  });

  return Object.keys(groups).map(key => ({
    title: key,
    data: groups[key],
  }));
};

const NotificationScreen = () => {
  const router = useRouter();
  const { user, setUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customDays, setCustomDays] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Requests'>('All');
  const [actionStates, setActionStates] = useState<{ [key: string]: { status: 'Accepted' | 'Declined', time: string } }>({});

  const REQUEST_TYPES = ['chat_invitation', 'message_request'];


  // Reset unread count when screen is opened
  useEffect(() => {
    const markAsRead = async () => {
      if (!user) return;
      // Optimistic UI update
      setUnreadCount(0);

      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
          .eq('read', false);
      } catch (err) {
        console.error('Error marking notifications as read:', err);
      }
    };

    markAsRead();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications with actor and course data
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            *,
            actor:profiles!actor_id(id, avatar_url, first_name, last_name),
            course:courses(title, id)
          `)
          .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          const initialActions: any = {};
          data.forEach(n => {
            let parsedContent: any = n.content;
            if (typeof n.content === 'string') {
              try { parsedContent = JSON.parse(n.content); } catch (e) { }
            }
            if (parsedContent?.action && parsedContent?.action_time) {
              initialActions[n.id] = { status: parsedContent.action, time: parsedContent.action_time };
            }
          });
          setActionStates(initialActions);
          setNotifications(data);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, async (payload) => {
        const newNotification = payload.new as Notification;
        if (newNotification.recipient_id !== user.id && newNotification.recipient_id !== null) return;

        if (newNotification.actor_id) {
          const { data: actorData } = await supabase
            .from('profiles')
            .select('avatar_url, first_name, last_name')
            .eq('id', newNotification.actor_id)
            .single();

          if (actorData) {
            newNotification.actor = actorData;
          }
        }

        if (newNotification.course_id) {
          const { data: courseData } = await supabase
            .from('courses')
            .select('title')
            .eq('id', newNotification.course_id)
            .single();

          if (courseData) {
            newNotification.course = courseData;
          }
        }

        setNotifications(prev => [newNotification, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const handleAccept = async (item: Notification) => {
    if (!user) return;
    const actorId = item.actor?.id || item.actor_id;
    if (!actorId) return;

    try {
      console.log('Accepted request for sender:', actorId);
      const actionTime = new Date().toLocaleString();
      const initials = getInitials(item.actor?.first_name || '', item.actor?.last_name || '');
      const nameForMsg = item.actor ? `${item.actor.first_name || ''} ${item.actor.last_name || ''}`.trim() : 'Someone';
      const messageText = `You accepted ${nameForMsg}'s chat request on ${actionTime}`;

      await chatService.updateChatRequestStatus('accepted', actorId, user.id);

      // Update notification in DB so it persists as accepted
      const newType = 'request_accepted';
      const newContent = { message: messageText };

      await supabase.from('notifications').update({
        content: newContent,
        type: newType
      }).eq('id', item.id);

      // Optimistically update the UI by altering the local item
      setNotifications(prev => prev.map(n =>
        n.id === item.id ? { ...n, type: newType, content: newContent } : n
      ));

      Alert.alert('Success', 'Request Accepted');
    } catch (error) {
      console.error('Error in handleAccept:', error);
      setActionStates(prev => { const st = { ...prev }; delete st[item.id]; return st; });
      Alert.alert('Error', 'Could not accept request');
    }
  };

  const handleDecline = async (item: Notification) => {
    if (!user) return;
    const actorId = item.actor?.id || item.actor_id;
    if (!actorId) return;

    try {
      console.log('Declined request for sender:', actorId);
      const actionTime = new Date().toLocaleString();
      const nameForMsg = item.actor ? `${item.actor.first_name || ''} ${item.actor.last_name || ''}`.trim() : 'Someone';
      const messageText = `You declined ${nameForMsg}'s chat request on ${actionTime}`;

      await chatService.updateChatRequestStatus('declined', actorId, user.id);

      // Update notification in DB so it persists
      const newType = 'request_declined';
      const newContent = { message: messageText };

      await supabase.from('notifications').update({
        content: newContent,
        type: newType
      }).eq('id', item.id);

      // Optimistically update local item
      setNotifications(prev => prev.map(n =>
        n.id === item.id ? { ...n, type: newType, content: newContent } : n
      ));

    } catch (error) {
      console.error('Error in handleDecline:', error);
      setActionStates(prev => { const st = { ...prev }; delete st[item.id]; return st; });
    }
  };


  const handleClearNotifications = async (filterType: 'all' | 'custom', daysInput?: string) => {
    if (!user) return;

    if (filterType === 'custom' && (!daysInput || isNaN(parseInt(daysInput)))) {
      // Inline error feedback could be better, but keeping simple for now
      return;
    }

    setIsClearing(true);
    try {
      let query = supabase.from('notifications').delete().eq('recipient_id', user.id);

      let thresholdDate: Date | null = null;
      if (filterType === 'custom' && daysInput) {
        thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - parseInt(daysInput));
        query = query.lt('created_at', thresholdDate.toISOString());
      }

      const { error } = await query;

      if (error) throw error;

      // Update local state
      if (filterType === 'all') {
        setNotifications([]);
      } else if (thresholdDate) {
        setNotifications(prev => prev.filter(n => new Date(n.created_at) >= thresholdDate!));
      }

      setShowCustomModal(false);
      setCustomDays('');

    } catch (error) {
      console.error('Error clearing notifications:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const showClearOptions = () => {
    setShowCustomModal(true);
  };


  // Format notification action text
  const getNotificationActionText = (notification: Notification): string => {
    const courseTitle = notification.course?.title || 'a course';

    // Helper to safely extract message from website payloads
    const getPayloadMessage = () => {
      if (typeof notification.content === 'string') {
        try {
          const parsed = JSON.parse(notification.content);
          return parsed.message || parsed.title || parsed.body || null;
        } catch {
          return notification.content;
        }
      }
      if (typeof notification.content === 'object' && notification.content !== null) {
        const content = notification.content as any;
        return content.message || content.title || content.body || null;
      }
      return null;
    };

    switch (notification.type) {
      case 'enrollment':
        return getPayloadMessage() || `has enrolled in your course: "${courseTitle}"`;
      case 'announcement':
        return getPayloadMessage() || `posted an announcement in "${courseTitle}"`;
      case 'comment':
        return getPayloadMessage() || `commented on "${courseTitle}"`;
      case 'course_approval':
        return getPayloadMessage() || `Your course "${courseTitle}" has been approved`;
      case 'message_request':
        return `sent you a message request`;
      case 'chat_invitation':
        return `sent you a chat request`;
      case 'request_accepted': {
        const msg = getPayloadMessage();
        if (msg?.toLowerCase().startsWith('you ')) return msg;
        const dateObj = new Date(notification.created_at);
        const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
        return `has accepted your chat request on ${formattedDate}`;
      }
      case 'request_declined': {
        const msg = getPayloadMessage();
        if (msg?.toLowerCase().startsWith('you ')) return msg;
        const dateObj = new Date(notification.created_at);
        const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
        return `has declined your chat request on ${formattedDate}`;
      }
      case 'new_follower':
        return `started following you.`;
      case 'follow_back':
        return `followed you back.`;
      case 'payment':
        return getPayloadMessage() || `sent you a payment`;
      case 'quiz_completion': {
        try {
          const data = typeof notification.content === 'string' ? JSON.parse(notification.content) : notification.content;
          const quizTitle = data.quiz_title || 'a quiz';
          const score = data.score !== undefined ? `${data.score}%` : 'N/A';
          return `has completed the quiz: "${quizTitle}" with score ${score}`;
        } catch {
          return `completed a quiz in "${courseTitle}"`;
        }
      }
      case 'course_rating': {
        try {
          const data = typeof notification.content === 'string' ? JSON.parse(notification.content) : notification.content;
          const rating = data.rating || 'N/A';
          return `gave a ${rating} star review to "${courseTitle}"`;
        } catch {
          return `rated "${courseTitle}"`;
        }
      }
      default:
        if (typeof notification.content === 'string') {
          try {
            const parsed = JSON.parse(notification.content);
            if (parsed.quiz_title) {
              return `has completed the quiz: "${parsed.quiz_title}" ${parsed.score ? `with score ${parsed.score}%` : ''}`;
            }
            if (parsed.rating) {
              return `gave a ${parsed.rating} star review to "${courseTitle}"`;
            }
            return parsed.message || parsed.title || parsed.body || notification.content;
          } catch {
            return notification.content;
          }
        }
        if (typeof notification.content === 'object' && notification.content !== null) {
          const content = notification.content as any;
          return content.message || content.title || content.body || 'New Notification';
        }
        return 'New Notification';
    }
  };


  const getInitials = (firstName?: string, lastName?: string): string => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  };

  const getAvatarColor = (name: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B739', '#52B788', '#E63946', '#457B9D'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Filter and prepare notifications
  const getFilteredNotifications = () => {
    let filtered = notifications;
    if (activeTab === 'Requests') {
      const REQUEST_ACTION_TYPES = [...REQUEST_TYPES, 'request_accepted', 'request_declined'];
      filtered = notifications.filter(n => REQUEST_ACTION_TYPES.includes(n.type));
    }
    return filtered;
  };


  const displayNotifications = getFilteredNotifications();
  const groupedNotifications = groupNotificationsByDate(displayNotifications);

  const pendingRequestsCount = notifications.filter(n =>
    REQUEST_TYPES.includes(n.type) && !actionStates[n.id]
  ).length;

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'All' && styles.activeTab]}
        onPress={() => setActiveTab('All')}
      >
        <Text style={[styles.tabText, activeTab === 'All' && styles.activeTabText]}>All</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'Requests' && styles.activeTab]}
        onPress={() => setActiveTab('Requests')}
      >
        <View style={styles.tabLabelContainer}>
          <Text style={[styles.tabText, activeTab === 'Requests' && styles.activeTabText]}>Requests</Text>
          {pendingRequestsCount > 0 && <View style={styles.badgeDot} />}
        </View>
      </TouchableOpacity>
    </View>
  );


  const renderItem = ({ item }: { item: Notification }) => {
    let actorName = item.actor
      ? `${item.actor.first_name || ''} ${item.actor.last_name || ''}`.trim()
      : '';

    // If actor is missing/Unknown, try to find a name from the payload, or default to "Someone"
    if (!actorName) {
      if (typeof item.content === 'object' && item.content !== null) {
        const c = item.content as any;
        actorName = c.sender_name || c.user_name || c.name || 'Someone';
      } else if (typeof item.content === 'string') {
        try {
          const parsed = JSON.parse(item.content);
          actorName = parsed.sender_name || parsed.user_name || parsed.name || 'Someone';
        } catch {
          actorName = 'Someone';
        }
      } else {
        actorName = 'Someone';
      }
    }

    const initials = getInitials(actorName, ''); // Use the resolved name for initials if needed
    const avatarColor = getAvatarColor(actorName);

    const renderQuizContent = () => {
      let data: any = {};
      try {
        data = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
      } catch (e) {
        console.warn('Notification parse error:', e);
      }

      // Extract Data with Fallbacks
      // 'passed' might be boolean or missing. If missing, assume passed if score >= 50 or derive from status
      const passed = data.passed !== undefined ? data.passed : (data.score >= 50);
      const statusText = data.status || (passed ? 'Passed' : 'Failed');

      const quizTitle = data.quiz_title || 'Quiz';
      const courseTitle = item.course?.title || data.course_title || 'Course';

      // Robust extraction for Correct/Incorrect
      // Check variety of common keys: correct_count, correct_answers, total_correct
      const correctRaw = data.correct_count ?? data.correct_answers ?? data.total_correct ?? data.correct;
      const incorrectRaw = data.incorrect_count ?? data.wrong_answers ?? data.incorrect ?? data.total_incorrect;
      const totalRaw = data.total_questions ?? data.total_count ?? data.total ?? data.quiz_total ?? data.questions_count;

      const score = Number(data.score ?? 0);
      const correct = Number(correctRaw ?? 0);
      let incorrect = Number(incorrectRaw ?? 0);

      // Manual fallback if incorrect is 0 but we have total and correct
      if (incorrect === 0 && totalRaw) {
        const total = Number(totalRaw);
        incorrect = Math.max(0, total - correct);
      }

      // Debug log if values seem missing
      if (correct === 0 && incorrect === 0) {
        console.log('DEBUG: Notification Content for Quiz (Stats 0):', item.content);
      }

      return (
        <View>
          <Text style={styles.notificationTitle}>
            {actorName} has <Text style={styles.boldText}>{statusText}</Text> the quiz "<Text style={styles.boldText}>{quizTitle}</Text>" in your course: "<Text style={styles.boldText}>{courseTitle}</Text>"
          </Text>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>Score: <Text style={styles.boldText}>{score}%</Text></Text>
            <Text style={[styles.statText, { color: '#4CAF50' }]}>Correct: {correct}</Text>
            <Text style={[styles.statText, { color: '#E74C3C' }]}>Incorrect: {incorrect}</Text>
          </View>
        </View>
      );
    };

    const REQUEST_ACTION_TYPES = [...REQUEST_TYPES, 'request_accepted', 'request_declined'];
    const isRequestActionType = REQUEST_ACTION_TYPES.includes(item.type);
    const actionText = getNotificationActionText(item);
    const isSelfAction = actionText.toLowerCase().startsWith('you ');
    const startsWithActor = actionText.toLowerCase().startsWith(actorName.toLowerCase());

    const handleNotificationPress = () => {
      if (item.type === 'new_follower' || item.type === 'follow_back') {
        const profileId = item.actor?.id || item.actor_id;
        if (profileId) {
          router.push(`/viewProfile/${profileId}`);
        }
      } else if (item.type === 'live_now' || item.type === 'upcoming_event') {
        // Navigate to the live class or upcoming tab
        if (item.type === 'live_now') {
          // If we have a course_id or session_id in content, we could go direct. 
          // For now, let's go to the Live tab.
          router.push('/(tabs)/live');
        } else {
          router.push('/(tabs)/upcoming');
        }
      }
    };

    return (
      <View style={[styles.notificationItem, isRequestActionType && styles.requestItem]}>
        {isRequestActionType && (
          <Text style={styles.requestLabel}>CHAT REQUEST</Text>
        )}

        <TouchableOpacity 
          style={styles.itemRow} 
          activeOpacity={0.7} 
          onPress={handleNotificationPress}
          disabled={!['new_follower', 'follow_back'].includes(item.type)}
        >
          {/* Circular Avatar with Badge */}
          <View style={styles.avatarContainer}>
            {item.actor?.avatar_url ? (
              <Image
                source={{ uri: item.actor.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.initialsAvatar, { backgroundColor: avatarColor }]}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
            )}
            <View style={styles.badgeContainer}>
              <Ionicons
                name={badgeIconMap[item.type] || badgeIconMap.default}
                size={10}
                color="#FFFFFF"
              />
            </View>
          </View>

          {/* Notification Content */}
          <View style={styles.notificationTextContainer}>
            {item.type === 'quiz_completion' ? renderQuizContent() : (
              <Text style={styles.notificationTitle} numberOfLines={2}>
                {!isSelfAction && !startsWithActor && (
                  <Text style={styles.boldText}>{actorName} </Text>
                )}
                {isSelfAction ? (
                  <Text>
                    {actionText.replace(/this request/gi, `${actorName}'s chat request`).split(actorName).map((part, i, arr) => (
                      <React.Fragment key={i}>
                        {part}
                        {i < arr.length - 1 && <Text style={styles.boldText}>{actorName}</Text>}
                      </React.Fragment>
                    ))}
                  </Text>
                ) : actionText}
              </Text>
            )}
            <Text style={styles.notificationTime}>
              {getRelativeTime(item.created_at)}
            </Text>
          </View>

        </TouchableOpacity>

        {!isSelfAction && REQUEST_TYPES.includes(item.type) && (
          <View style={styles.actionSection}>
            <View style={styles.requestButtons}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={() => handleDecline(item)}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleAccept(item)}
                style={styles.acceptButtonWrapper}
              >
                <LinearGradient
                  colors={['#8A2BE2', '#5D00B3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.acceptButton}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };


  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Notifications</Text>
        </View>
        <TouchableOpacity onPress={showClearOptions} style={styles.clearButton} disabled={notifications.length === 0 || isClearing}>
          {isClearing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="trash-outline" size={22} color="#fff" opacity={notifications.length === 0 ? 0.5 : 1} />
          )}
        </TouchableOpacity>
      </View>

      {renderTabBar()}

      <View style={styles.contentArea}>

        <SectionList
          sections={groupedNotifications}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            ) : null
          }
        />
      </View>

      {/* Custom Universal Clear Modal */}
      <ReactNativeModal
        isVisible={showCustomModal}
        onBackdropPress={() => setShowCustomModal(false)}
        animationIn="zoomIn"
        animationOut="zoomOut"
        useNativeDriver
        style={styles.modalFull}
      >
        <View style={styles.modalContent}>
          {/* Circular Trash Icon */}
          <View style={styles.modalIconContainer}>
            <Ionicons name="trash-outline" size={32} color="#8A2BE2" />
          </View>

          <Text style={styles.modalTitle}>Clear Notifications</Text>
          <Text style={styles.modalSubtitle}>How would you like to clear your notifications?</Text>

          {/* Option 1: Clear All */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleClearNotifications('all')}
            style={styles.modalActionWrapper}
          >
            <LinearGradient
              colors={['#8A2BE2', '#5D00B3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalPrimaryButton}
            >
              <Text style={styles.modalPrimaryButtonText}>Clear All Notifications</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.modalDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Option 2: Clear Older Than */}
          <View style={styles.customClearSection}>
            <Text style={styles.customClearLabel}>Clear older than (days):</Text>
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.modalDaysInput}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={customDays}
                onChangeText={setCustomDays}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleClearNotifications('custom', customDays)}
                disabled={isClearing}
                style={styles.confirmCustomWrapper}
              >
                <LinearGradient
                  colors={['#8A2BE2', '#5D00B3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmCustomButton}
                >
                  {isClearing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmCustomText}>Confirm</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => {
              setShowCustomModal(false);
              setCustomDays('');
            }}
          >
            <Text style={styles.modalCancelText}>Don't Clear</Text>
          </TouchableOpacity>
        </View>
      </ReactNativeModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#8A2BE2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentArea: {
    flex: 1,
  },
  listContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8D8FF',
  },
  initialsAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  notificationTitle: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 13,
    color: '#888888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
  boldText: {
    fontWeight: '700',
    color: '#000',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  statText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  daysInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  confirmButton: {
    backgroundColor: '#E74C3C',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#8A2BE2',
  },
  tabText: {
    fontSize: 15,
    color: '#888888',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#8A2BE2',
    fontWeight: 'bold',
  },
  tabLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E74C3C',
    marginLeft: 6,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  requestItem: {
    flexDirection: 'column',
    paddingTop: 12,
  },
  requestLabel: {
    color: '#8A2BE2',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  actionSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    width: '100%',
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#666666',
    fontWeight: '600',
    fontSize: 14,
  },
  acceptButtonWrapper: {
    flex: 1,
  },
  acceptButton: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    width: '100%',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },
  modalFull: {
    margin: 20,
    justifyContent: 'center',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -10,
  },
  modalActionWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  modalPrimaryButton: {
    height: 54,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalPrimaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 12,
    fontWeight: 'bold',
  },
  customClearSection: {
    width: '100%',
    marginBottom: 25,
  },
  customClearLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontWeight: '500',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalDaysInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#F5F8FF',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8A2BE2',
    borderWidth: 1.5,
    borderColor: '#E8D8FF',
  },
  confirmCustomWrapper: {
    flex: 1.5,
  },
  confirmCustomButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmCustomText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    paddingVertical: 10,
  },
  modalCancelText: {
    color: '#999',
    fontSize: 15,
    fontWeight: '600',
  },
});


export default NotificationScreen;
