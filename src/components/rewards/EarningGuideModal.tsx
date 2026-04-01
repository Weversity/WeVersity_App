import React, { useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Dimensions, 
    TouchableOpacity, 
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming,
    runOnJS,
    interpolate,
    Extrapolate,
    FadeInDown,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_TRANSLATE_Y = -SCREEN_HEIGHT * 0.92; // Max height
const DEFAULT_OPEN_Y = -SCREEN_HEIGHT * 0.88;

interface Props {
    visible: boolean;
    onDismiss: () => void;
}

const EarningGuideModal: React.FC<Props> = ({ visible, onDismiss }) => {
    const translateY = useSharedValue(0);
    const context = useSharedValue({ y: 0 });

    const scrollTo = (destination: number) => {
        'worklet';
        translateY.value = withSpring(destination, { 
            damping: 50,
            stiffness: 100,
            mass: 0.5,
        });
    };

    useEffect(() => {
        if (visible) {
            scrollTo(DEFAULT_OPEN_Y);
        } else {
            scrollTo(0);
        }
    }, [visible]);

    const gesture = Gesture.Pan()
        .onStart(() => {
            context.value = { y: translateY.value };
        })
        .onUpdate((event) => {
            translateY.value = event.translationY + context.value.y;
            // Clamping to max height
            translateY.value = Math.max(translateY.value, MIN_TRANSLATE_Y);
        })
        .onEnd((event) => {
            if (translateY.value > -SCREEN_HEIGHT * 0.4 || event.velocityY > 500) {
                runOnJS(onDismiss)();
            } else {
                scrollTo(DEFAULT_OPEN_Y);
            }
        });

    const rBottomSheetStyle = useAnimatedStyle(() => {
        const borderRadius = interpolate(
            translateY.value,
            [MIN_TRANSLATE_Y, -SCREEN_HEIGHT * 0.5],
            [20, 40],
            'clamp'
        );

        return {
            borderRadius,
            transform: [{ translateY: translateY.value }],
        };
    });

    const backdropStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(visible ? 1 : 0),
        };
    }, [visible]);

    if (!visible && translateY.value === 0) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={visible ? "auto" : "none"}>
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <TouchableOpacity 
                    activeOpacity={1} 
                    style={StyleSheet.absoluteFill} 
                    onPress={onDismiss} 
                />
            </Animated.View>

            <Animated.View style={[styles.bottomSheetContainer, rBottomSheetStyle]}>
                <GestureDetector gesture={gesture}>
                    <View style={styles.dragHandleContainer}>
                        <View style={styles.line} />
                    </View>
                </GestureDetector>
                
                <ScrollView 
                    style={styles.scrollView} 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                >
                        <Animated.View entering={FadeInDown.delay(200)}>
                            <Text style={styles.title}>Earning Guide</Text>
                            <Text style={styles.subtitle}>Master the WeVersity Economy</Text>
                        </Animated.View>

                        {/* ── Streak Multiplier ───────────────── */}
                        <View style={styles.section}>
                            <Animated.View entering={FadeInDown.delay(300)} style={styles.sectionHeader}>
                                <Ionicons name="flash" size={20} color="#FF9800" />
                                <Text style={styles.sectionTitle}>The Streak Multiplier</Text>
                            </Animated.View>
                            <Text style={styles.sectionDesc}>
                                Consistency is rewarded! Every consecutive day you log in increases your earning multiplier.
                            </Text>
                            
                            <View style={styles.multiplierGrid}>
                                {[
                                    { day: 'Day 1-2', val: 'x1.0', active: false },
                                    { day: 'Day 3-4', val: 'x1.1', active: false },
                                    { day: 'Day 5-6', val: 'x1.2', active: false },
                                    { day: 'Day 7+', val: 'x1.5', active: true },
                                ].map((item, idx) => (
                                    <Animated.View 
                                        key={idx} 
                                        entering={FadeInDown.delay(400 + idx * 50)}
                                        style={[styles.multiplierItem, item.active && styles.multiplierItemActive]}
                                    >
                                        <Text style={[styles.mDay, item.active && { color: '#fff' }]}>{item.day}</Text>
                                        <Text style={[styles.mVal, item.active && { color: '#fff' }]}>{item.val}</Text>
                                    </Animated.View>
                                ))}
                            </View>
                        </View>

                        {/* ── Earning Protocols ───────────────── */}
                        <View style={styles.section}>
                            <Animated.View entering={FadeInDown.delay(500)} style={styles.sectionHeader}>
                                <Ionicons name="layers" size={20} color="#8A2BE2" />
                                <Text style={styles.sectionTitle}>Earning Protocols</Text>
                            </Animated.View>

                            {[
                                { title: "Signup Bonus", amount: "5000 WC", desc: "Welcome gift for new users. Start your journey with $5 worth of coins!" },
                                { title: "Module Mastery", amount: "500 WC", desc: "Earn coins for every module you complete. Requires all lessons completed, passed quiz, and submitted assignment." },
                                { title: "Daily Check-in", amount: "5-50 WC", desc: "Log in daily to claim your reward. Day 7 gives a massive 50 WC bonus!" },
                                { title: "Course Mastery", amount: "300 WC", desc: "Complete 100% of any course to earn a massive completion bonus." },
                                { title: "Lesson Progress", amount: "10 WC", desc: "Earn 10 coins for every lesson you complete. Keep the momentum going!" },
                                { title: "Quiz Performance", amount: "20-50 WC", desc: "Earn 20 coins for passing a quiz, plus a 30 coin bonus for a perfect score!" }
                            ].map((item, idx) => (
                                <Animated.View key={idx} entering={FadeInDown.delay(600 + idx * 50)}>
                                    <ProtocolItem 
                                        title={item.title} 
                                        amount={item.amount} 
                                        desc={item.desc} 
                                    />
                                </Animated.View>
                            ))}
                        </View>

                        {/* ── Fair Play Policy ─────────────────── */}
                        <View style={styles.section}>
                            <Animated.View entering={FadeInDown.delay(1000)} style={styles.sectionHeader}>
                                <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
                                <Text style={styles.sectionTitle}>Fair Play Policy</Text>
                            </Animated.View>
                            <PolicyItem delay={1100} text="Rewards are credited instantly upon activity completion." />
                            <PolicyItem delay={1150} text="Spamming or abusing systems will result in account suspension." />
                            <PolicyItem delay={1200} text="WeCoins have no direct cash value and are for platform use only." />
                            <PolicyItem delay={1250} text="The value of rewards may change based on platform economy." />
                        </View>

                        <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
                            <Text style={styles.dismissBtnText}>Got it, thanks!</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>
        </View>
    );
};

