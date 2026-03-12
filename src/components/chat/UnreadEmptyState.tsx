import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

interface UnreadEmptyStateProps {
  onViewAll: () => void;
}

const UnreadEmptyState: React.FC<UnreadEmptyStateProps> = ({ onViewAll }) => {
  return (
    <View style={styles.container}>
      {/* Icon with circular background */}
      <View style={styles.iconCircle}>
        <Ionicons name="mail-open-outline" size={75} color="#8A2BE2" />
      </View>

      {/* Text Content */}
      <Text style={styles.title}>All caught up!</Text>
      <Text style={styles.subtitle}>
        You have no unread messages. Good job staying on top of your chats!
      </Text>

      {/* Action Button */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={onViewAll}
        activeOpacity={0.6}
      >
        <Text style={styles.buttonText}>View All Chats</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: height * 0.1, // Offset for tab bar and search
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(138, 43, 226, 0.08)', // Light purple tint
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#7D7D7D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#8A2BE2',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default UnreadEmptyState;
