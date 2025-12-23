import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { liveSessionService } from '../services/liveSessionService';
import NotificationPopup from './NotificationPopup';

const SessionItem = memo(({ item, onNotify }: { item: any; onNotify: (item: any) => void }) => {
  const title = item.course?.title || 'Live Class';
  const scheduledTime = new Date(item.scheduled_at).toLocaleString();

  return (
    <View style={styles.courseItem}>
      <View>
        <Image source={{ uri: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2670&auto=format&fit=crop` }} style={styles.coachImage} />
        <View style={styles.upcomingTag}>
          <Text style={styles.tagText}>UPCOMING</Text>
        </View>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.courseTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.coachName}>{scheduledTime}</Text>
        <TouchableOpacity style={styles.joinButton} onPress={() => onNotify(item)}>
          <Text style={styles.joinButtonText}>Notify Me</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const UpcomingClasses: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // Start with false
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (loading) return; // Prevent re-fetching if already loading

    setLoading(true);
    try {
      const data = await liveSessionService.fetchUpcomingClasses();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading]); // Add loading to dependency array

  useEffect(() => {
    loadSessions();
  }, []); // Remove loadSessions from dependency array to only run on mount

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSessions();
  }, [loadSessions]);

  const handleNotifyMe = useCallback((session: any) => {
    setSelectedSession(session);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedSession(null);
  }, []);

  const handleConfirmNotification = useCallback(() => {
    if (selectedSession) {
      setNotificationMessage(`You will be notified when "${selectedSession.course?.title || 'Class'}" starts! A confirmation email has been sent.`);
      handleCloseModal();
    }
  }, [selectedSession, handleCloseModal]);

  useEffect(() => {
    if (notificationMessage) {
      Alert.alert("Confirmation", notificationMessage, [{ text: "OK", onPress: () => setNotificationMessage(null) }]);
    }
  }, [notificationMessage]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    console.log('Rendering Session Item ID:', item.id);
    return (
      <SessionItem item={item} onNotify={handleNotifyMe} />
    );
  }, [handleNotifyMe]);

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No upcoming classes scheduled.</Text>
      </View>
    );
  }, [loading]);

  const renderFooter = useCallback(() => {
    // Show footer loading indicator only on initial load
    if (!loading || sessions.length > 0) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#8A2BE2" />;
  }, [loading, sessions]);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={sessions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A2BE2" />
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.container}
        numColumns={2}
      />
      {selectedSession && (
        <NotificationPopup
          visible={modalVisible}
          onClose={handleCloseModal}
          onNotify={handleConfirmNotification}
          courseTitle={selectedSession.course?.title || 'Class'}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 5,
    paddingTop: 10,
  },
  courseItem: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    flex: 1,
    margin: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  coachImage: {
    width: '100%',
    height: 140,
  },
  upcomingTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(138, 43, 226, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  tagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: 12,
    alignItems: 'center',
  },
  coachName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 12,
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default UpcomingClasses;