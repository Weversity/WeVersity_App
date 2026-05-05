import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface ReferralCardProps {
  role: 'Student' | 'Instructor';
}

const ReferralCard: React.FC<ReferralCardProps> = ({ role }) => {
  const router = useRouter();
  
  // Floating animation for icons
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const handlePress = () => {
    router.push('/instructor/referrals');
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={handlePress}
      style={styles.container}
    >
      <LinearGradient
        colors={['#8A2BE2', '#4B0082']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Background Bubbles/Blobs */}
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'transparent']}
          style={styles.bubbleLeft}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'transparent']}
          style={styles.bubbleBottom}
        />

        <View style={styles.content}>
          <View style={styles.textContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SPECIAL OFFER</Text>
            </View>
            
            <View style={styles.rewardRow}>
              <Text style={styles.rewardText}>1,000</Text>
              <Text style={styles.coinLabel}>WeCoins</Text>
            </View>
            
            <Text style={styles.subtitle} numberOfLines={2}>
              Earn rewards for every friend who joins WeVersity.
            </Text>
            
            <View style={styles.button}>
              <Text style={styles.buttonText}>Invite Friends</Text>
              <Ionicons name="arrow-forward" size={16} color="#8A2BE2" />
            </View>
          </View>
          
          <View style={styles.imageSection}>
            {/* Invite & Earn overlay */}
            <View style={styles.overlayTextContainer}>
              <Text style={styles.overlayTitle}>INVITE & EARN</Text>
            </View>

            {/* Floating Icons - Moved Gift back to left but HIGHER to clear text */}
            <Animated.View style={[styles.floatingIcon1, { transform: [{ translateY }] }]}>
              <MaterialCommunityIcons name="gift" size={26} color="#FFD700" />
            </Animated.View>
            <Animated.View style={[styles.floatingIcon2, { transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) }] }]}>
              <Ionicons name="star" size={22} color="#FFD700" />
            </Animated.View>
            
            <View style={styles.imageWrapper}>
              <Image 
                source={require('@/assets/images/referral_banner.png')} 
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* Decorative elements */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 40,
    elevation: 12,
    shadowColor: '#4B0082',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  gradient: {
    padding: 24,
    minHeight: 220,
    position: 'relative',
    overflow: 'hidden',
  },
  bubbleLeft: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    zIndex: 0,
  },
  bubbleBottom: {
    position: 'absolute',
    bottom: -20,
    left: 40,
    width: 100,
    height: 100,
    borderRadius: 50,
    zIndex: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
    flex: 1,
  },
  textContainer: {
    flex: 1,
    paddingRight: 5,
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
    gap: 4,
  },
  rewardText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '900',
  },
  coinLabel: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#8A2BE2',
    fontSize: 14,
    fontWeight: 'bold',
  },
  imageSection: {
    position: 'relative',
    width: 120,
    height: 150,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  overlayTextContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  overlayTitle: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  floatingIcon1: {
    position: 'absolute',
    top: 0, // Higher up
    left: -25, // Back to left side
    zIndex: 10,
  },
  floatingIcon2: {
    position: 'absolute',
    bottom: 20,
    right: -15,
    zIndex: 10,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  circle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.08)',
    zIndex: 1,
  },
  circle2: {
    position: 'absolute',
    bottom: -40,
    right: 60,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.05)',
    zIndex: 1,
  },
});

export default ReferralCard;
