import React from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Mapping of notification types to icons
const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  comment: 'chatbubble-ellipses-outline',
  course_approval: 'checkmark-circle-outline',
  message: 'mail-outline',
  payment: 'wallet-outline',
  enrollment: 'person-add-outline',
  default: 'notifications-outline',
};

// Mock notification data with dates and types
const notifications = [
  { id: '1', title: 'New comment on your post', date: new Date(), type: 'comment', read: false },
  { id: '2', title: 'Your course "React Native for Beginners" has been approved', date: new Date(), type: 'course_approval', read: false },
  { id: '3', title: 'You have a new message from John Doe', date: new Date(new Date().setDate(new Date().getDate() - 1)), type: 'message', read: true },
  { id: '4', title: 'Your withdrawal request has been processed', date: new Date(new Date().setDate(new Date().getDate() - 2)), type: 'payment', read: true },
  { id: '5', title: 'A new student has enrolled in your course.', date: new Date('2024-12-22T10:00:00'), type: 'enrollment', read: false },
  { id: '6', title: 'Your payment for November 2024 is on its way.', date: new Date('2024-12-22T12:30:00'), type: 'payment', read: true },
];

type Notification = typeof notifications[0];

const groupNotificationsByDate = (notifications: Notification[]) => {
  const groups: { [key: string]: Notification[] } = {};

  notifications.forEach(notification => {
    const notificationDate = new Date(notification.date);
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
  const groupedNotifications = groupNotificationsByDate(notifications);

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity style={[styles.notificationItem, !item.read && styles.unreadItem]}>
      <View style={styles.iconContainer}>
        <Ionicons name={iconMap[item.type] || iconMap.default} size={24} color="#8A2BE2" />
      </View>
      <View style={styles.notificationTextContainer}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationTime}>{new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

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
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F2F8',
  },
  contentArea: {
    flex: 1,
  },
  listContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#F4F2F8',
    paddingVertical: 10,
    marginTop: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unreadItem: {
    backgroundColor: '#F4F0FF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8D8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  notificationTitle: {
    fontSize: 16,
    color: '#333',
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8A2BE2',
    marginLeft: 10,
  }
});

export default NotificationScreen;
