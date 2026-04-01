import { supabase } from '@/src/auth/supabase';
import { coinService } from '@/src/services/coinService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Modal from 'react-native-modal';

const { width } = Dimensions.get('window');

// Reward amounts per streak day
const STREAK_REWARDS: Record<number, number> = {
    1: 5, 2: 10, 3: 15, 4: 20, 5: 25, 6: 35, 7: 50,
};

interface DailyRewardModalProps {
    visible: boolean;
    /** Called when user presses X — does NOT mark as claimed */
    onDismiss: () => void;
    /** Called when user successfully claims — marks as claimed */
    onClaimSuccess: (amount: number) => void;
    userId: string;
}

const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
    visible,
    onDismiss,
    onClaimSuccess,
    userId,
}) => {
    const [streakDay, setStreakDay] = useState(1);
    const [claiming, setClaiming] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const bounceAnim = useRef(new Animated.Value(0.85)).current;

    // Load real streak data from Supabase
    useEffect(() => {
        if (!visible || !userId) return;
        setClaimed(false);

        const loadStreak = async () => {
            const { data } = await supabase
                .from('daily_checkins')
                .select('last_checkin_date, current_streak')
                .eq('user_id', userId)
                .maybeSingle();

            if (data?.current_streak !== undefined && data?.current_streak !== null) {
                // current_streak tells us which day we're ON (next to claim)
                const dayToClaim = Math.min((data.current_streak || 0) + 1, 7);
                setStreakDay(dayToClaim);
            }
        };

        loadStreak();

        // Bounce on open
        Animated.spring(bounceAnim, {
            toValue: 1,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
        }).start();
    }, [visible, userId]);

    const handleClaim = async () => {
        if (claiming || claimed) return;
        setClaiming(true);

        const amount = STREAK_REWARDS[streakDay] ?? 10;

        try {
            // 1. Update balance via coinService (Now uses RPC)
            const result = await coinService.claimDailyReward(userId);

            if (result.success) {
                setClaimed(true);
                // Even if we don't get the exact amount back from RPC here, 
                // we call onClaimSuccess to trigger parent refresh.
                onClaimSuccess(amount);
                // Auto-close after showing success state
                setTimeout(() => onDismiss(), 1800);
            } else {
                console.error('[DailyRewardModal] Claim failed:', result.error);
            }
        } catch (e) {
            console.error('[DailyRewardModal] Exception:', e);
        } finally {
            setClaiming(false);
        }
    };

    const renderDot = (day: number) => {
        const isCompleted = day < streakDay;
        const isActive = day === streakDay;

        return (
            <View key={day} style={styles.dotWrapper}>
                <View style={[
                    styles.dot,
                    isCompleted && styles.dotCompleted,
                    isActive && styles.dotActive,
                ]}>
                    {isCompleted ? (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : (
                        <Text style={[styles.dotText, isActive && styles.dotTextActive]}>
                            {day}
                        </Text>
                    )}
                </View>
                {isActive && <View style={styles.activePip} />}
            </View>
        );
    };

    const rewardAmount = STREAK_REWARDS[streakDay] ?? 10;

    return (
        <Modal
            isVisible={visible}
            onBackdropPress={onDismiss}   // X behaviour — does NOT mark as claimed
            onBackButtonPress={onDismiss}
            backdropOpacity={0.55}
            animationIn="zoomIn"
            animationOut="zoomOut"
            animationInTiming={300}
            animationOutTiming={200}
            useNativeDriver
            style={styles.modal}
        >
            <Animated.View style={[styles.card, { transform: [{ scale: bounceAnim }] }]}>

                {/* Close (X) — does NOT claim */}
                <TouchableOpacity style={styles.closeBtn} onPress={onDismiss}>
                    <Ionicons name="close" size={22} color="#bbb" />
                </TouchableOpacity>

                {/* Gift Icon */}
                <View style={styles.iconWrapper}>
                    <LinearGradient colors={['#F3E5F5', '#E1BEE7']} style={styles.iconBg}>
                        <Ionicons name="gift-outline" size={44} color="#8A2BE2" />
                    </LinearGradient>
                    <View style={styles.starBadge}>
                        <Ionicons name="star" size={12} color="#fff" />
                    </View>
                </View>

                <Text style={styles.title}>Daily Reward!</Text>
                <Text style={styles.subtitle}>
                    Welcome back! Claim your daily{' '}
                    <Text style={styles.highlight}>WeCoins</Text> and keep your streak alive.
                </Text>

                {/* Streak Row */}
                <View style={styles.streakCard}>
                    <View style={styles.streakTopRow}>
                        <Text style={styles.streakLabel}>CURRENT STREAK</Text>
                        <View style={styles.dayPill}>
                            <Text style={styles.dayPillText}>DAY {streakDay}</Text>
                        </View>
                    </View>
                    <View style={styles.dotsRow}>
                        {[1, 2, 3, 4, 5, 6, 7].map(renderDot)}
                    </View>
                </View>

                {/* Reward hint */}
                <Text style={styles.rewardHint}>
                    🎁  Today's Reward: <Text style={styles.rewardAmount}>+{rewardAmount} WC</Text>
                </Text>

                {/* Claim Button */}
                <TouchableOpacity
                    style={[styles.claimBtn, (claiming || claimed) && styles.claimBtnDisabled]}
                    onPress={handleClaim}
                    disabled={claiming || claimed}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={claimed ? ['#4CAF50', '#388E3C'] : ['#7B2FF7', '#8A2BE2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                    />
                    {claiming ? (
                        <Text style={styles.claimText}>Claiming...</Text>
                    ) : claimed ? (
                        <View style={styles.row}>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.claimText}>Claimed!</Text>
                        </View>
                    ) : (
                        <View style={styles.row}>
                            <Ionicons name="radio-button-on" size={18} color="#FFD700" style={{ marginRight: 8 }} />
                            <Text style={styles.claimText}>Claim My Reward</Text>
                        </View>
                    )}
                </TouchableOpacity>

            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: {
        margin: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: width * 0.87,
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 18,
        right: 18,
        zIndex: 10,
        padding: 4,
    },
    iconWrapper: {
        marginTop: 12,
        marginBottom: 18,
    },
    iconBg: {
        width: 84,
        height: 84,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    starBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FFB300',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1C3D',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 22,
        paddingHorizontal: 10,
    },
    highlight: {
        fontWeight: 'bold',
        color: '#8A2BE2',
    },
    streakCard: {
        width: '100%',
        backgroundColor: '#F6F4FF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
    },
    streakTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    streakLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#aaa',
        letterSpacing: 0.8,
    },
    dayPill: {
        backgroundColor: '#8A2BE2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    dayPillText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dotWrapper: {
        alignItems: 'center',
    },
    dot: {
        width: 34,
        height: 34,
        borderRadius: 9,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#D0C4F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dotActive: {
        backgroundColor: '#8A2BE2',
        borderColor: '#8A2BE2',
    },
    dotCompleted: {
        backgroundColor: '#8A2BE2',
        borderColor: '#8A2BE2',
    },
    dotText: {
        fontSize: 12,
        color: '#8A2BE2',
        fontWeight: '700',
    },
    dotTextActive: {
        color: '#fff',
    },
    activePip: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#8A2BE2',
        marginTop: 5,
    },
    rewardHint: {
        fontSize: 13,
        color: '#666',
        marginBottom: 20,
    },
    rewardAmount: {
        fontWeight: 'bold',
        color: '#8A2BE2',
    },
    claimBtn: {
        width: '100%',
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    claimBtnDisabled: {
        opacity: 0.75,
    },
    claimText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default DailyRewardModal;
