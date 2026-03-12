import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const EmptyChatState = () => {
  const router = useRouter();

  const steps = [
    { id: 1, text: 'Go to the Shorts page and scroll through videos.' },
    { id: 2, text: "Tap on the creator’s profile picture in the bottom-left corner of a video." },
    { id: 3, text: 'Open the creator’s profile and send them a chat request.' },
    { id: 4, text: 'Once the creator accepts your request, your conversation will appear here.' },
  ];

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Image */}
      <Image
        source={require('@/assets/images/emptychaticon.png')}
        style={styles.image}
        resizeMode="contain"
      />

      {/* Text Content */}
      <Text style={styles.title}>No conversations yet</Text>
      <Text style={styles.subtitle}>
        You don’t have any chats yet. Start a conversation by discovering creators on the Shorts page.
      </Text>

      {/* Instruction Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>HOW TO START A CONVERSATION</Text>
        
        {steps.map((step) => (
          <View key={step.id} style={styles.stepRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{step.id}</Text>
            </View>
            <Text style={styles.stepText}>{step.text}</Text>
          </View>
        ))}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/')}
        style={styles.buttonContainer}
      >
        <LinearGradient
          colors={['#8A2BE2', '#5D00B3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <Ionicons name="play" size={18} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Discover Creators</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F7FF', // Light lavender
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 40,
    paddingBottom: 60, // Increased bottom padding to prevent cutting off
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#7D7D7D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  card: {
    width: '100%',
    backgroundColor: '#F8F4FF', // Lighter purple background
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#F0E6FF',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8A2BE2',
    letterSpacing: 1,
    marginBottom: 20,
    textAlign: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8A2BE2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#4A4A4A',
    lineHeight: 18,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 27,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EmptyChatState;
