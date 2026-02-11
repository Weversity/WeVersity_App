// @ts-ignore
import { supabase } from '@/src/auth/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, SectionList, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    avatar_url?: string;
    first_name?: string;
    last_name?: string;
  };
  course?: {
    title?: string;
  };
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

  // Reset unread count when screen is opened
  useEffect(() => {
    const markAsRead = async () => {
      if (!user) return;
      // Optimistic UI update
      setUnreadCount(0);

      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false);
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
            actor:profiles!actor_id(avatar_url, first_name, last_name),
            course:courses(title)
          `)
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setNotifications(data);
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
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`
      }, async (payload) => {
        // Fetch actor and course data for new notification
        const newNotification = payload.new as Notification;

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


  // Format notification text based on website style
  const getNotificationText = (notification: Notification): string => {
    const actorName = notification.actor
      ? `${notification.actor.first_name} ${notification.actor.last_name}`
      : 'Someone';

    const courseTitle = notification.course?.title || 'a course';

    // Format based on notification type
    switch (notification.type) {
      case 'enrollment':
        return `${actorName} has enrolled in your course: "${courseTitle}"`;
      case 'announcement':
        return `${actorName} posted an announcement in "${courseTitle}"`;
      case 'comment':
        return `${actorName} commented on "${courseTitle}"`;
      case 'course_approval':
        return `Your course "${courseTitle}" has been approved`;
      case 'quiz_completion': {
        try {
          const data = typeof notification.content === 'string' ? JSON.parse(notification.content) : notification.content;
          const quizTitle = data.quiz_title || 'a quiz';
          const score = data.score !== undefined ? `${data.score}%` : 'N/A';
          return `${actorName} has completed the quiz: "${quizTitle}" with score ${score}`;
        } catch {
          return `${actorName} completed a quiz in "${courseTitle}"`;
        }
      }
      case 'course_rating': {
        try {
          const data = typeof notification.content === 'string' ? JSON.parse(notification.content) : notification.content;
          const rating = data.rating || 'N/A';
          return `${actorName} gave a ${rating} star review to "${courseTitle}"`;
        } catch {
          return `${actorName} rated "${courseTitle}"`;
        }
      }
      default:
        // Fallback to parsing content
        if (typeof notification.content === 'string') {
          try {
            const parsed = JSON.parse(notification.content);
            // Secondary check if it's a quiz/rating but type wasn't set correctly
            if (parsed.quiz_title) {
              return `${actorName} has completed the quiz: "${parsed.quiz_title}" ${parsed.score ? `with score ${parsed.score}%` : ''}`;
            }
            if (parsed.rating) {
              return `${actorName} gave a ${parsed.rating} star review to "${courseTitle}"`;
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

  const groupedNotifications = groupNotificationsByDate(notifications);

  const renderItem = ({ item }: { item: Notification }) => {
    const actorName = item.actor
      ? `${item.actor.first_name || ''} ${item.actor.last_name || ''}`.trim()
      : 'Unknown';
    const initials = getInitials(item.actor?.first_name, item.actor?.last_name);
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

    return (
      <View
        style={styles.notificationItem}
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
              {getNotificationText(item)}
            </Text>
          )}
          <Text style={styles.notificationTime}>
            {getRelativeTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.contentArea}>
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
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  },
  notificationTitle: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 20,
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
  }
});

export default NotificationScreen;
