import { supabase } from '@/src/auth/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { courseService } from '@/src/services/courseService';
import { videoService } from '@/src/services/videoService';
import { Ionicons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NotificationIcon from '../notifications/NotificationIcon';

const { width, height } = Dimensions.get('window');

// Data based on the provided image inspiration
const stats = [
  { id: '1', title: 'Total Students', color: '#F3E5F5', icon: 'people', iconColor: '#8A2BE2' },
  { id: '3', title: 'Course Rating', color: '#FFF9C4', icon: 'star', iconColor: '#FBC02D' },
];

interface Short {
  id: string;
  thumbnail: string; // uri
  type: 'image' | 'video';
  uri: string;
  public_id?: string;
  createdAt: string; // ISO string
  title?: string;
}

const getTimeAgo = (dateString: string) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hrs ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
};

const SideMenu = ({ visible, onClose, logout, onUploadShort, onViewPublicProfile, router, profileData }: {
  visible: boolean;
  onClose: () => void;
  logout: () => void;
  onUploadShort: () => void;
  onViewPublicProfile: () => void;
  router: any;
  profileData?: any;
}) => {
  const { user } = useAuth();
  if (!visible) return null;

  const displayAvatar = profileData?.avatar_url || user?.user_metadata?.avatar || user?.user_metadata?.avatar_url;
  const firstName = profileData?.first_name || user?.user_metadata?.first_name || 'Instructor';
  const lastName = profileData?.last_name || user?.user_metadata?.last_name || '';
  const initials = `${firstName[0]}${lastName[0] || ''}`.toUpperCase();

  const menuItems = [
    { id: '1', title: 'Dashboard', icon: 'grid-outline', onPress: () => { onClose(); } },
    { id: '3', title: 'Public Profile', icon: 'person-circle-outline', onPress: () => { onClose(); onViewPublicProfile(); } },
    { id: '35', title: 'Notifications', icon: 'notifications-outline', onPress: () => { onClose(); router.push('/notifications'); } },
    { id: '7', title: 'Support', icon: 'help-circle-outline', onPress: () => { onClose(); router.push('/support'); } },
    { id: '6', title: 'Following', icon: 'people-outline', onPress: () => { onClose(); router.push('/followers'); } },
    { id: '5', title: 'Logout', icon: 'log-out-outline', onPress: logout },
  ];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <View style={styles.menuProfileSection}>
              {displayAvatar && displayAvatar.trim() !== '' && displayAvatar.startsWith('http') ? (
                <Image source={{ uri: displayAvatar }} key={displayAvatar} style={styles.menuAvatar} />
              ) : (
                <View style={[styles.menuAvatar, { backgroundColor: '#F3E5F5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#8A2BE2' }]}>
                  <Text style={{ color: '#8A2BE2', fontWeight: 'bold', fontSize: 18 }}>{initials}</Text>
                </View>
              )}
              <Text style={styles.menuProfileName} numberOfLines={1}>{firstName} {lastName}</Text>
            </View>
          </View>
          <View style={styles.menuItems}>
            <Text style={styles.menuSubtitle}>MENU</Text>
            {menuItems.map((item, index) => (
              <TouchableOpacity key={item.id} style={[styles.menuItem, index === 0 && styles.activeMenuItem]} onPress={item.onPress}>
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={index === 0 ? '#fff' : '#8A2BE2'}
                />
                <Text style={[styles.menuItemText, index === 0 && styles.activeMenuItemText]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ShortViewerModal = ({ short, visible, onClose }: { short: Short; visible: boolean; onClose: () => void }) => {
  const player = useVideoPlayer(short.type === 'video' ? short.uri : '', player => {
    player.loop = true;
    player.play();
  });

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center' }}>
        <TouchableOpacity style={styles.closeCameraBtn} onPress={onClose}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>

        {short.type === 'video' ? (
          <VideoView style={{ width: '100%', height: '100%' }} player={player} contentFit="contain" />
        ) : (
          <Image source={{ uri: short.uri }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
        )}
      </View>
    </Modal>
  );
};

const SHORT_CARD_GAP = 8;
const SHORT_CARD_WIDTH = (width - 40 - (SHORT_CARD_GAP * 2)) / 3;
// Dashboard has nested padding: 20 (ScrollView) + 20 (recentSection) = 40 per side => 80 total + 10 margin of safety = 90
const DASHBOARD_SHORT_WIDTH = (width - 90 - (SHORT_CARD_GAP * 2)) / 3;

const ShortCard = ({ short, onPress, onDelete, style }: { short: Short; onPress: () => void; onDelete: (short: Short) => void; style?: any }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(short.type === 'image' ? short.uri : short.thumbnail);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const generateThumbnail = async () => {
      // STRICT CHECK: Only generate if it is explicit video type
      if (short.type === 'video') {
        // If we already have a generated thumbnail that is NOT the video URI, skip
        if (thumbnail && thumbnail !== short.uri) return;

        try {
          setLoading(true);
          const { uri } = await VideoThumbnails.getThumbnailAsync(short.uri, {
            time: 1000,
          });
          if (isMounted) {
            setThumbnail(uri);
          }
        } catch (e) {
          console.warn("Could not generate thumbnail", e);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        // It is an image, just use the uri
        if (isMounted && thumbnail !== short.uri) {
          setThumbnail(short.uri);
        }
      }
    };
    generateThumbnail();
    return () => { isMounted = false; };
  }, [short.uri, short.type]);

  return (
    <TouchableOpacity style={[styles.shortCard, style]} onPress={onPress} activeOpacity={0.9}>
      {(loading || !thumbnail) ? (
        <View style={[styles.shortCardImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      ) : (
        <Image source={{ uri: thumbnail }} style={styles.shortCardImage} />
      )}

      {/* Play Icon Overlay */}
      {short.type === 'video' && (
        <View style={styles.playIconContainer}>
          <Ionicons name="play" size={12} color="#fff" />
        </View>
      )}

      {/* Delete Button - Top Right */}
      <TouchableOpacity style={styles.cardDeleteButton} onPress={() => onDelete(short)}>
        <Ionicons name="trash-outline" size={14} color="#fff" />
      </TouchableOpacity>

      {/* Time Gradient Overlay - NO Title */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.shortCardOverlay}
      >
        <Text style={styles.shortCardTime}>{getTimeAgo(short.createdAt)}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const UploadChoiceModal = ({ visible, onClose, onCamera, onGallery }: { visible: boolean; onClose: () => void; onCamera: () => void; onGallery: () => void }) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.actionSheetContainer}>
          <Text style={styles.actionSheetTitle}>Choose an Option</Text>

          <TouchableOpacity style={styles.actionSheetButton} onPress={onCamera}>
            <Ionicons name="camera-outline" size={24} color="#8A2BE2" />
            <Text style={styles.actionSheetButtonText}>Take Video/Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionSheetButton} onPress={onGallery}>
            <Ionicons name="images-outline" size={24} color="#8A2BE2" />
            <Text style={styles.actionSheetButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionSheetButton, styles.cancelButton]} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

interface InstructorStats {
  totalStudents: number;
  totalRevenue: number;
  courseRating: number;
  totalReviews: number;
}

const InstructorProfile = ({ logout }: { logout: () => void }) => {
  const { user, profile } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const router = useRouter();



  // Shorts State
  const [shorts, setShorts] = useState<Short[]>([]);
  const [viewAllShortsVisible, setViewAllShortsVisible] = useState(false);
  const [selectedShort, setSelectedShort] = useState<Short | null>(null);

  // Courses State
  const [uploadedCourses, setUploadedCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Stats State
  const [statsData, setStatsData] = useState({
    totalStudents: 0,
    courseRating: 0,
    totalReviews: 0
  });
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Deletion state

  const fetchProfileData = async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfileData(data);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const dynamicFirstName = profileData?.first_name || user?.user_metadata?.first_name;
  const dynamicLastName = profileData?.last_name || user?.user_metadata?.last_name;
  const emailUsername = profile?.email?.split('@')[0] || user?.email?.split('@')[0];

  const manualSync = async () => {
    Alert.alert("Syncing...", "Checking for invalid entries and ghost files...");
    await loadShorts();
    Alert.alert("Sync Complete", "Your profile is now up to date.");
  };

  const instructorName = (dynamicFirstName && dynamicLastName)
    ? `${dynamicFirstName} ${dynamicLastName}`
    : (dynamicFirstName || emailUsername || 'Instructor');

  const displayAvatar = profileData?.avatar_url || user?.user_metadata?.avatar || user?.user_metadata?.avatar_url;
  const initials = `${(dynamicFirstName || 'I')[0]}${(dynamicLastName || '')[0]}`.toUpperCase();



  useEffect(() => {
    fetchProfileData();
    loadShorts();
    if (user?.id) {
      fetchCourses();
      fetchStats();
    }
  }, [user?.id]);

  const fetchStats = async () => {
    try {
      if (!user?.id) {
        setLoadingStats(false);
        return;
      }

      setLoadingStats(true);
      console.log('[InstructorProfile] fetchStats started for User ID:', user.id);

      const data = await courseService.fetchInstructorStats(user.id);

      // Guard: If component unmounted or user logged out during fetch
      if (!user?.id) return;

      if (data && typeof data.totalStudents !== 'undefined') {
        setStatsData({
          totalStudents: data.totalStudents || 0,
          courseRating: data.courseRating || 0,
          totalReviews: data.totalReviews || 0
        });
      }
    } catch (error: any) {
      // Ignore auth errors during logout transition
      if (error?.name === 'AuthSessionMissingError' || error?.message?.includes('session')) return;
      console.error('[InstructorProfile] ERROR in fetchStats:', error?.message || error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchCourses = async () => {
    try {
      if (!user?.id) return;
      setLoadingCourses(true);
      const data = await courseService.fetchInstructorCourses(user?.id);
      if (!user?.id) return;
      setUploadedCourses(data);
    } catch (error: any) {
      if (error?.name === 'AuthSessionMissingError' || error?.message?.includes('session')) return;
      console.error('Error fetching instructor courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProfileData(),
      fetchStats(),
      fetchCourses(),
      loadShorts()
    ]);
    setRefreshing(false);
  };

  // ... imports

  const loadShorts = async () => {
    try {
      if (!user?.id) return;

      console.log('📥 Loading shorts for instructor:', user.id);

      // Fetch real data from Supabase
      const data = await videoService.fetchInstructorShorts(user.id);

      console.log('📊 Fetched shorts count:', data?.length || 0);

      if (data) {
        // MANUAL CLEANUP LOGIC: Filter out invalid entries
        const validData = data.filter((s: any) => {
          const isValid = s.video_url && s.video_url.trim() !== '' && s.id;
          if (!isValid) {
            console.warn('⚠️ FILTERING OUT INVALID SHORT:', {
              id: s.id,
              video_url: s.video_url,
              reason: !s.id ? 'Missing ID' : 'Invalid video_url'
            });
          }
          return isValid;
        });

        console.log('✅ Valid shorts after cleanup:', validData.length);
        console.log('🗑️ Filtered out invalid shorts:', data.length - validData.length);

        // Map Supabase data to local Short interface
        const mapped = validData.map((s: any) => ({
          id: s.id,
          thumbnail: s.video_url, // For now using video URL as thumb
          type: s.type || 'video', // Use stored type or default to video
          uri: s.video_url,
          public_id: s.public_id, // Store public_id in local state
          createdAt: s.created_at,
          title: s.description || 'Untitled Short'
        }));

        console.log('📋 Final mapped shorts:', mapped.length);
        setShorts(mapped);
      }
    } catch (error) {
      console.error('❌ Failed to load shorts:', error);
    }
  };

  const confirmDeleteShort = (short: Short) => {
    Alert.alert(
      "Delete Short",
      "Are you sure you want to delete this short?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteShort(short)
        }
      ]
    );
  };

  const deleteShort = async (short: Short) => {
    try {
      console.log('🗑️ ========== DELETION STARTED ==========');
      console.log('DELETING THIS ID:', short.id); // Requested specific log
      console.log('TYPE OF ID:', typeof short.id); // Helper log
      console.log('🔍 LOG: Short object:', JSON.stringify(short, null, 2));
      console.log('🔍 LOG: public_id:', short.public_id);
      console.log('🔍 LOG: type:', short.type);

      // STEP 1 & 2: Sequential deletion (Cloudinary -> Supabase)
      // This will throw an error if either step fails
      const result = await videoService.deleteShort(short.id, short.public_id, short.type);

      console.log('✅ LOG: Deletion result:', JSON.stringify(result));
      console.log('✅ Deletion successful, updating UI state');

      // STEP 3: State Cleanup - Immediately remove from UI after successful deletion
      setShorts(prev => {
        const filtered = prev.filter(item => item.id !== short.id);
        console.log('🔄 LOG: Shorts before filter:', prev.length);
        console.log('🔄 LOG: Shorts after filter:', filtered.length);
        return filtered;
      });

      // FORCE REFRESH: Reload from database to ensure UI is in sync
      console.log('🔄 LOG: Force refreshing shorts from database...');
      await loadShorts();
      console.log('✅ LOG: Force refresh complete');

      Alert.alert("Success", "Short deleted successfully");
      console.log('🗑️ ========== DELETION COMPLETED ==========');
    } catch (error: any) {
      console.error('❌ ========== DELETION FAILED ==========');
      console.error('❌ Deletion failed:', error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error stack:', error?.stack);

      // Provide detailed error feedback
      const errorMessage = error?.message || "Failed to delete short";
      Alert.alert("Error", errorMessage);

      // Reload from server to ensure UI is in sync with database
      console.log('🔄 LOG: Reloading shorts after error...');
      await loadShorts();
    }
  };

  const processUpload = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploadModalVisible(false); // Close modal immediately
      Alert.alert("Uploading", "Your short is being uploaded...");

      // 1. Upload to Cloudinary
      if (!user?.id) throw new Error("User not found");

      const type = asset.type === 'image' ? 'image' : 'video';
      const result = await videoService.uploadVideoToCloudinary(asset.uri, type);

      // 2. Insert into Supabase
      await videoService.createShort({
        video_url: result.secure_url,
        description: asset.fileName || "New Short",
        instructor_id: user.id,
        type: type,
        public_id: result.public_id
      });

      // 3. Refresh List
      Alert.alert("Success", "Short uploaded successfully!");
      loadShorts();

    } catch (error: any) {
      console.error("Upload failed", error);
      // Detailed error for debugging
      const errorMessage = error.message || "Failed to upload short. Please check your connection.";
      Alert.alert("Upload Failed", errorMessage);
    }
  };

  const handleCameraCapture = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos or videos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'], // Updated from MediaTypeOptions
      quality: 0.7,
      allowsEditing: true,
      videoExportPreset: ImagePicker.VideoExportPreset.H264_640x480,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      processUpload(result.assets[0]);
    }
  };

  const handleGallerySelect = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery permission is required to upload shorts.');
      return;
    }

    // Pick media
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'], // Updated from MediaTypeOptions
      allowsMultipleSelection: false,
      quality: 0.7,
      videoExportPreset: ImagePicker.VideoExportPreset.H264_640x480,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      processUpload(result.assets[0]);
    }
  };

  const uploadShort = () => {
    setUploadModalVisible(true);
  };



  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#8A2BE2', '#9D50E5']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.customHeader}>
          <View style={styles.profileContainer}>
            <TouchableOpacity onPress={() => router.push('/profileSettings')}>
              {displayAvatar && displayAvatar.trim() !== '' && displayAvatar.startsWith('http') ? (
                <Image source={{ uri: displayAvatar }} key={displayAvatar} style={styles.headerProfilePic} />
              ) : (
                <View style={[styles.headerProfilePic, { backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{initials}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.profileTextContainer}>
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.profileTypeText}>{instructorName}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>

            <NotificationIcon />
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Deletion Loading Overlay */}
      {isDeleting && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color="#8A2BE2" />
            <Text style={styles.uploadingText}>Deleting Short...</Text>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8A2BE2']}
            tintColor="#8A2BE2"
          />
        }
      >
        <Text style={styles.welcomeTitle}>Welcome back, {instructorName}!</Text>
        <Text style={styles.welcomeSubtitle}>Here is what's happening with your courses today.</Text>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map((stat) => {
            let displayValue = '---';
            if (!loadingStats) {
              if (stat.title === 'Total Students') {
                displayValue = statsData.totalStudents.toLocaleString();
              } else if (stat.title === 'Course Rating') {
                // Format as 5.0 (3) (1 decimal + brackets)
                const rating = statsData.courseRating.toFixed(1);
                const reviews = statsData.totalReviews || 0;
                displayValue = `${rating} (${reviews})`;
              }
            }

            return (
              <View key={stat.id} style={styles.statCard}>
                <View style={styles.statInfo}>
                  <Text style={styles.statTitle}>{stat.title}</Text>

                  {loadingStats ? (
                    <View style={{ height: 44, justifyContent: 'center', alignItems: 'flex-start' }}>
                      <ActivityIndicator size="small" color={stat.iconColor} />
                    </View>
                  ) : (
                    <Text style={[
                      styles.statValue,
                      stat.title === 'Course Rating' && { color: '#FBC02D' }
                    ]}>
                      {displayValue}
                    </Text>
                  )}
                </View>

                <View style={[styles.statIconContainer, { backgroundColor: stat.color }]}>
                  <Ionicons name={stat.icon as any} size={26} color={stat.iconColor} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Quick Actions */}


        <TouchableOpacity style={styles.actionButton} onPress={uploadShort}>
          <View style={styles.actionIconCircle}>
            <Ionicons name="phone-portrait-outline" size={24} color="#8A2BE2" />
          </View>
          <View>
            <Text style={styles.actionTitle}>Upload Short</Text>
            <Text style={styles.actionSubtitle}>Share quick tips</Text>
          </View>
        </TouchableOpacity>

        {/* Recent Shorts Section */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Shorts</Text>
            <TouchableOpacity onPress={() => setViewAllShortsVisible(true)}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {shorts.length === 0 ? (
            <View style={styles.emptyCoursesContainer}>
              <Ionicons name="videocam-outline" size={40} color="#D1C4E9" />
              <Text style={styles.emptyCoursesTitle}>No Shorts Yet</Text>
              <Text style={styles.emptyCoursesSubtitle}>Create short videos to engage your students.</Text>
            </View>
          ) : (
            <View>
              {
                /* 
                   Using a View with flexWrap for grid if few items, 
                   or just simple map since it's "Recent Shorts" (likely limited number).
                   But user asked for numColumns={3} in FlatList or flexWrap.
                   We already have scrollview as main container. Nesting FlatList is tricky.
                   Let's use a View with flexWrap to respect the parent ScrollView.
                */
              }
              <View style={styles.shortsGrid}>
                {shorts.slice(0, 6).map((short, index) => (
                  <ShortCard
                    key={short.id}
                    short={short}
                    onPress={() => setSelectedShort(short)}
                    onDelete={confirmDeleteShort}
                    style={{
                      width: DASHBOARD_SHORT_WIDTH,
                      height: DASHBOARD_SHORT_WIDTH * 1.5,
                      marginBottom: SHORT_CARD_GAP,
                      marginRight: (index + 1) % 3 === 0 ? 0 : SHORT_CARD_GAP,
                    }}
                  />
                ))}
              </View>
              {shorts.length > 9 && (
                <TouchableOpacity onPress={() => setViewAllShortsVisible(true)} style={{ alignSelf: 'center', marginTop: 10 }}>
                  <Text style={styles.seeAllText}>View More</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Your Uploaded Courses Section */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Uploaded Courses</Text>
            {uploadedCourses.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/myUploadedCourses')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingCourses ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#8A2BE2" />
              <Text style={{ marginTop: 10, color: '#888', fontSize: 12 }}>Loading courses...</Text>
            </View>
          ) : uploadedCourses.length === 0 ? (
            <View style={styles.emptyCoursesContainer}>
              <Ionicons name="library-outline" size={50} color="#D1C4E9" />
              <Text style={styles.emptyCoursesTitle}>No Courses Uploaded Yet</Text>
              <Text style={styles.emptyCoursesSubtitle}>
                Your teaching journey starts here. Once you upload a course, it will appear in this list.
              </Text>
            </View>
          ) : (
            uploadedCourses.slice(0, 2).map((course) => (
              <View key={course.id} style={styles.uploadedCourseCard}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: course.image_url || 'https://via.placeholder.com/150' }}
                    style={styles.uploadedCourseImage}
                  />
                </View>

                <View style={styles.uploadedCourseContent}>
                  <Text style={styles.uploadedCourseTitle} numberOfLines={1}>{course.title}</Text>
                  <View style={{ height: 4 }} />
                  <Text style={styles.uploadedCourseCategory}>{course.categories || 'Uncategorized'}</Text>

                  <View style={styles.badgeRow}>
                    <View style={[styles.statusBadgePill, course.is_published ? styles.statusPublishedPill : styles.statusDraftPill]}>
                      <Text style={[styles.statusTextPill, course.is_published ? styles.statusTextPublished : styles.statusTextDraft]}>
                        {course.is_published ? 'PUBLISHED' : 'DRAFT'}
                      </Text>
                    </View>

                    <View style={[styles.priceBadgePillRow, (course.price === 0 || !course.price) ? styles.badgeFree : styles.badgePaid]}>
                      <Text style={styles.priceBadgeText}>
                        {(course.price === 0 || !course.price) ? 'FREE' : 'PAID'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>


      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        logout={logout}
        onUploadShort={uploadShort}
        onViewPublicProfile={() => {
          if (user?.id) {
            router.push({ pathname: '/viewProfile/[id]', params: { id: user.id, mode: 'edit' } });
          }
        }}
        router={router}
        profileData={profileData}
      />

      <UploadChoiceModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onCamera={handleCameraCapture}
        onGallery={handleGallerySelect}
      />



      {/* View All Shorts Modal */}
      <Modal visible={viewAllShortsVisible} animationType="slide" onRequestClose={() => setViewAllShortsVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Shorts</Text>
            <TouchableOpacity onPress={() => setViewAllShortsVisible(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={shorts}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 20 }}
            renderItem={({ item, index }) => (
              <ShortCard
                short={item}
                onPress={() => setSelectedShort(item)}
                onDelete={confirmDeleteShort}
                style={{
                  marginBottom: SHORT_CARD_GAP,
                  marginRight: (index + 1) % 3 === 0 ? 0 : SHORT_CARD_GAP,
                }}
              />
            )}
            numColumns={3}
            ListEmptyComponent={<Text style={styles.emptyShortsText}>No shorts found.</Text>}
          />
        </View>
      </Modal>

      {/* Short Viewer Modal */}
      {selectedShort && (
        <ShortViewerModal
          short={selectedShort}
          visible={!!selectedShort}
          onClose={() => setSelectedShort(null)}
        />
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50, // Adjusted for status bar
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15, // Adjust for status bar
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileTextContainer: {
    marginLeft: 10,
  },
  welcomeText: {
    fontSize: 12,
    color: '#fff',
  },
  profileTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  iconButton: {
    padding: 5,
  },
  headerProfilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8A2BE2',
    borderWidth: 2,
    borderColor: '#fff',
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  statsContainer: {
    marginBottom: 15, // Consistent gap
    flexDirection: 'column',
    gap: 15, // Consistent gap between cards
  },
  statCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20, // Equal padding
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Ensure alignment
    borderWidth: 1,
    borderColor: '#E0D4FC',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '700',
  },
  growthPeriod: {
    fontSize: 11,
    color: '#888',
    marginLeft: 2,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20, // Equal padding
    marginBottom: 15, // Consistent gap
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0D4FC',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    // height removed to let padding dictate size
  },
  actionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F4F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0, // Removed bottom margin since it's in a row
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center', // Keep center
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  recentSection: {
    marginTop: 0, // Gap handled by previous element's marginBottom
    marginBottom: 20, // Strict 20px gap as requested
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20, // Equal padding
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10, // Reduced to 10px for tighter title spacing
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  // ... other styles
  actionSheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    paddingBottom: 40,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  actionSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 15,
  },
  actionSheetButtonText: {
    fontSize: 16,
    color: '#333',
  },
  cancelButton: {
    marginTop: 15,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    borderRadius: 12,
    borderBottomWidth: 0,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5252',
  },

  seeAllText: {
    color: '#8A2BE2',
    fontSize: 14,
    fontWeight: '600',
  },
  shortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 24, // Increased spacing
  },
  shortIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  shortTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  shortTime: {
    fontSize: 12,
    color: '#888',
  },
  shortInfo: {
    flex: 1,
  },
  deleteButton: {
    padding: 10,
  },
  emptyShortsText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },


  // New Shorts Card Styles
  shortsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    // Gap removed to use manual margins for precise control
  },
  shortCard: {
    width: SHORT_CARD_WIDTH,
    height: SHORT_CARD_WIDTH * 1.5, // 1.5:1 aspect ratio
    borderRadius: 15, // 15-20px
    backgroundColor: '#000',
    overflow: 'hidden',
    // marginBottom and marginRight handled by props
    // No border as requested
  },
  shortCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  shortCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    paddingTop: 20,
    justifyContent: 'flex-end',
  },
  shortCardTime: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.9,
  },
  playIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  cardDeleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 0, 0, 0.6)', // Semi-transparent red
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  // Modal / Side Menu Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackdrop: { // The dimmed background
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    width: '75%', // Drawer width
    backgroundColor: '#fff',
    height: '100%',
    paddingTop: 50,
    paddingHorizontal: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  menuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  menuProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  menuAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
  },
  menuProfileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItems: {
    flex: 1,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#888',
    letterSpacing: 1,
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  activeMenuItem: {
    backgroundColor: '#8A2BE2',
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  activeMenuItemText: {
    color: '#fff',
  },

  // Camera Styles
  cameraControls: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 30,
    paddingTop: 60,
  },
  closeCameraBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 20,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    marginRight: 6,
  },
  liveText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  startStreamBtn: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignSelf: 'center',
    marginBottom: 30,
  },
  startStreamText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },

  // Uploaded Courses Styles
  uploadedCourseCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(224, 212, 252, 0.4)',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  uploadedCourseImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  priceBadgePillRow: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  badgeFree: {
    backgroundColor: '#2196F3', // Blue for FREE
  },
  badgePaid: {
    backgroundColor: '#FFD700', // Gold for PAID
  },
  priceBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
  },
  uploadedCourseContent: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'center',
  },
  uploadedCourseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    lineHeight: 24,
  },
  uploadedCourseCategory: {
    fontSize: 13,
    color: '#8A2BE2',
    fontWeight: '600',
    marginBottom: 10,
  },
  statusBadgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 25,
  },
  statusPublishedPill: {
    backgroundColor: '#E8F5E9',
  },
  statusDraftPill: {
    backgroundColor: '#FFF3E0', // Orange-ish for Draft
  },
  statusTextPill: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusTextPublished: {
    color: '#4CAF50',
  },
  statusTextDraft: {
    color: '#FF9800',
  },
  emptyCoursesContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyCoursesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptyCoursesSubtitle: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  uploadingContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: 200,
  },
  uploadingText: {
    marginTop: 10,
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InstructorProfile;
