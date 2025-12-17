import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

// Data based on the provided image inspiration
const stats = [
  { id: '1', title: 'Total Students', value: '12,453', growth: '+14.5% vs Last Month', color: '#E0D4FC', icon: 'people', iconColor: '#8A2BE2' },
  { id: '2', title: 'Total Revenue', value: '$8,245', growth: '+12.5% vs Last Month', color: '#E0D4FC', icon: 'cash', iconColor: '#8A2BE2' },
  { id: '3', title: 'Course Rating', value: '4.8', growth: '+2.4% vs Last Month', color: '#E0D4FC', icon: 'star', iconColor: '#8A2BE2' },
];

interface Short {
  id: string;
  thumbnail: string; // uri
  type: 'image' | 'video';
  uri: string;
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

const SideMenu = ({ visible, onClose, logout, onGoLive, onUploadShort, onCreateCourse }: { visible: boolean; onClose: () => void; logout: () => void; onGoLive: () => void; onUploadShort: () => void; onCreateCourse: () => void }) => {
  if (!visible) return null;

  const menuItems = [
    { id: '1', title: 'Dashboard', icon: 'grid-outline', onPress: () => { onClose(); } },
    { id: '2', title: 'Go Live', icon: 'radio-outline', onPress: () => { onClose(); onGoLive(); } },
    { id: '3', title: 'Create Course', icon: 'add-circle-outline', onPress: () => { onClose(); onCreateCourse(); } },
    { id: '4', title: 'Upload Shorts', icon: 'phone-portrait-outline', onPress: () => { onClose(); onUploadShort(); } },
    { id: '5', title: 'Logout', icon: 'log-out-outline', onPress: logout },
  ];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>We Versity</Text>
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

const InstructorProfile = ({ logout }: { logout: () => void }) => {
  const { user, profile } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();

  // Camera State
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraVisible, setIsCameraVisible] = useState(false);

  // Shorts State
  const [shorts, setShorts] = useState<Short[]>([]);
  const [viewAllShortsVisible, setViewAllShortsVisible] = useState(false);
  const [selectedShort, setSelectedShort] = useState<Short | null>(null);

  const firstName = user?.user_metadata?.first_name;
  const lastName = user?.user_metadata?.last_name;
  const emailUsername = profile?.email?.split('@')[0] || user?.email?.split('@')[0];

  const instructorName = (firstName && lastName)
    ? `${firstName} ${lastName}`
    : (emailUsername || 'Instructor');

  // Use a default avatar if none exists
  const profilePic = user?.user_metadata?.avatar || 'https://example.com/default-avatar.png';

  useEffect(() => {
    loadShorts();
  }, []);

  const loadShorts = async () => {
    try {
      const storedShorts = await AsyncStorage.getItem('recent_shorts');
      if (storedShorts) {
        setShorts(JSON.parse(storedShorts));
      }
    } catch (error) {
      console.error('Failed to load shorts', error);
    }
  };

  const confirmDeleteShort = (id: string) => {
    Alert.alert(
      "Delete Short",
      "Are you sure you want to delete this short?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: () => deleteShort(id)
        }
      ]
    );
  };

  const deleteShort = async (id: string) => {
    const updatedShorts = shorts.filter(s => s.id !== id);
    setShorts(updatedShorts);
    await AsyncStorage.setItem('recent_shorts', JSON.stringify(updatedShorts));
  };

  const uploadShort = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // Pick media
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newShorts: Short[] = result.assets.map(asset => ({
        id: Date.now().toString() + Math.random().toString(),
        thumbnail: asset.uri, // Use URI as thumb for now
        type: asset.type === 'video' ? 'video' : 'image',
        uri: asset.uri,
        createdAt: new Date().toISOString(),
        title: asset.fileName || (asset.type === 'video' ? 'New Video Short' : 'New Image Short'),
      }));

      const updatedShorts = [...newShorts, ...shorts];
      setShorts(updatedShorts);
      await AsyncStorage.setItem('recent_shorts', JSON.stringify(updatedShorts));
    }
  };

  const handleGoLive = async () => {
    if (!permission) {
      // Permission is still loading
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();
      if (result.granted) {
        setIsCameraVisible(true);
      }
    } else {
      setIsCameraVisible(true);
    }
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
              {profilePic && profilePic !== 'https://example.com/default-avatar.png' ? (
                <Image source={{ uri: profilePic }} style={styles.headerProfilePic} />
              ) : (
                <View style={[styles.headerProfilePic, { backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    {firstName?.[0]?.toUpperCase()}{lastName?.[0]?.toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.profileTextContainer}>
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.profileTypeText}>{instructorName}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.welcomeTitle}>Welcome back, {instructorName}!</Text>
        <Text style={styles.welcomeSubtitle}>Here is what's happening with your courses today.</Text>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={styles.statInfo}>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <View style={styles.growthContainer}>
                  <Ionicons name="trending-up" size={16} color="#4CAF50" />
                  <Text style={styles.growthText}>{stat.growth}</Text>
                </View>
              </View>
              <View style={[styles.statIconContainer, { backgroundColor: stat.color }]}>
                <Ionicons name={stat.icon as any} size={24} color={stat.iconColor} />
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <TouchableOpacity style={styles.actionButton} onPress={handleGoLive}>
          <View style={styles.actionIconCircle}>
            <Ionicons name="radio-outline" size={24} color="#8A2BE2" />
          </View>
          <View>
            <Text style={styles.actionTitle}>Go Live</Text>
            <Text style={styles.actionSubtitle}>Stream to your students</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/createCourse')}>
          <View style={styles.actionIconCircle}>
            <Ionicons name="add" size={30} color="#8A2BE2" />
          </View>
          <View>
            <Text style={styles.actionTitle}>New Course</Text>
            <Text style={styles.actionSubtitle}>Create a curriculum</Text>
          </View>
        </TouchableOpacity>

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
            <Text style={styles.emptyShortsText}>No shorts uploaded yet</Text>
          ) : (
            shorts.slice(0, 3).map(short => (
              <TouchableOpacity key={short.id} style={styles.shortItem} onPress={() => setSelectedShort(short)}>
                <Image source={{ uri: short.thumbnail }} style={styles.shortIcon} />
                <View style={styles.shortInfo}>
                  <Text style={styles.shortTitle} numberOfLines={1}>{short.title || 'Untitled Short'}</Text>
                  <Text style={styles.shortTime}>{getTimeAgo(short.createdAt)}</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDeleteShort(short.id)}>
                  <Ionicons name="trash-outline" size={20} color="#FF5252" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Your Uploaded Courses Section */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Uploaded Courses</Text>
            <TouchableOpacity onPress={() => router.push('/myUploadedCourses')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Mock Data for uploaded courses - limiting to 2 for preview */}
          {[
            {
              id: '1',
              title: 'Advanced React Patterns',
              category: 'Development',
              status: 'PUBLISHED',
              image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop',
            },
            {
              id: '2',
              title: 'Next.js 14 Fundamentals',
              category: 'Development',
              status: 'DRAFT',
              image: 'https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?q=80&w=2664&auto=format&fit=crop',
            }
          ].map((course) => (
            <View key={course.id} style={styles.uploadedCourseCard}>
              <Image source={{ uri: course.image }} style={styles.uploadedCourseImage} />
              <View style={styles.uploadedCourseContent}>
                <Text style={styles.uploadedCourseTitle} numberOfLines={1}>{course.title}</Text>
                <Text style={styles.uploadedCourseCategory}>{course.category}</Text>
                <View style={[styles.statusBadge, course.status === 'PUBLISHED' ? styles.statusPublished : styles.statusDraft]}>
                  <Text style={[styles.statusText, course.status === 'PUBLISHED' ? styles.statusTextPublished : styles.statusTextDraft]}>
                    {course.status}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editCourseButton}>
                <Ionicons name="pencil-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

      </ScrollView>

      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        logout={logout}
        onGoLive={handleGoLive}
        onUploadShort={uploadShort}
        onCreateCourse={() => router.push('/createCourse')}
      />

      {/* Camera Modal */}
      <Modal visible={isCameraVisible} animationType="slide" onRequestClose={() => setIsCameraVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <CameraView style={{ flex: 1 }} facing="front">
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setIsCameraVisible(false)}>
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>

              <View style={styles.liveIndicator}>
                <View style={styles.redDot} />
                <Text style={styles.liveText}>PREVIEW</Text>
              </View>

              <TouchableOpacity style={styles.startStreamBtn}>
                <Text style={styles.startStreamText}>Start Stream</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>

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
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.shortItem} onPress={() => setSelectedShort(item)}>
                <Image source={{ uri: item.thumbnail }} style={styles.shortIcon} />
                <View style={styles.shortInfo}>
                  <Text style={styles.shortTitle} numberOfLines={1}>{item.title || 'Untitled Short'}</Text>
                  <Text style={styles.shortTime}>{getTimeAgo(item.createdAt)}</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDeleteShort(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#FF5252" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
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
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: '#4CAF50',
    fontWeight: '600',
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
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0D4FC',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    height: 120,
  },
  actionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F4F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  recentSection: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    alignItems: 'center',
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadedCourseImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  uploadedCourseContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  uploadedCourseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  uploadedCourseCategory: {
    fontSize: 10,
    color: '#888',
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPublished: {
    backgroundColor: '#E8F5E9',
  },
  statusDraft: {
    backgroundColor: '#F5F5F5',
  },
  statusText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  statusTextPublished: {
    color: '#4CAF50',
  },
  statusTextDraft: {
    color: '#757575',
  },
  editCourseButton: {
    padding: 8,
  },
});

export default InstructorProfile;
