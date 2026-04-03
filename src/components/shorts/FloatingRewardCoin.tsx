import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, DeviceEventEmitter, Alert, Modal } from 'react-native';
// AsyncStorage removed - using Supabase for permanent tracking
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/src/auth/supabase';
import { useAuth } from '@/src/context/AuthContext';
import WeCoinIcon from '../common/WeCoinIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Global flag for anti-annoyance (Only show login prompt once per session)
let globalHasSeenLoginPrompt = false;

// Global set to track claimed videos in the current session
const claimedSessionVideos = new Set<string>();

interface Props {
  videoId: string;
  isVisible: boolean;
  mediaType: 'video' | 'image';
  player?: any; // The expo-video player
}

const RING_SIZE = 56;
const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FloatingRewardCoin({ videoId, isVisible, mediaType, player }: Props) {
  const router = useRouter();
  const { user, setGlobalCoins } = useAuth();
  const [isClosed, setIsClosed] = useState(false);
  const [isActive, setIsActive] = useState(mediaType === 'image'); // Images active immediately
  const [isFlying, setIsFlying] = useState(false);
  const [progress, setProgress] = useState(mediaType === 'image' ? 1 : 0);
  const [showEarlyPopup, setShowEarlyPopup] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isFlyingRef = useRef(false);
  const earlyPopupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Translation values for dragging
  const translateX = useSharedValue(15); // Left side
  const translateY = useSharedValue(140); // Top sa thora nicha
  const scale = useSharedValue(1);

  // Gesture Context
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  // Glow & Shake internal values
  const glowOpacity = useSharedValue(0.2);
  const shakeRotation = useSharedValue(0);

  useEffect(() => {
    // Hide if already claimed this session
    if (claimedSessionVideos.has(videoId)) {
      setIsClosed(true);
      return;
    }

    // Database storage check (permanent)
    const verifyPersistence = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('shorts_rewards_history')
          .select('id')
          .eq('user_id', user.id)
          .eq('video_id', videoId)
          .single();

        if (data) {
          claimedSessionVideos.add(videoId); // Cache in RAM for session
          setIsClosed(true);
        }
      } catch (error) {
        console.warn('Error verifying history from Supabase:', error);
      }
    };

    verifyPersistence();
  }, [videoId, user?.id]);

  // Video Progress Tracker
  useEffect(() => {
    if (!isVisible || isClosed || isActive || mediaType !== 'video' || !player) return;

    const interval = setInterval(() => {
      const duration = player.duration || 0;
      const current = player.currentTime || 0;
      
      if (duration > 0) {
        // Goal is 50% watch time. So progress is 100% when current = duration * 0.5
        const p = Math.min(current / (duration * 0.5), 1);
        setProgress(p);

        // Strict validation: Must actually pass the exact halfway seconds
        if (current >= duration * 0.5 && !isFlyingRef.current && !isActive) {
          setIsActive(true);
          setProgress(1); // Fill ring completely
          
          if (!user?.id) {
            // Soft interrupt overlay for guests (Anti-Annoyance logic applied)
            if (!globalHasSeenLoginPrompt) {
              globalHasSeenLoginPrompt = true;
              setShowLoginModal(true);
            }
          } else {
            // Auto fly for video automatically if logged in
            claimCoin();
          }
        }
      }
    }, 500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, isClosed, isActive, mediaType, player]);

  // Handle immediate active state glow & shake for images
  useEffect(() => {
    if (isActive && !isClosed) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 800 }),
          withTiming(0.2, { duration: 800 })
        ),
        -1,
        true
      );
      if (mediaType === 'image') {
        shakeRotation.value = withRepeat(
          withSequence(
            withTiming(-0.15, { duration: 60 }),
            withTiming(0.15, { duration: 60 }),
            withTiming(-0.15, { duration: 60 }),
            withTiming(0, { duration: 60 }),
            withTiming(0, { duration: 1500 }) // pause between shakes
          ),
          -1,
          true
        );
      }
    }
  }, [isActive, isClosed, mediaType]);

  // Gestures
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      scale.value = withSpring(1.1);
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = contextX.value + event.translationX;
      translateY.value = contextY.value + event.translationY;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      // Magnetic Edge Logic: Snap to left or right based on center line
      const centerX = translateX.value + RING_SIZE / 2;
      if (centerX < SCREEN_WIDTH / 2) {
        translateX.value = withSpring(10); 
      } else {
        const targetX = SCREEN_WIDTH - RING_SIZE - 10;
        translateX.value = withSpring(targetX);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotateZ: `${shakeRotation.value}rad` }
      ]
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: isActive ? glowOpacity.value : 0,
      transform: [{ scale: isActive ? 1.3 : 1 }]
    };
  });

  // Dynamic Tooltip Position logic
  const largeTooltipStyle = useAnimatedStyle(() => {
    const isLeftSide = translateX.value < SCREEN_WIDTH / 2;
    return {
      transform: [
        { translateX: isLeftSide ? RING_SIZE + 8 : -168 }
      ],
      alignItems: isLeftSide ? 'flex-start' : 'flex-end',
    };
  });

  const smallTooltipStyle = useAnimatedStyle(() => {
    const isLeftSide = translateX.value < SCREEN_WIDTH / 2;
    return {
      transform: [
        { translateX: isLeftSide ? RING_SIZE + 8 : -93 }
      ],
      alignItems: isLeftSide ? 'flex-start' : 'flex-end',
    };
  });

  const claimCoin = async () => {
    if (isFlyingRef.current || !user?.id) return;
    
    // Award coin securely in background
    try {
      const { data, error } = await supabase.rpc('claim_short_reward', {
        p_user_id: user.id,
        p_video_id: videoId,
        p_amount: 1
      });

      if (!error && data === 'SUCCESS') {
        // Success: Trigger the "Coin Collected" visual experience
        isFlyingRef.current = true;
        setIsFlying(true);
        claimedSessionVideos.add(videoId);

        // Play haptic
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Curved flight animation to bottom right (Profile Tab area)
        scale.value = withTiming(0.3, { duration: 800 });
        shakeRotation.value = withTiming(0, { duration: 100 });
        translateX.value = withTiming(SCREEN_WIDTH - 40, { duration: 700 });
        translateY.value = withTiming(SCREEN_HEIGHT - 60, { 
          duration: 700, 
          easing: Easing.bezier(0.5, 0, 1, 1) // Curve downward
        });

        // Increment Global State at end of animation
        setGlobalCoins(prev => prev + 1);

        // Completely unmount/hide after flight
        setTimeout(() => {
          setIsClosed(true);
        }, 800);
      } else if (data === 'ALREADY_CLAIMED') {
        // Just silently handle if claimed already
        claimedSessionVideos.add(videoId);
        setIsClosed(true);
      } else {
        // Database Error
        console.error('[Shorts Reward RPC Error]', error || data);
        // Do NOT show flying coin effect if it failed
      }
    } catch (e) {
      console.error('[Shorts Reward Catch Error]', e);
    }
  };

  const handlePress = () => {
    if (isActive) {
      if (!user?.id) {
        // Direct redirect without alert if user manually taps
        router.push('/profile');
        return;
      }
      
      // If logged in, claim the active coin
      claimCoin();
    } else {
      setShowEarlyPopup(true);
      if (earlyPopupTimeout.current) clearTimeout(earlyPopupTimeout.current);
      earlyPopupTimeout.current = setTimeout(() => {
        setShowEarlyPopup(false);
      }, 2500);
    }
  };

  if (isClosed || !isVisible) return null;

  return (
    <>
      <Animated.View style={[styles.container, animatedStyle]}>
        <GestureDetector gesture={panGesture}>
        <View style={styles.coinWrapper}>
          
          {/* Tooltip for inactive state */}
          {!isActive && showEarlyPopup ? (
            <Animated.View style={[styles.tooltip, largeTooltipStyle]}>
              <Text style={styles.tooltipText}>Watch 50% of the video to unlock your reward!</Text>
            </Animated.View>
          ) : !isActive ? (
            <Animated.View style={[styles.smallTooltip, smallTooltipStyle]}>
              <Text style={styles.tooltipText}>Watch 50%</Text>
            </Animated.View>
          ) : null}

          {/* Close button */}
          {!isFlying && (
            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={() => setIsClosed(true)}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="close" size={12} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Golden Glow Behind */}
          <Animated.View style={[styles.glow, glowStyle]} />

          {/* SVG Progress Ring */}
          <Svg width={RING_SIZE} height={RING_SIZE} style={styles.svgRing}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="4"
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="#FFD700"
              strokeWidth="4"
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE - progress * CIRCUMFERENCE}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>

          {/* Core Coin Button */}
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={handlePress} 
            style={styles.innerCoin}
            disabled={isFlying}
          >
            <WeCoinIcon size={28} />
          </TouchableOpacity>
        </View>
      </GestureDetector>
    </Animated.View>
    
      <Modal transparent visible={showLoginModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <View style={styles.modalIconContainer}>
                <Ionicons name="lock-closed" size={32} color="#1c1c1e" />
             </View>
             <Text style={styles.modalTitle}>Login Required</Text>
             <Text style={styles.modalDesc}>Login to claim your video reward and collect more coins!</Text>
             <TouchableOpacity style={styles.modalLoginBtn} onPress={() => { setShowLoginModal(false); router.push('/profile'); }}>
                <Text style={styles.modalLoginBtnText}>Login Now</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowLoginModal(false)}>
                <Text style={styles.modalCancelBtnText}>Maybe Later</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999, // Over EVERYTHING
  },
  coinWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgRing: {
    position: 'absolute',
  },
  innerCoin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    borderWidth: 1.5,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  glow: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  closeBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  tooltip: {
    position: 'absolute',
    top: 5,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    width: 160,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ff2d55',
    shadowColor: '#ff2d55',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  smallTooltip: {
    position: 'absolute',
    top: 10,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    width: 85,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8A2BE2',
    shadowColor: '#8A2BE2',
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  tooltipText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  modalContent: {
    width: '75%',
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalDesc: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalLoginBtn: {
    backgroundColor: '#FFD700',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalLoginBtnText: {
    color: '#1c1c1e',
    fontWeight: '800',
    fontSize: 16,
  },
  modalCancelBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  modalCancelBtnText: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    fontSize: 15,
  }
});
