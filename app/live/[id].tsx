import { supabase } from '@/src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
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

  const player = useVideoPlayer(session?.meeting_url || '', player => {
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

      {/* Background Video */}
      {session?.meeting_url ? (
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
    fontSize: 14,
    fontWeight: '600',
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
});

export default LiveClassScreen;
