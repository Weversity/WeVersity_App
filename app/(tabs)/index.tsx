import LiveCourses from '@/src/components/LiveCourses';
import { useAuth } from '@/src/context/AuthContext';
import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const { user, profile, role } = useAuth();

  // Get first name from profile or metadata
  const firstName = profile?.first_name || user?.user_metadata?.first_name || 'Student';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.userName}>{firstName} ({role || 'User'})</Text>
        </View>
        <Text style={styles.headerText}>Real-Time Online Lessons</Text>
      </View>
      <View style={styles.contentArea}>
        <Text style={styles.sectionTitle}>Live Classes</Text>
        <LiveCourses />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F2F8',
  },
  header: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#8A2BE2', // Purple color
  },
  userInfo: {
    marginBottom: 10,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E0B0FF',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contentArea: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 5,
  }
});
