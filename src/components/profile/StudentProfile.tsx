import { supabase } from '@/src/auth/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NotificationIcon from '../notifications/NotificationIcon';

const { width } = Dimensions.get('window');
const LIVE_CARD_WIDTH = width * 0.85;

// Mock Data replaced by real data via useEffect

const continueLearning = [
  { id: '1', title: 'UIUX Design', timeLeft: '2 hours remaining', progress: 0.6, icon: 'color-palette', color: '#FF6B6B' },
  { id: '2', title: 'Web Development', timeLeft: 'Module 2: Syllabus', progress: 0.3, icon: 'globe', color: '#4ECDC4' },
];


const SideMenu = ({ visible, onClose, router, profileData }: { visible: boolean; onClose: () => void; router: any; profileData?: any }) => {
  const { logout, user } = useAuth(); // Get logout and user from useAuth
  if (!visible) return null;

  const displayAvatar = profileData?.avatar_url || user?.user_metadata?.avatar || user?.user_metadata?.avatar_url;
  const firstName = profileData?.first_name || user?.user_metadata?.first_name || 'Student';
  const lastName = profileData?.last_name || user?.user_metadata?.last_name || '';
  const initials = `${firstName[0]}${lastName[0] || ''}`.toUpperCase();

  const menuItemsStudent = [
    { id: '1', title: 'Dashboard', icon: 'grid-outline', onPress: () => { onClose(); } },
    { id: '2', title: 'Upcoming', icon: 'calendar-outline', onPress: () => { onClose(); router.push('/upcoming'); } },
    { id: '4', title: 'Mentors/Instructors', icon: 'school-outline', onPress: () => { onClose(); router.push(`/allMentors`); } },
    { id: '6', title: 'Following', icon: 'people-outline', onPress: () => { onClose(); router.push('/followers'); } },
    { id: '35', title: 'Notifications', icon: 'notifications-outline', onPress: () => { onClose(); router.push('/notifications'); } },
    { id: '5', title: 'Support', icon: 'help-circle-outline', onPress: () => { onClose(); router.push('/support'); } },
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
            {menuItemsStudent.map((item, index) => (
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
            <TouchableOpacity key="logout" style={styles.menuItem} onPress={logout}>
              <Ionicons name="log-out-outline" size={22} color="#8A2BE2" />
              <Text style={styles.menuItemText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const StudentProfile = () => {
  const { role, user, profile } = useAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const userDisplayName = (dynamicFirstName && dynamicLastName)
    ? `${dynamicFirstName} ${dynamicLastName}`
    : (dynamicFirstName || emailUsername || 'Student');

  const displayAvatar = profileData?.avatar_url || user?.user_metadata?.avatar || user?.user_metadata?.avatar_url;
  const initials = `${(dynamicFirstName || 'S')[0]}${(dynamicLastName || '')[0]}`.toUpperCase();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedCourseTab, setSelectedCourseTab] = useState('Technical Courses');
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [activeSessions, setActiveSessions] = useState<any[]>([]); // Changed to array
  const [topInstructors, setTopInstructors] = useState<any[]>([]);
  const [isLoadingInstructors, setIsLoadingInstructors] = useState(true);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [isInitialLiveLoading, setIsInitialLiveLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentOffset, setCurrentOffset] = useState(0);

  // Create animated value for pulse effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Timer state for forcing re-renders every minute
  const [now, setNow] = useState(Date.now());
  const router = useRouter();


  // 1. Setup Pulse Animation
  useEffect(() => {
    const startPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    if (activeSessions.length > 0) {
      startPulse();
    } else {
      pulseAnim.setValue(1); // Reset if no session
    }
  }, [activeSessions.length]);

  // 2. Timer Effect (Updates 'now' every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, []);

  // Helper to format time ago
  const formatTimeAgo = (startedAt: string) => {
    if (!startedAt) return 'Live Now';
    const diffMs = now - new Date(startedAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just started';
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m ago`;
  };



  const handleScrollNext = () => {
    if (!scrollViewRef.current) return;
    const nextOffset = currentOffset + LIVE_CARD_WIDTH + 15;
    const maxOffset = (activeSessions.length - 1) * (LIVE_CARD_WIDTH + 15);

    if (nextOffset <= maxOffset + 5) { // Small buffer
      scrollViewRef.current.scrollTo({ x: nextOffset, animated: true });
      setCurrentOffset(nextOffset);
    }
  };

  const handleScrollBack = () => {
    if (!scrollViewRef.current) return;
    const nextOffset = Math.max(0, currentOffset - (LIVE_CARD_WIDTH + 15));
    scrollViewRef.current.scrollTo({ x: nextOffset, animated: true });
    setCurrentOffset(nextOffset);
  };
  const isFetchingRef = useRef(false);
  const debounceTimerRef = useRef<any>(null);

  // Separate lightweight fetch functions - Lifted for onRefresh access
  const fetchUpcomingCount = async (supabase: any) => {
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tonight = new Date(); tonight.setHours(23, 59, 59, 999);

      // Fetch ALL sessions scheduled for today (past & future)
      const { data, error } = await supabase
        .from('live_sessions')
        .select('scheduled_at') // We only need the time
        .gte('scheduled_at', today.toISOString())
        .lte('scheduled_at', tonight.toISOString());

      if (error) {
        console.error('Error fetching upcoming count:', error);
        return;
      }

      if (data) {
        const now = new Date();
        // Client-side filter: Only count sessions where time is in the future
        const upcoming = data.filter((session: any) => {
          if (!session.scheduled_at) return false;
          // Parse UTC date string from Supabase
          const sessionDate = new Date(session.scheduled_at);
          return sessionDate > now;
        });

        console.log(`DEBUG: Found ${data.length} sessions today. ${upcoming.length} are upcoming.`);
        setUpcomingCount(upcoming.length);
      }
    } catch (err) {
      console.error('Exception in fetchUpcomingCount:', err);
    }
  };

  const fetchLiveSessions = async (supabase: any) => {
    if (!user?.id) {
      console.log('DEBUG DASHBOARD: No user ID, skipping fetch.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*, instructor:profiles!instructor_id(first_name, last_name, avatar_url), course:courses(title, image_url, categories)')
        .in('status', ['live', 'upcoming', 'Live', 'Upcoming'])
        .order('scheduled_at', { ascending: true });

      console.log('DEBUG DASHBOARD: Raw Supabase Data:', data);

      if (error) {
        console.error('DEBUG DASHBOARD: Error fetching:', error);
        return;
      }

      if (data && data.length > 0) {
        const nowTs = new Date().getTime();
        const fiveMinutesInMs = 5 * 60 * 1000;
        const todayDate = new Date().toDateString();

        // EXACT Visibility Logic from LivePage
        const filteredSessionsRows = data.filter((session: any) => {
          const status = (session.status || '').toLowerCase();

          // Show if live
          if (status === 'live' || status === 'active') return true;

          // If upcoming, show if starting soon or passed today (Matching LivePage)
          if (status === 'upcoming') {
            if (!session.scheduled_at) return false;

            const scheduledTime = new Date(session.scheduled_at).getTime();
            const scheduledDate = new Date(session.scheduled_at).toDateString();

            const isSoonOrPassed = scheduledTime <= (nowTs + fiveMinutesInMs);
            const isToday = scheduledDate === todayDate;

            return isSoonOrPassed && isToday;
          }

          return false;
        });

        console.log('DEBUG DASHBOARD: Filtered Sessions:', filteredSessionsRows);

        const processed = await Promise.all(filteredSessionsRows.map(async (s: any) => {
          // Safe mapping with null fallbacks (Requested by User)
          const course = s.course || {};
          const instructor = s.instructor || {};
          const instructorName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || 'Instructor';

          return {
            id: s.id,
            title: s.title || course.title || 'Live Session',
            instructor: instructorName,
            viewers: 0,
            startedAt: s.started_at || s.scheduled_at,
            image: s.image_url || course.image_url || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=2070&auto=format&fit=crop',
          };
        }));
        setActiveSessions(processed);
      } else {
        setActiveSessions([]);
      }
    } catch (err) {
      console.error('DEBUG DASHBOARD: Catch Error:', err);
    } finally {
      setIsInitialLiveLoading(false);
    }
  };

  const fetchInstructors = async (supabase: any) => {
    const { data } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url').eq('role', 'instructor').limit(10);
    if (data) {
      setTopInstructors(data.map((p: any) => ({
        id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Instructor',
        avatar: p.avatar_url,
        initials: `${p.first_name?.[0] || 'I'}${p.last_name?.[0] || 'N'}`
      })));
    }
    setIsLoadingInstructors(false);
  };

  const fetchEnrollments = async (supabase: any) => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('enrollments')
      .select('completed_lessons, course:courses(id, title, image_url, total_lessons, instructor:profiles(first_name, last_name))')
      .eq('student_id', user.id)
      .order('id', { ascending: false })
      .limit(3);

    if (error || !data || data.length === 0) {
      setRecentCourses([]);
      setIsLoadingRecent(false);
      return;
    }

    const mapped = data.map((e: any) => {
      const c = e.course;
      const inst = Array.isArray(c.instructor) ? c.instructor[0] : c.instructor;
      const instructorName = inst ? `${inst.first_name || ''} ${inst.last_name || ''}`.trim() : 'Instructor';
      const completedCount = Array.isArray(e.completed_lessons) ? e.completed_lessons.length : (typeof e.completed_lessons === 'number' ? e.completed_lessons : 0);
      const totalItems = c.total_lessons || 12;
      return {
        id: c.id,
        title: c.title,
        instructor: instructorName,
        image: c.image_url || 'https://via.placeholder.com/150',
        progress: totalItems > 0 ? Math.min(completedCount / totalItems, 1) : 0
      };
    }).filter(Boolean);
    setRecentCourses(mapped);
    setIsLoadingRecent(false);
  };

  useEffect(() => {
    let subscription: any;




    const initializeDashboard = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      console.log('DEBUG: Initializing dashboard. User ID:', user?.id);

      try {
        const { supabase } = await import('@/src/auth/supabase');

        // Execute separate lightweight fetches
        await Promise.all([
          fetchProfileData(),
          fetchUpcomingCount(supabase),
        ]);

        if (user?.id) {
          await Promise.all([
            fetchLiveSessions(supabase),
            fetchInstructors(supabase),
            fetchEnrollments(supabase)
          ]);
        }

        // E. Debounced Real-time Subscription
        subscription = (supabase as any)
          .channel('live_sessions_minimal')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, () => {
            // Debounce to prevent rapid refetches
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
              if (user?.id && !isFetchingRef.current) fetchLiveSessions(supabase);
            }, 2000);
          })
          .subscribe();

      } catch (err: any) {
        if (err?.name === 'AuthSessionMissingError' || err?.message?.includes('session')) return;
        console.error('Error initializing dashboard:', err);
      } finally {
        isFetchingRef.current = false;
      }
    };

    initializeDashboard();

    return () => {
      if (subscription) subscription.unsubscribe();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      isFetchingRef.current = false;
    };
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    const { supabase } = await import('@/src/auth/supabase');
    await Promise.all([
      fetchProfileData(),
      fetchUpcomingCount(supabase),
      fetchLiveSessions(supabase),
      fetchInstructors(supabase),
      fetchEnrollments(supabase)
    ]);
    setRefreshing(false);
  };


  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#8A2BE2', '#9D50E5']}
          style={StyleSheet.absoluteFill}
        />
        {/* Custom Header Bar */}
        <View style={styles.topBar}>
          <View style={styles.profileContainer}>
            <TouchableOpacity onPress={() => router.push('/profileSettings')}>
              {displayAvatar && displayAvatar.trim() !== '' && displayAvatar.startsWith('http') ? (
                <Image source={{ uri: displayAvatar }} key={displayAvatar || 'avatar'} style={styles.headerProfilePic} />
              ) : (
                <View style={[styles.headerProfilePic, { backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{initials}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.profileTextContainer}>
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.profileTypeText}>{userDisplayName}</Text>
            </View>
          </View>
          <View style={styles.topBarRight}>
            <NotificationIcon />
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8A2BE2']} />}
      >

        {/* Welcome Card */}
        <LinearGradient
          colors={['#8A2BE2', '#7B1FA2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeCard}
        >
          <View style={styles.welcomeHeader}>
            <Text style={styles.welcomeTitle}>Welcome back, {userDisplayName}! 👋</Text>
          </View>
          <Text style={styles.welcomeSubtitle}>
            You have {upcomingCount === 0 ? 'no' : upcomingCount} upcoming {upcomingCount === 1 ? 'class' : 'classes'} today.
          </Text>

          <TouchableOpacity style={styles.aiHelpButton} onPress={() => router.push({ pathname: '/support', params: { chat: 'true' } })}>
            <Text style={styles.aiHelpText}>Ask AI Help</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Live Now Section */}
        <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {activeSessions.length > 0 && (
              <Animated.View
                style={[
                  styles.redDot,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.2],
                      outputRange: [1, 0.6]
                    })
                  }
                ]}
              />
            )}
            <Text style={styles.liveNowText}>Live Now</Text>
          </View>

          {activeSessions.length > 1 && (
            <View style={styles.sliderNavRow}>
              <TouchableOpacity
                style={styles.navCircle}
                onPress={handleScrollBack}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={18} color="#8A2BE2" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navCircle}
                onPress={handleScrollNext}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={18} color="#8A2BE2" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isInitialLiveLoading ? (
          <View style={[styles.emptyLiveCard, { borderStyle: 'solid' }]}>
            <ActivityIndicator size="large" color="#8A2BE2" />
            <Text style={[styles.emptyLiveText, { marginTop: 10 }]}>Loading live sessions...</Text>
          </View>
        ) : activeSessions.length > 0 ? (
          <ScrollView
            ref={scrollViewRef}
            horizontal={activeSessions.length > 1}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={activeSessions.length > 1 ? LIVE_CARD_WIDTH + 15 : undefined}
            snapToAlignment="start"
            contentContainerStyle={activeSessions.length > 1 ? { paddingRight: 20 } : {}}
            onMomentumScrollEnd={(e) => setCurrentOffset(e.nativeEvent.contentOffset.x)}
            scrollEventThrottle={16}
          >
            {activeSessions.map((session, index) => (
              <View
                key={session.id}
                style={[
                  styles.liveCard,
                  activeSessions.length > 1
                    ? { width: LIVE_CARD_WIDTH, marginRight: 15 }
                    : { width: width - 40 }
                ]}
              >
                <View style={styles.liveImageContainer}>
                  <Image source={{ uri: session.image }} style={styles.liveImage} />
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                </View>
                <View style={styles.liveContent}>
                  <Text style={styles.liveTitle} numberOfLines={1}>{session.title}</Text>
                  <Text style={styles.liveInstructor} numberOfLines={2}>{session.instructor}</Text>

                  <View style={styles.liveMetaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={16} color="#8A2BE2" />
                      <Text style={styles.metaText}>{formatTimeAgo(session.startedAt)}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.joinSessionButton}
                    onPress={() => router.push(`/live/${session.id}` as any)}
                  >
                    <Text style={styles.joinSessionText}>Join Session</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyLiveCard}>
            <Ionicons name="videocam-off-outline" size={32} color="#8A2BE2" />
            <Text style={styles.emptyLiveText}>No live classes right now</Text>
          </View>
        )}

        {/* Top Mentors Section */}
        <View style={styles.mentorsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Top Mentors</Text>
            <TouchableOpacity onPress={() => router.push('/allMentors')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mentorsScrollContainer}
          >
            {isLoadingInstructors ? (
              <ActivityIndicator color="#8A2BE2" style={{ marginLeft: 20 }} />
            ) : topInstructors.length > 0 ? (
              topInstructors.map(mentor => (
                <TouchableOpacity key={mentor.id} style={styles.mentorCard}>
                  {mentor.avatar ? (
                    <Image source={{ uri: mentor.avatar }} style={styles.mentorAvatar} />
                  ) : (
                    <View style={[styles.mentorAvatar, styles.initialsContainer]}>
                      <Text style={styles.initialsText}>{mentor.initials}</Text>
                    </View>
                  )}
                  <Text style={styles.mentorName} numberOfLines={1}>{mentor.name}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.seeAllText, { marginLeft: 20, color: '#666' }]}>No mentors found</Text>
            )}
          </ScrollView>
        </View>

        {/* Recent Courses */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Courses</Text>
          <TouchableOpacity onPress={() => router.push('/allWatchedCourses' as any)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {isLoadingRecent ? (
          <ActivityIndicator color="#8A2BE2" style={{ marginVertical: 20 }} />
        ) : recentCourses.length > 0 ? (
          recentCourses.map((item, index) => (
            <TouchableOpacity key={`${item.id}-${index}`} style={styles.learningCard} onPress={() => router.push(`/courseDetails/${item.id}` as any)}>
              <Image source={{ uri: item.image }} style={styles.courseCardImage} />
              <View style={styles.learningContent}>
                <View style={styles.learningHeader}>
                  <Text style={styles.learningTitle}>{item.title}</Text>
                </View>
                <Text style={styles.instructorName}>{item.instructor}</Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${Math.max((item.progress || 0) * 100, 2)}%`, backgroundColor: '#8A2BE2' }]} />
                </View>
                <Text style={styles.learningTime}>{Math.round((item.progress || 0) * 100)}% complete</Text>
              </View>
              <Ionicons name="play" size={18} color="#aaa" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyRecentCard}>
            <Ionicons name="school-outline" size={48} color="#ccc" />
            <Text style={styles.emptyRecentTitle}>Your learning journey starts here!</Text>
            <Text style={styles.emptyRecentSubtitle}>Explore our courses and enroll today.</Text>
            <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/myCourses')}>
              <Text style={styles.exploreButtonText}>Explore Courses</Text>
            </TouchableOpacity>
          </View>
        )}


      </ScrollView>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} router={router} profileData={profileData} />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    gap: 12,
  },
  menuAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  menuProfileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  header: {
    paddingTop: 50, // Adjusted for status bar
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden', // Ensures the gradient stays within the rounded corners
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  topBarRight: {
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
  headerProfilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  welcomeCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#E0E0E0',
    marginBottom: 20,
    lineHeight: 18,
  },
  joinClassButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  joinClassText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  aiHelpButton: {
    backgroundColor: 'transparent',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  aiHelpText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'red',
    marginRight: 6,
  },
  liveNowText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  sliderNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1BEE7',
  },
  liveCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  liveImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  liveImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  liveContent: {
    paddingHorizontal: 4,
  },
  liveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  liveInstructor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  liveMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  joinSessionButton: {
    backgroundColor: '#8A2BE2',
    borderRadius: 25, // Fully rounded
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinSessionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyLiveCard: {
    backgroundColor: '#F8F4FF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0D4FC',
    borderStyle: 'dashed',
    marginBottom: 25,
  },
  emptyLiveText: {
    color: '#8A2BE2',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  learningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12, // More balanced padding
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  instructorName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  learningContent: {
    flex: 1,
    marginLeft: 15,
    marginRight: 15, // Ensure space from play button
  },
  learningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  learningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginBottom: 6,
    width: '100%', // Use full width of content column
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  learningTime: {
    fontSize: 10,
    color: '#888',
  },
  // Mentors Section
  mentorsSection: {
    marginBottom: 25,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#8A2BE2',
    fontSize: 14,
    fontWeight: '600',
  },
  mentorsScrollContainer: {
    paddingRight: 20,
  },
  mentorCard: {
    alignItems: 'center',
    marginRight: 15,
    width: 70,
  },
  mentorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#8A2BE2',
  },
  mentorName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  initialsContainer: {
    backgroundColor: '#E6E6FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#8A2BE2',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyRecentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 20,
  },
  emptyRecentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    textAlign: 'center',
  },
  emptyRecentSubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  exploreButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Courses Section
  coursesSection: {
    marginBottom: 25,
  },
  courseTabsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  courseTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  courseTabActive: {
    backgroundColor: '#8A2BE2',
  },
  courseTabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  courseTabTextActive: {
    color: '#fff',
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  courseCardImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#8A2BE2',
  },
  courseCardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  courseCardCategory: {
    backgroundColor: '#E6E6FA',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  courseCardCategoryText: {
    color: '#8A2BE2',
    fontSize: 10,
    fontWeight: 'bold',
  },
  courseCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  courseCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseCardPrice: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  courseCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseCardRatingText: {
    fontSize: 12,
    color: '#666',
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
});

export default StudentProfile;
