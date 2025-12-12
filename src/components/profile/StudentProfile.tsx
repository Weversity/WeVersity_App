import { useAuth } from '@/src/context/AuthContext';
import { INITIAL_COURSES } from '@/src/data/courses';
import { MENTORS } from '@/src/data/mentorsStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// Mock Data
const user = {
  name: 'Alex',
  profilePic: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=2080&auto=format&fit=crop',
};

const liveClass = {
  title: 'UIUX Design',
  instructor: 'Sir Ahared',
  viewers: 1250,
  timeAgo: '15m ago',
  image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=2070&auto=format&fit=crop',
};

const continueLearning = [
  { id: '1', title: 'UIUX Design', timeLeft: '2 hours remaining', progress: 0.6, icon: 'color-palette', color: '#FF6B6B' },
  { id: '2', title: 'Web Development', timeLeft: 'Module 2: Syllabus', progress: 0.3, icon: 'globe', color: '#4ECDC4' },
];

const schedule = [
  { id: '1', title: 'UIUX Design', time: 'Now - 6th March 09:00', status: 'HAPPENING NOW', icon: 'brush', color: '#E0D4FC' },
  { id: '2', title: 'Web Development', time: '13:00 PM - 1st April 2024', status: 'UPCOMING', icon: 'code', color: '#E0D4FC' },
  { id: '3', title: 'Social Media Marketing', time: '15:30 PM - 14th April 2024', status: 'UPCOMING', icon: 'share-social', color: '#E0D4FC' },
];

