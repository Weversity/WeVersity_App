// @ts-ignore
import { supabase } from '@/src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
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

const LiveClassScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

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
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSessionData();
  }, [id, fetchSessionData]);

  const player = useVideoPlayer(session?.google_meet_url || '', player => {
    player.loop = true;
    player.play();
    player.muted = isMuted;
  });

  const toggleMute = () => {
    setIsMuted(!isMuted);
    player.muted = !isMuted;
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

      {/* Stream Content */}
      {session?.google_meet_url?.includes('zoom.us') || session?.google_meet_url?.includes('meet.google.com') ? (
        <View style={styles.externalJoinContainer}>
          <View style={styles.instructorProfileLarge}>
            {instructor.avatar_url ? (
              <Image source={{ uri: instructor.avatar_url }} style={styles.largeAvatar} />
            ) : (
              <View style={[styles.largeAvatar, styles.initialsCircleLarge]}>
                <Text style={styles.initialsTextLarge}>{getInitials(instructor.first_name, instructor.last_name)}</Text>
              </View>
            )}
            <Text style={styles.largeInstructorName}>{instructorName}</Text>
            <Text style={styles.externalStatusText}>Session is happening via external meeting</Text>
          </View>

          <TouchableOpacity
            style={styles.joinExternalButton}
            onPress={() => Linking.openURL(session.google_meet_url)}
          >
            <Ionicons name="videocam" size={24} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.joinExternalButtonText}>Join Live Session</Text>
          </TouchableOpacity>
        </View>
      ) : session?.google_meet_url ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="videocam-off" size={60} color="#333" />
          <Text style={{ color: '#666', marginTop: 10 }}>Stream unavailable</Text>
        </View>
      )}

      {/* Main Overlay */}
      <SafeAreaView style={styles.overlay}>
        {/* Header - Back Button & Instructor Info */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>

          <View style={styles.instructorHeaderInfo}>
            <View style={styles.instructorProfileRow}>
              {instructor.avatar_url ? (
                <Image source={{ uri: instructor.avatar_url }} style={styles.instructorAvatar} />
              ) : (
                <View style={[styles.instructorAvatar, styles.initialsCircle]}>
                  <Text style={styles.initialsText}>{getInitials(instructor.first_name, instructor.last_name)}</Text>
                </View>
              )}
              <View>
                <Text style={styles.instructorName}>{instructorName}</Text>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Floating Mute Button - Bottom Right */}
        <View style={styles.muteButtonContainer}>
          <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
            <Ionicons
              name={isMuted ? "volume-mute" : "volume-medium"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructorHeaderInfo: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  instructorProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#8A2BE2',
  },
  instructorName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  liveBadge: {
    backgroundColor: '#FF0050',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  muteButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  muteButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
    fontSize: 14,
  },
  externalJoinContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#000',
  },
  instructorProfileLarge: {
    alignItems: 'center',
    marginBottom: 40,
  },
  largeAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#8A2BE2',
    marginBottom: 20,
  },
  initialsCircleLarge: {
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsTextLarge: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 40,
  },
  largeInstructorName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  externalStatusText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
  },
  joinExternalButton: {
    backgroundColor: '#8A2BE2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    elevation: 5,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  joinExternalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LiveClassScreen;