const ProtocolItem = ({ title, amount, desc }: any) => (
    <View style={styles.pItem}>
        <View style={styles.pHeader}>
            <Text style={styles.pTitle}>{title}</Text>
            <Text style={styles.pAmt}>{amount}</Text>
        </View>
        <Text style={styles.pDesc}>{desc}</Text>
    </View>
);

const PolicyItem = ({ text, delay }: { text: string; delay: number }) => (
    <Animated.View entering={FadeInDown.delay(delay)} style={styles.policyRow}>
        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
        <Text style={styles.policyText}>{text}</Text>
    </Animated.View>
);

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    bottomSheetContainer: {
        height: SCREEN_HEIGHT,
        width: '100%',
        backgroundColor: '#fff',
        position: 'absolute',
        top: SCREEN_HEIGHT, // Anchor to bottom
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 20,
    },
    dragHandleContainer: {
        paddingVertical: 25, // Much larger touch area
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    line: {
        width: 40,
        height: 5,
        backgroundColor: '#ddd',
        borderRadius: 2.5,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1C3D',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#8A2BE2',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 30,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#1A1C3D',
    },
    sectionDesc: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
        marginBottom: 20,
    },
    multiplierGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    multiplierItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#F7F7FD',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EEEDFF',
    },
    multiplierItemActive: {
        backgroundColor: '#8A2BE2',
        borderColor: '#8A2BE2',
    },
    mDay: {
        fontSize: 11,
        color: '#8A2BE2',
        fontWeight: '800',
        marginBottom: 6,
    },
    mVal: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1A1C3D',
    },
    pItem: {
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 22,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
    },
    pHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    pTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1A1C3D',
    },
    pAmt: {
        fontSize: 13,
        fontWeight: '800',
        color: '#8A2BE2',
    },
    pDesc: {
        fontSize: 13,
        color: '#777',
        lineHeight: 20,
    },
    policyRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 14,
    },
    policyText: {
        fontSize: 14,
        color: '#555',
        flex: 1,
        lineHeight: 22,
    },
    dismissBtn: {
        backgroundColor: '#1A1C3D',
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
        shadowColor: '#1A1C3D',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    dismissBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
});

export default EarningGuideModal;