const SideMenu = ({ visible, onClose, router }: { visible: boolean; onClose: () => void; router: any }) => {
  const { logout } = useAuth(); // Get logout from useAuth
  if (!visible) return null;

  const menuItemsStudent = [
    { id: '1', title: 'My Courses', icon: 'book-outline', onPress: () => { onClose(); router.push('/myCourses'); } },
    { id: '2', title: 'Upcoming', icon: 'calendar-outline', onPress: () => { onClose(); router.push('/upcoming'); } },
    { id: '3', title: 'Inbox', icon: 'mail-outline', onPress: () => { onClose(); router.push('/inbox'); } },
    { id: '4', title: 'Followers', icon: 'people-outline', onPress: () => { onClose(); router.push('/followers'); } },
    { id: '5', title: 'Support', icon: 'help-circle-outline', onPress: () => { onClose(); router.push('/support'); } },
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
  const { role } = useAuth();

  const userDisplayName = user.name || 'Student';
  const userProfilePic = user.profilePic || 'https://via.placeholder.com/150';
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedCourseTab, setSelectedCourseTab] = useState('Technical Courses');
  const router = useRouter();

  // Get top 5 mentors for display
  const topMentors = MENTORS.slice(0, 5);

  // Filter courses based on selected tab
  const popularCourses = INITIAL_COURSES.filter(
    course => course.category === selectedCourseTab
  ).slice(0, 2);
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
              <Image source={{ uri: userProfilePic }} style={styles.headerProfilePic} />
            </TouchableOpacity>
            <View style={styles.profileTextContainer}>
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.profileTypeText}>Student Profile</Text>
            </View>
          </View>
          <View style={styles.topBarRight}>
            <TouchableOpacity onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

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
            You have 2 upcoming classes today and 1 assignment due tomorrow.
          </Text>

          <TouchableOpacity style={styles.joinClassButton}>
            <Text style={styles.joinClassText}>Join Class</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.aiHelpButton} onPress={() => router.push({ pathname: '/support', params: { chat: 'true' } })}>
            <Text style={styles.aiHelpText}>Ask AI Help</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Live Now Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.redDot} />
          <Text style={styles.liveNowText}>Live Now</Text>
        </View>

        <View style={styles.liveCard}>
          <Image source={{ uri: liveClass.image }} style={styles.liveImage} />
          <View style={styles.liveContent}>
            <Text style={styles.liveTitle}>{liveClass.title}</Text>
            <Text style={styles.liveInstructor}>{liveClass.instructor}</Text>

            <View style={styles.liveMetaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={16} color="#8A2BE2" />
                <Text style={styles.metaText}>{liveClass.viewers}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#8A2BE2" />
                <Text style={styles.metaText}>{liveClass.timeAgo}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.joinSessionButton}>
              <Text style={styles.joinSessionText}>Join Session</Text>
            </TouchableOpacity>
          </View>
        </View>

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
            {topMentors.map(mentor => (
              <TouchableOpacity key={mentor.id} style={styles.mentorCard}>
                <Image source={{ uri: mentor.avatar }} style={styles.mentorAvatar} />
                <Text style={styles.mentorName}>{mentor.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Continue Learning */}
        <Text style={styles.sectionTitle}>Continue Learning</Text>
        {continueLearning.map(item => (
          <View key={item.id} style={styles.learningCard}>
            <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
              {/* Adding opacity to color for background */}
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.learningContent}>
              <View style={styles.learningHeader}>
                <Text style={styles.learningTitle}>{item.title}</Text>
                <Ionicons name="play" size={16} color="#aaa" />
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${item.progress * 100}%`, backgroundColor: '#4CD964' }]} />
              </View>
              <Text style={styles.learningTime}>{item.timeLeft}</Text>
            </View>
          </View>
        ))}

        {/* Most Popular Courses Section */}
        <View style={styles.coursesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Most Popular Courses</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/myCourses')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Course Tabs */}
          <View style={styles.courseTabsContainer}>
            <TouchableOpacity
              style={[
                styles.courseTab,
                selectedCourseTab === 'Technical Courses' && styles.courseTabActive
              ]}
              onPress={() => setSelectedCourseTab('Technical Courses')}
            >
              <Text
                style={[
                  styles.courseTabText,
                  selectedCourseTab === 'Technical Courses' && styles.courseTabTextActive
                ]}
              >
                Technical Courses
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.courseTab,
                selectedCourseTab === 'Skills Courses' && styles.courseTabActive
              ]}
              onPress={() => setSelectedCourseTab('Skills Courses')}
            >
              <Text
                style={[
                  styles.courseTabText,
                  selectedCourseTab === 'Skills Courses' && styles.courseTabTextActive
                ]}
              >
                Skill Courses
              </Text>
            </TouchableOpacity>
          </View>

          {/* Course Cards */}
          {popularCourses.map(course => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => router.push(`/courseDetails/${course.id}` as any)}
            >
              <Image source={{ uri: course.image }} style={styles.courseCardImage} />
              <View style={styles.courseCardContent}>
                <View style={styles.courseCardCategory}>
                  <Text style={styles.courseCardCategoryText}>{course.subCategory}</Text>
                </View>
                <Text style={styles.courseCardTitle}>{course.title}</Text>
                <View style={styles.courseCardFooter}>
                  <Text style={styles.courseCardPrice}>{course.isFree ? 'Free' : 'Paid'}</Text>
                  <View style={styles.courseCardRating}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.courseCardRatingText}>{course.rating}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Schedule */}
        <View style={styles.scheduleContainer}>
          <Text style={styles.scheduleTitle}>Today's Schedule</Text>

          {schedule.map((item, index) => (
            <View key={item.id} style={styles.scheduleItem}>
              <View style={[styles.scheduleIconCircle, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={20} color="#8A2BE2" />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleItemTitle}>{item.title}</Text>
                <Text style={styles.scheduleTime}>{item.time}</Text>
                {item.status === 'HAPPENING NOW' && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>HAPPENING NOW</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} router={router} />
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
    fontSize: 20,
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
  liveImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  learningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
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
  learningContent: {
    flex: 1,
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
    width: '80%', // Not full width to leave space
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  learningTime: {
    fontSize: 10,
    color: '#888',
  },
  scheduleContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginTop: 10,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  scheduleItem: {
    flexDirection: 'row',
    marginBottom: 24, // Spacing between items
  },
  scheduleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  scheduleContent: {
    flex: 1,
    justifyContent: 'center',
  },
  scheduleItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: '#FF6B6B30', // Light red bg
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FF6B6B',
    fontSize: 10,
    fontWeight: 'bold',
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
});

export default StudentProfile;
