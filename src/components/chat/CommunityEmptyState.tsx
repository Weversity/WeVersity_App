import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface CommunityEmptyStateProps {
  role: 'Instructor' | 'Student' | string | null;
}

const CommunityEmptyState: React.FC<CommunityEmptyStateProps> = ({ role }) => {
  const router = useRouter();
  const isInstructor = role?.toLowerCase() === 'instructor';

  const instructorSteps = [
    { id: 1, text: 'Visit our website and login with your mobile account.' },
    { id: 2, text: 'Go to your Instructor Dashboard.' },
    { id: 3, text: 'Create and publish your first course.' },
    { id: 4, text: 'Your course community will appear here and on the website.' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Icon/Image Section */}
      <View style={styles.imageContainer}>
        <LinearGradient
          colors={['#F3E8FF', '#FFFFFF']}
          style={styles.iconCircle}
        >
          <Ionicons 
            name={isInstructor ? "school-outline" : "people-outline"} 
            size={60} 
            color="#8A2BE2" 
          />
        </LinearGradient>
      </View>

      {/* Text Content */}
      <Text style={styles.title}>
        {isInstructor ? "No Communities Yet" : "Your Learning Journey Awaits"}
      </Text>
      
      <Text style={styles.subtitle}>
        {isInstructor 
          ? "You haven't published any courses yet. Once you publish a course, a community group will be automatically created for you."
          : "You aren't enrolled in any courses yet. Enroll in a course to automatically join its dedicated group and start collaborating with peers."}
      </Text>

      {isInstructor ? (
        /* Instructor Guide Card */
        <View style={styles.card}>
          <Text style={styles.cardTitle}>HOW TO SHOW COMMUNITIES</Text>
          
          {instructorSteps.map((step) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{step.id}</Text>
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>
      ) : (
        /* Student Action Button */
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/myCourses')}
          style={styles.buttonContainer}
        >
          <LinearGradient
            colors={['#8A2BE2', '#5D00B3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Ionicons name="rocket-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Explore Courses</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      
      {!isInstructor && (
        <Text style={styles.footerText}>
          Start your journey today and connect with thousands of learners!
        </Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 40,
    paddingBottom: 60,
  },
  imageContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  card: {
    width: '100%',
    padding: 10,
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8A2BE2',
    letterSpacing: 1.2,
    marginBottom: 20,
    textAlign: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#8A2BE2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  footerText: {
    marginTop: 24,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  }
});

export default CommunityEmptyState;
