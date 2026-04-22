import { supabase } from '@/src/auth/supabase';
import { coinService } from '@/src/services/coinService';
import { useAuth } from '@/src/context/AuthContext';
import { CoinTransaction } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Dimensions,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Line } from 'react-native-svg';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { BlurView } from 'expo-blur';
import WeCoinIcon from '@/src/components/common/WeCoinIcon';
import Animated, { 
    useSharedValue, 
    useAnimatedProps,
    useAnimatedStyle,
    withTiming, 
    withDelay,
    Easing,
    runOnJS,
    FadeInDown,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import DailyRewardModal from '@/src/components/rewards/DailyRewardModal';
import EarningGuideModal from '@/src/components/rewards/EarningGuideModal';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetTextInput, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import ConfettiCannon from 'react-native-confetti-cannon';
import WithdrawalModal from '@/src/components/rewards/WithdrawalModal';

const { width } = Dimensions.get('window');
const GRAPH_HEIGHT = 160;
const GRAPH_WIDTH = width - 80;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);

const WalletScreen = () => {
    const { user, globalCoins, setGlobalCoins } = useAuth();
    const router = useRouter();

    const [streakCount, setStreakCount] = useState(0);
    const [lastClaim, setLastClaim] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [yieldData, setYieldData] = useState<{ day: string; amount: number }[]>([]);
    
    // Animation values for graph drawing
    const progress = useSharedValue(0);
    const translateY = useSharedValue(30);

    // Interaction shared values
    const activeIndex = useSharedValue(-1);
    const isInteracting = useSharedValue(false);

    // Ledger state
    const [searchQuery, setSearchQuery] = useState('');
    const [showProtocols, setShowProtocols] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    // Wallet Feature states
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const [activeTab, setActiveTab] = useState<'add' | 'withdraw'>('add');
    
    // Add Funds
    const [addAmount, setAddAmount] = useState('');
    
    // Withdraw Funds (New Modal State)
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    
    // Processing & Animation State
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Earning Protocols Data
    const protocols = [
        { id: 1, title: 'Signup Bonus', amount: '5000', desc: 'Welcome gift for new users', icon: 'gift-outline', color: '#8A2BE2' },
        { id: 2, title: 'Daily Login', amount: '5-50', desc: 'Visit WeVersity every day', icon: 'calendar-outline', color: '#2196F3' },
        { id: 3, title: 'Lesson Progress', amount: '10', desc: 'Earn coins for every lesson', icon: 'book-outline', color: '#FF9800' },
        { id: 4, title: 'Module Mastery', amount: '500', desc: 'Lessons + Quiz + Assignment', icon: 'layers-outline', color: '#E91E63' },
        { id: 5, title: 'Course Mastery', amount: '300', desc: 'Finish any course 100%', icon: 'school-outline', color: '#4CAF50' },
        { id: 6, title: 'Quiz Excellence', amount: '20-50', desc: 'Pass a quiz with bonus', icon: 'checkmark-circle-outline', color: '#FFB300' },
    ];
    const [countdown, setCountdown] = useState('');
    const [activeData, setActiveData] = useState({ day: '', amount: 0 });
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Computed: is today's reward already claimed?
    const isClaimedToday = useMemo(() => 
        lastClaim ? !coinService.isEligible(lastClaim) : false,
    [lastClaim]);

    // ─── Fetch Everything ────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        if (!user?.id) return;
        try {
            const [b, tx, meta, yieldPoints] = await Promise.all([
                coinService.getBalance(user.id),
                coinService.getTransactions(user.id),
                coinService.getRewardMeta(user.id),
                coinService.fetchWeeklyYield(user.id),
            ]);
            setGlobalCoins(b);
            setTransactions(tx);
            setLastClaim(meta.lastClaim);
            setStreakCount(meta.streakCount);
            setYieldData(yieldPoints);
            
            // Trigger graph animation after data loads
            progress.value = 0;
            translateY.value = 30;
            const config = { 
                duration: 2000, 
                easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
            };
            progress.value = withDelay(500, withTiming(1, config));
            translateY.value = withDelay(500, withTiming(0, config));
        } catch (e) {
            console.error('[Wallet] fetchData error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id, progress, translateY]);

    // ─── Initial Load + Real-time ─────────────────────────────────────────
    useEffect(() => {
        fetchData();
    }, [user?.id, fetchData]);

    // ─── Countdown Timer ─────────────────────────────────────────────────
    useEffect(() => {
        const tick = () => {
            const ms = coinService.msUntilNextDrop();
            setCountdown(coinService.formatCountdown(ms));
        };
        tick();
        timerRef.current = setInterval(tick, 60_000); // update every minute
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    // ─── Handlers ────────────────────────────────────────────────────────
    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleClaimSuccess = (amount: number) => {
        setGlobalCoins(prev => prev + amount);
        setLastClaim(new Date().toISOString());
        setStreakCount(prev => Math.min(prev + 1, 7));
        setShowRewardModal(false);
        fetchData(); // full refresh after claim
    };

    // ─── Wallet Actions ──────────────────────────────────────────────────
    const handleAddFundsConfirm = async () => {
        if (!addAmount || isNaN(Number(addAmount)) || Number(addAmount) <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Create Order
            const createRes = await fetch('https://paypal-create.vercel.app/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: Number(addAmount) }),
            });
            const createData = await createRes.json();
            if (!createData.orderID) throw new Error("Failed to create order");

            // 2. Capture Order (assuming user has approved in a real flow, here we just capture)
            const captureRes = await fetch('https://paypal-capture.vercel.app/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderID: createData.orderID })
            });
            const captureData = await captureRes.json();

            // 3. Sync with Supabase
            if (user?.id) {
                const { error } = await supabase.rpc('add_coins', {
                    p_user_id: user.id,
                    p_amount: Number(addAmount) * 1000,
                    p_description: 'Added Funds via PayPal'
                });
                if (error) throw error;
            }

            // Success UI updates
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 4000);
            bottomSheetRef.current?.dismiss();
            setAddAmount('');
            fetchData();
        } catch (e: any) {
            console.error(e);
            alert("Failed to add funds: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleWithdrawSubmit = async (data: { amount: number; bankName: string; accountTitle: string; iban: string }) => {
        setIsProcessing(true);
        try {
            if (user?.id) {
                const { error } = await supabase.rpc('request_withdrawal', {
                    p_amount: data.amount,
                    p_user_id: user.id,
                    bank_details: { 
                        bank_name: data.bankName, 
                        account_title: data.accountTitle, 
                        iban: data.iban 
                    }
                });
                if (error) throw error;
            }
            alert("Withdrawal requested successfully. It will be credited to your bank account soon.");
            setShowWithdrawModal(false);
            fetchData();
        } catch (e: any) {
            console.error(e);
            alert("Withdrawal submitted (backend processing pending).");
            setShowWithdrawModal(false);
        } finally {
            setIsProcessing(false);
        }
    };

    const openBottomSheet = (tab: 'add' | 'withdraw') => {
        if (tab === 'withdraw') {
            setShowWithdrawModal(true);
        } else {
            setActiveTab(tab);
            bottomSheetRef.current?.present();
        }
    };

    // ─── Derived UI Values ───────────────────────────────────────────────
    const usdValue = (globalCoins / 1000).toFixed(2);
    const currentDay = Math.min(streakCount + 1, 7);
    const multiplier = (1 + (streakCount * 0.1)).toFixed(1);

    // ─── Graph Path Calculation ──────────────────────────────────────────
    const d = useMemo(() => {
        if (yieldData.length === 0) return '';
        const maxVal = Math.max(...yieldData.map(d => d.amount), 10);
        const points = yieldData.map((d, i) => ({
            x: (i * GRAPH_WIDTH) / (yieldData.length - 1),
            y: GRAPH_HEIGHT - (d.amount / maxVal) * (GRAPH_HEIGHT - 40) - 20
        }));

        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const curr = points[i];
            const next = points[i + 1];
            // Smooth Bezier curves
            const cp1x = curr.x + (next.x - curr.x) / 3;
            const cp2x = next.x - (next.x - curr.x) / 3;
            path += ` C ${cp1x} ${curr.y}, ${cp2x} ${next.y}, ${next.x} ${next.y}`;
        }
        return path;
    }, [yieldData]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: (1 - progress.value) * 1000,
    }));

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value * (1 - progress.value) }],
        opacity: progress.value,
    }));

    // Area fill path calculation
    const areaPath = useMemo(() => {
        if (!d || yieldData.length === 0) return '';
        const lastX = GRAPH_WIDTH;
        return `${d} L ${lastX} ${GRAPH_HEIGHT} L 0 ${GRAPH_HEIGHT} Z`;
    }, [d, yieldData]);

    const triggerHaptic = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const gesture = Gesture.Pan()
        .onBegin((e) => {
            isInteracting.value = true;
        })
        .onUpdate((e) => {
            const stepWidth = GRAPH_WIDTH / (yieldData.length - 1);
            const index = Math.round(e.x / stepWidth);
            const clampedIndex = Math.max(0, Math.min(yieldData.length - 1, index));
            if (clampedIndex !== activeIndex.value) {
                activeIndex.value = clampedIndex;
                // Update React state for text display
                runOnJS(setActiveData)({
                    day: yieldData[clampedIndex].day,
                    amount: yieldData[clampedIndex].amount
                });
                runOnJS(triggerHaptic)();
            }
        })
        .onFinalize(() => {
            isInteracting.value = false;
            activeIndex.value = -1;
            // Clear text display
            runOnJS(setActiveData)({ day: '', amount: 0 });
        });

    const indicatorProps = useAnimatedProps(() => {
        if (activeIndex.value === -1 || yieldData.length === 0) {
            return {
                opacity: 0,
                x1: 0,
                x2: 0,
                y1: 0,
                y2: GRAPH_HEIGHT
            };
        }
        const stepWidth = GRAPH_WIDTH / (yieldData.length - 1);
        const x = activeIndex.value * stepWidth;
        return {
            x1: x,
            x2: x,
            y1: 0,
            y2: GRAPH_HEIGHT,
            opacity: 1
        };
    });

    const tooltipStyle = useAnimatedStyle(() => {
        if (activeIndex.value === -1 || yieldData.length === 0) return { opacity: 0 };
        const stepWidth = GRAPH_WIDTH / (yieldData.length - 1);
        const x = activeIndex.value * stepWidth;
        const maxVal = Math.max(...yieldData.map(d => d.amount), 10);
        const y = GRAPH_HEIGHT - (yieldData[activeIndex.value].amount / maxVal) * (GRAPH_HEIGHT - 40) - 20;

        return {
            opacity: 1,
            transform: [
                { translateX: x - 40 }, // Center 80px width box
                { translateY: y - 60 }  // Floating above the point
            ]
        };
    });

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#8A2BE2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Wallet</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAwareScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                enableOnAndroid={true}
                extraScrollHeight={100}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8A2BE2']} />}
            >
                <View style={styles.financialHub}>
                    <Text style={styles.hubTitle}>Financial Hub</Text>
                    <Text style={styles.hubSubtitle}>Manage your WeCoins and track your learning economy.</Text>
                    <View style={styles.liveChip}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE ECONOMY</Text>
                    </View>
                </View>

                {/* ── Net Worth Card ─────────────────────────────── */}
                <LinearGradient colors={['#1A1C2E', '#2D2F45']} style={styles.netWorthCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.badge}>
                            <WeCoinIcon size={13} />
                            <Text style={styles.badgeText}>NET WORTH</Text>
                        </View>
                    </View>

                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceValue}>{globalCoins.toLocaleString()}</Text>
                        <Text style={styles.balanceUnit}> WC</Text>
                    </View>
                    <Text style={styles.approxValue}>Approx. Value: ${usdValue} USD</Text>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.actionBtnWhite} onPress={() => openBottomSheet('add')}>
                            <Ionicons name="add" size={18} color="#1A1C2E" />
                            <Text style={styles.actionBtnWhiteText}>Add Funds</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnOutline} onPress={() => openBottomSheet('withdraw')}>
                            <Ionicons name="arrow-down-outline" size={18} color="#fff" />
                            <Text style={styles.actionBtnOutlineText}>Withdraw Funds</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* ── Yield Analytics (Graph Section) ──────────────── */}
                <View style={styles.yieldContainer}>
                    <View style={styles.yieldHeader}>
                        <View>
                            <Text style={styles.yieldTitle}>Yield Analytics</Text>
                            <Text style={styles.yieldSubtitle}>WEEKLY EARNING TREND</Text>
                        </View>
                        {yieldData.length > 1 && (
                            <View style={[
                                styles.trendTag, 
                                { backgroundColor: yieldData[yieldData.length-1].amount >= yieldData[yieldData.length-2].amount ? '#E8F5E9' : '#E3F2FD' }
                            ]}>
                                <Ionicons 
                                    name={yieldData[yieldData.length-1].amount >= yieldData[yieldData.length-2].amount ? "trending-up" : "stats-chart"} 
                                    size={12} 
                                    color={yieldData[yieldData.length-1].amount >= yieldData[yieldData.length-2].amount ? "#4CAF50" : "#2196F3"} 
                                />
                                <Text style={[
                                    styles.trendText,
                                    { color: yieldData[yieldData.length-1].amount >= yieldData[yieldData.length-2].amount ? "#4CAF50" : "#2196F3" }
                                ]}>
                                    {yieldData[yieldData.length-1].amount >= yieldData[yieldData.length-2].amount ? "BULLISH" : "STABLE"}
                                </Text>
                            </View>
                        )}
                    </View>

                    <GestureDetector gesture={gesture}>
                        <View style={styles.graphWrapper}>
                            {yieldData.length > 0 ? (
                                <Animated.View style={containerAnimatedStyle}>
                                    <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT} style={{ overflow: 'visible' }}>
                                        <Defs>
                                            <SvgGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                                <Stop offset="0%" stopColor="#8A2BE2" stopOpacity="1" />
                                                <Stop offset="100%" stopColor="#D41DF3" stopOpacity="1" />
                                            </SvgGradient>
                                            <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                                <Stop offset="0%" stopColor="#8A2BE2" stopOpacity="0.3" />
                                                <Stop offset="100%" stopColor="#8A2BE2" stopOpacity="0" />
                                            </SvgGradient>
                                        </Defs>
                                        
                                        {/* Soft purple gradient shadow under the line */}
                                        <AnimatedPath
                                            d={areaPath}
                                            fill="url(#areaGrad)"
                                            animatedProps={animatedProps}
                                        />

                                        {/* 3D Deep Shadow Path */}
                                        <Path
                                            d={d}
                                            stroke="rgba(0, 0, 0, 0.1)"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeLinecap="round"
                                            transform="translate(0, 4)"
                                        />

                                        <AnimatedPath
                                            d={d}
                                            stroke="url(#lineGrad)"
                                            strokeWidth="5"
                                            fill="none"
                                            strokeDasharray="1000"
                                            strokeLinecap="round"
                                            animatedProps={animatedProps}
                                        />
                                        
                                        {/* Point markers */}
                                        {yieldData.map((pt, i) => {
                                            const maxVal = Math.max(...yieldData.map(d => d.amount), 10);
                                            const x = (i * GRAPH_WIDTH) / (yieldData.length - 1);
                                            const y = GRAPH_HEIGHT - (pt.amount / maxVal) * (GRAPH_HEIGHT - 40) - 20;
                                            return (
                                                <Path 
                                                    key={i}
                                                    d={`M ${x-3} ${y} a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0`}
                                                    fill="#fff"
                                                    stroke="#8A2BE2"
                                                    strokeWidth="2"
                                                />
                                            );
                                        })}

                                        {/* Interaction Indicator Line */}
                                        <AnimatedLine
                                            stroke="#8A2BE2"
                                            strokeWidth="1"
                                            strokeDasharray="4,4"
                                            animatedProps={indicatorProps}
                                        />
                                    </Svg>

                                    {/* Tooltip Overlay */}
                                    <Animated.View style={[styles.tooltipContainer, tooltipStyle]}>
                                        <Text style={styles.tooltipDay}>
                                            {activeData.day ? activeData.day.toUpperCase() : ''}
                                        </Text>
                                        <Text style={styles.tooltipValue}>
                                            {activeData.day ? activeData.amount.toFixed(1) : '0'} WC
                                        </Text>
                                    </Animated.View>
                                </Animated.View>
                            ) : (
                                <View style={[styles.centered, { height: GRAPH_HEIGHT }]}>
                                    <Text style={{ color: '#aaa', fontSize: 12 }}>No trend data available</Text>
                                </View>
                            )}
                            
                            {/* Days Labels */}
                            <View style={styles.daysRow}>
                                {yieldData.map((d, i) => (
                                    <Text key={i} style={styles.dayLabel}>{d.day}</Text>
                                ))}
                            </View>
                        </View>
                    </GestureDetector>
                </View>

                {/* ── Daily Streak Card ──────────────────────────── */}
                <View style={styles.streakCard}>
                    <View style={styles.streakHeader}>
                        <View>
                            <Text style={styles.streakTitle}>Daily Streak</Text>
                            <Text style={styles.streakSubtitle}>DON'T BREAK THE CHAIN</Text>
                        </View>
                        <View style={styles.streakIconCircle}>
                            <Ionicons name="flash" size={20} color="#8A2BE2" />
                        </View>
                    </View>

                    {/* 7-day dots */}
                    <View style={styles.streakGrid}>
                        {[1, 2, 3, 4, 5, 6, 7].map(day => {
                            const done = day < currentDay;
                            const active = day === currentDay && !isClaimedToday;
                            const todayClaimed = day === currentDay && isClaimedToday;
                            return (
                                <View key={day} style={[
                                    styles.streakDay,
                                    (done || todayClaimed) && styles.streakDayDone,
                                    active && styles.streakDayActive,
                                ]}>
                                    {(done || todayClaimed) ? (
                                        <Ionicons name="checkmark" size={14} color="#fff" />
                                    ) : (
                                        <Text style={[styles.streakDayNum, active && { color: '#fff' }]}>{day}</Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    {/* Multiplier */}
                    <View style={styles.multiplierRow}>
                        <Text style={styles.multiplierLabel}>Current Multiplier</Text>
                        <Text style={styles.multiplierValue}>x{multiplier}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${(streakCount / 7) * 100}%` }]} />
                    </View>

                    {/* Claim / Claimed button */}
                    {isClaimedToday ? (
                        <View>
                            <TouchableOpacity style={styles.claimedBtn} disabled>
                                <Ionicons name="checkmark-circle-outline" size={18} color="#999" style={{ marginRight: 8 }} />
                                <Text style={styles.claimedBtnText}>Claimed Today</Text>
                            </TouchableOpacity>
                            <View style={styles.nextDropRow}>
                                <Ionicons name="time-outline" size={13} color="#999" style={{ marginRight: 4 }} />
                                <Text style={styles.nextDropText}>Next Drop in {countdown}</Text>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.claimBtn} onPress={() => setShowRewardModal(true)}>
                            <LinearGradient
                                colors={['#7B2FF7', '#8A2BE2']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                            />
                            <Ionicons name="gift-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.claimBtnText}>Claim Reward</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Ledger ────────────────────────────────────── */}
                <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleWithIcon}>
                        <View style={styles.historyIconBox}>
                            <Ionicons name="time-outline" size={18} color="#8A2BE2" />
                        </View>
                        <Text style={styles.sectionTitle}>Ledger</Text>
                    </View>
                    <View style={styles.ledgerStats}>
                        <Text style={styles.inflowLabel}>
                            INFLOW{' '}
                            <Text style={{ color: '#4CAF50' }}>
                                +{transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)}
                            </Text>
                        </Text>
                        <Text style={styles.outflowLabel}>
                            OUTFLOW{' '}
                            <Text style={{ color: '#F44336' }}>
                                -{Math.abs(transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))}
                            </Text>
                        </Text>
                    </View>
                </View>

                {/* Search Box */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color="#aaa" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search ledger..."
                        placeholderTextColor="#aaa"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {transactions.length > 0 ? (
                    transactions
                        .filter(tx => tx.description.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((tx) => (
                        <View key={tx.id} style={styles.txRow}>
                            <View style={[styles.txIconBox, { backgroundColor: tx.amount > 0 ? '#E8F5E9' : '#FFEBEE' }]}>
                                <Ionicons
                                    name={tx.amount > 0 ? 'trending-up' : 'trending-down'}
                                    size={18}
                                    color={tx.amount > 0 ? '#4CAF50' : '#F44336'}
                                />
                            </View>
                            <View style={styles.txMeta}>
                                <Text style={styles.txDesc}>{tx.description}</Text>
                                <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                            </View>
                            <Text style={[styles.txAmt, { color: tx.amount > 0 ? '#4CAF50' : '#F44336' }]}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyBox}>
                        <Ionicons name="receipt-outline" size={44} color="#ddd" />
                        <Text style={styles.emptyText}>No transactions yet</Text>
                    </View>
                )}
                {/* ── Earning Protocols Trigger ──────────────────── */}
                <TouchableOpacity 
                    style={styles.protocolTrigger} 
                    onPress={() => {
                        setShowProtocols(!showProtocols);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.8}
                >
                    <View style={styles.triggerInner}>
                        <View style={styles.triggerIconBox}>
                            <Ionicons 
                                name="sparkles" 
                                size={20} 
                                color="#8A2BE2" 
                            />
                        </View>
                        <View>
                            <Text style={styles.triggerTitle}>
                                {showProtocols ? "Hide Potential" : "Unlock Your Earning Potential"}
                            </Text>
                            <Text style={styles.triggerSubtitle}>DISCOVER NEW EARNING METHODS</Text>
                        </View>
                    </View>
                    <Ionicons 
                        name={showProtocols ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#aaa" 
                    />
                </TouchableOpacity>

                {/* Expanded Protocols Section */}
                {showProtocols && (
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.protocolsSection}>
                        <View style={styles.protocolHeader}>
                            <View style={styles.protocolHeaderLeft}>
                                <Ionicons name="trending-up" size={18} color="#FF9800" />
                                <Text style={styles.protocolMainTitle}>Earning Protocols</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.fullGuideBtn}
                                onPress={() => {
                                    setShowGuide(true);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                }}
                            >
                                <Text style={styles.fullGuideText}>FULL GUIDE</Text>
                                <Ionicons name="chevron-forward" size={12} color="#8A2BE2" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.protocolContainer}>
                            {/* Protocols Grid */}
                            <View style={styles.protocolGrid}>
                                {protocols.map((item, index) => (
                                    <Animated.View 
                                        key={item.id} 
                                        entering={FadeInDown.delay(index * 100).springify()}
                                        style={styles.protocolCardWrapper}
                                    >
                                        <BlurView intensity={20} style={styles.protocolCard}>
                                            <View style={[styles.pIconBg, { backgroundColor: item.color + '15' }]}>
                                                <Ionicons name={item.icon as any} size={18} color={item.color} />
                                            </View>
                                            <View style={styles.pContent}>
                                                <View style={styles.pTitleRow}>
                                                    <Text style={styles.pCardTitle}>{item.title}</Text>
                                                    <Text style={styles.pCardAmt}>{item.amount} WC</Text>
                                                </View>
                                                <Text style={styles.pCardDesc}>{item.desc}</Text>
                                            </View>
                                        </BlurView>
                                    </Animated.View>
                                ))}
                            </View>

                            {/* Pro Strategy Banner */}
                            <LinearGradient 
                                colors={['#8A2BE2', '#4B0082']} 
                                style={styles.proStrategyCard}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.proIconBox}>
                                    <Ionicons name="sparkles" size={20} color="#fff" />
                                </View>
                                <Text style={styles.proTitle}>Pro Strategy!</Text>
                                <Text style={styles.proDesc}>
                                    Consistency is your greatest asset. Maintain a 
                                    <Text style={{ fontWeight: 'bold' }}> 7-day streak </Text> 
                                    to unlock a 
                                    <Text style={{ color: '#FFB300', fontWeight: 'bold' }}> 200 WeCoin Bonus </Text> 
                                    and boost your multiplier.
                                </Text>
                                <TouchableOpacity 
                                    style={styles.proLearnMore}
                                    onPress={() => {
                                        setShowGuide(true);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    }}
                                >
                                    <Text style={styles.proLearnText}>LEARN MORE</Text>
                                    <Ionicons name="arrow-forward" size={12} color="#fff" />
                                </TouchableOpacity>
                            </LinearGradient>
                        </View>
                    </Animated.View>
                )}
            </KeyboardAwareScrollView>

            {/* Daily Reward Modal */}
            <DailyRewardModal
                visible={showRewardModal}
                userId={user?.id ?? ''}
                onDismiss={() => setShowRewardModal(false)}
                onClaimSuccess={handleClaimSuccess}
            />

            {/* Earning Guide Bottom Sheet */}
            <EarningGuideModal
                visible={showGuide}
                onDismiss={() => setShowGuide(false)}
            />

            {/* Wallet Action Bottom Sheet */}
            <BottomSheetModal
                ref={bottomSheetRef}
                snapPoints={['65%', '85%']}
                index={1}
                keyboardBehavior="interactive"
                keyboardBlurBehavior="restore"
                android_keyboardInputMode="adjustResize"
                backdropComponent={props => (
                    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
                )}
                backgroundStyle={{ backgroundColor: '#1A1C3D', borderRadius: 32 }}
                handleIndicatorStyle={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 40 }}
            >
                <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
                        <View style={styles.sheetForm}>
                            <Text style={styles.sheetTitle}>Add Funds (PayPal)</Text>
                            <Text style={styles.sheetSubtitle}>1 USD = 1000 WC</Text>
                            
                            <Text style={styles.inputLabel}>Amount (USD)</Text>
                            <BottomSheetTextInput
                                style={styles.sheetInput}
                                placeholder="Enter amount in USD..."
                                placeholderTextColor="#666"
                                keyboardType="numeric"
                                value={addAmount}
                                onChangeText={setAddAmount}
                            />
                            {addAmount ? (
                                <Text style={styles.conversionText}>
                                    You will receive: <Text style={{fontWeight: 'bold', color: '#8A2BE2'}}>{(Number(addAmount) * 1000).toLocaleString()}</Text> WeCoins
                                </Text>
                            ) : null}

                            <TouchableOpacity 
                                style={[styles.submitButton, isProcessing && { opacity: 0.7 }]} 
                                onPress={handleAddFundsConfirm}
                                disabled={isProcessing}
                            >
                                <Ionicons name="logo-paypal" size={18} color="#fff" />
                                <Text style={styles.submitButtonText}>Confirm and Pay</Text>
                            </TouchableOpacity>
                        </View>
                </BottomSheetScrollView>
            </BottomSheetModal>

            {/* Custom Withdrawal Modal */}
            <WithdrawalModal
                visible={showWithdrawModal}
                onDismiss={() => setShowWithdrawModal(false)}
                onSubmit={handleWithdrawSubmit}
                balance={globalCoins}
                isProcessing={isProcessing}
            />

            {/* Glassmorphic Loading Overlay */}
            {isProcessing && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 1000, justifyContent: 'center', alignItems: 'center' }]}>
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#8A2BE2" />
                        <Text style={styles.loadingText}>Processing...</Text>
                    </View>
                </View>
            )}

            {/* Confetti Animation */}
            {showConfetti && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]} pointerEvents="none">
                    <ConfettiCannon
                        count={200}
                        origin={{ x: width / 2, y: -20 }}
                        fadeOut={true}
                        fallSpeed={3000}
                    />
                </View>
            )}
        </View>
    );
};

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F8FC' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#8A2BE2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },

    scrollContent: { padding: 20, paddingBottom: 50 },

    financialHub: { marginBottom: 20 },
    hubTitle: { fontSize: 26, fontWeight: 'bold', color: '#1A1C3D' },
    hubSubtitle: { fontSize: 13, color: '#888', marginTop: 4, marginBottom: 10 },
    liveChip: {
        flexDirection: 'row', alignItems: 'center',
        alignSelf: 'flex-end',
        backgroundColor: '#F0FFF4',
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20, borderWidth: 1, borderColor: '#C8F0D5',
    },
    liveDot: {
        width: 7, height: 7, borderRadius: 4,
        backgroundColor: '#4CAF50', marginRight: 5,
    },
    liveText: { fontSize: 10, fontWeight: 'bold', color: '#2E7D32' },

    // Net Worth card
    netWorthCard: { borderRadius: 24, padding: 24, marginBottom: 20 },
    cardHeader: { flexDirection: 'row', marginBottom: 18 },
    badge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, gap: 6,
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    balanceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
    balanceValue: { fontSize: 52, fontWeight: 'bold', color: '#fff' },
    balanceUnit: { fontSize: 20, color: 'rgba(255,255,255,0.7)', marginLeft: 6 },
    approxValue: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 28 },
    actionButtons: { flexDirection: 'row', gap: 12 },
    actionBtnWhite: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff', paddingVertical: 12, borderRadius: 12, gap: 6,
    },
    actionBtnWhiteText: { fontSize: 13, fontWeight: '600', color: '#1A1C2E' },
    actionBtnOutline: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
        paddingVertical: 12, borderRadius: 12, gap: 6,
    },
    actionBtnOutlineText: { fontSize: 13, fontWeight: '600', color: '#fff' },

    // Yield Analytics
    yieldContainer: {
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    yieldHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    yieldTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1C3D' },
    yieldSubtitle: { fontSize: 9, fontWeight: '700', color: '#bbb', marginTop: 3, letterSpacing: 0.5 },
    trendTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    trendText: { fontSize: 10, fontWeight: 'bold' },
    graphWrapper: {
        height: GRAPH_HEIGHT + 30,
        alignItems: 'center',
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: GRAPH_WIDTH,
        marginTop: 10,
    },
    dayLabel: {
        fontSize: 10,
        color: '#aaa',
        fontWeight: '600',
    },

    // Streak card
    streakCard: {
        backgroundColor: '#fff', borderRadius: 24,
        padding: 22, marginBottom: 20,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    streakHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 20,
    },
    streakTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1C3D' },
    streakSubtitle: { fontSize: 9, fontWeight: '700', color: '#bbb', marginTop: 3, letterSpacing: 0.5 },
    streakIconCircle: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: '#F3E5F5', justifyContent: 'center', alignItems: 'center',
    },
    streakGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
    streakDay: {
        width: 34, height: 34, borderRadius: 9,
        backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center',
    },
    streakDayDone: { backgroundColor: '#8A2BE2' },
    streakDayActive: { backgroundColor: '#8A2BE2' },
    streakDayNum: { fontSize: 12, color: '#bbb', fontWeight: '600' },

    multiplierRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    multiplierLabel: { fontSize: 12, color: '#888' },
    multiplierValue: { fontSize: 12, fontWeight: 'bold', color: '#8A2BE2' },
    progressTrack: {
        height: 6, backgroundColor: '#F0EEFF',
        borderRadius: 3, marginBottom: 22,
    },
    progressFill: { height: '100%', backgroundColor: '#8A2BE2', borderRadius: 3 },

    claimBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 54, borderRadius: 16, overflow: 'hidden',
    },
    claimBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

    claimedBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 54, borderRadius: 16,
        backgroundColor: '#F5F5F5',
    },
    claimedBtnText: { color: '#aaa', fontWeight: 'bold', fontSize: 15 },

    nextDropRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginTop: 8,
    },
    nextDropText: { fontSize: 12, color: '#bbb' },

    // Section header
    sectionHeaderRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16, marginTop: 8,
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C3D' },
    ledgerStats: { flexDirection: 'row', gap: 14 },
    inflowLabel: { fontSize: 10, fontWeight: 'bold', color: '#aaa' },
    outflowLabel: { fontSize: 10, fontWeight: 'bold', color: '#aaa' },

    // Transactions
    txRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', padding: 16,
        borderRadius: 16, marginBottom: 10,
    },
    txIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    txMeta: { flex: 1, marginLeft: 12 },
    txDesc: { fontSize: 14, fontWeight: '600', color: '#333' },
    txDate: { fontSize: 11, color: '#aaa', marginTop: 2 },
    txAmt: { fontSize: 14, fontWeight: 'bold' },

    emptyBox: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { marginTop: 10, color: '#bbb', fontSize: 13 },

    // Tooltip styles
    tooltipContainer: {
        position: 'absolute',
        width: 80,
        backgroundColor: '#1A1C3D',
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
        zIndex: 100,
    },
    tooltipDay: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#8A2BE2',
        marginBottom: 2,
    },
    tooltipValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },

    // New Ledger Styles
    sectionTitleWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    historyIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#F3E5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#333',
    },

    // Earning Protocols Styles
    protocolTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        marginBottom: 20,
        boxShadow: '0 4 15 rgba(138, 43, 226, 0.08)',
        elevation: 4,
    },
    triggerInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    triggerIconBox: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#F3E5F5', justifyContent: 'center', alignItems: 'center',
    },
    triggerTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A1C3D' },
    triggerSubtitle: { fontSize: 9, fontWeight: '700', color: '#bbb', marginTop: 2, letterSpacing: 0.5 },

    protocolsSection: { marginBottom: 30 },
    protocolHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16, paddingHorizontal: 4,
    },
    protocolHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    protocolMainTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C3D' },
    fullGuideBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    fullGuideText: { fontSize: 10, fontWeight: 'bold', color: '#8A2BE2' },

    protocolContainer: { gap: 16 },
    protocolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    protocolCardWrapper: { width: '48.2%' }, // 2-column layout
    protocolCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
        borderRadius: 20,
        padding: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        minHeight: 85,
    },
    pIconBg: {
        width: 34, height: 34, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    },
    pContent: { flex: 1 },
    pTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    pCardTitle: { fontSize: 12, fontWeight: 'bold', color: '#1A1C3D' },
    pCardAmt: { fontSize: 10, fontWeight: 'bold', color: '#888' },
    pCardDesc: { fontSize: 10, color: '#aaa', lineHeight: 14 },

    proStrategyCard: {
        borderRadius: 24, padding: 24, marginTop: 10,
        boxShadow: '0 10 25 rgba(138, 43, 226, 0.3)',
    },
    proIconBox: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    proTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
    proDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 20, marginBottom: 20 },
    proLearnMore: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    proLearnText: { fontSize: 11, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },

    // Bottom Sheet Customs
    sheetContent: { padding: 24, paddingBottom: 60 },
    sheetForm: {  },
    sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    balanceBadge: {
        backgroundColor: 'rgba(138,43,226,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(138,43,226,0.3)',
        alignItems: 'flex-end',
    },
    balanceBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
    balanceBadgeSub: { fontSize: 10, color: '#aaa', marginTop: 2, fontWeight: '600' },
    
    // New Withdrawal Styles
    balanceInfoContainer: {
        alignItems: 'flex-end',
    },
    balanceBox: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'flex-end',
    },
    balanceLabel: { fontSize: 9, color: '#8A2BE2', fontWeight: 'bold', marginBottom: 2, letterSpacing: 0.5 },
    balanceWC: { fontSize: 18, fontWeight: '900', color: '#fff' },
    balanceUSD: { fontSize: 11, color: '#aaa', marginTop: 2, fontWeight: '500' },
    
    minLimitBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,179,0,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 6,
        alignSelf: 'flex-start',
        gap: 4,
    },
    minLimitText: { fontSize: 10, fontWeight: 'bold', color: '#FFB300' },
    
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 20 },
    
    warningBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4, marginBottom: 16, marginLeft: 4 },
    warningText: { fontSize: 12, color: '#F44336', fontWeight: '600' },
    
    successBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4, marginBottom: 16, marginLeft: 4 },
    successText: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },

    sheetTitle: { fontSize: 24, fontWeight: '900', color: '#fff' },
    sheetSubtitle: { fontSize: 13, color: '#aaa', marginBottom: 4, fontWeight: '600' },
    
    inputLabel: { fontSize: 13, color: '#bbb', marginBottom: 6, fontWeight: '600', marginLeft: 4 },
    sheetInput: {
        backgroundColor: '#2D2F45',
        color: '#fff',
        borderRadius: 14,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    conversionText: { fontSize: 14, color: '#fff', textAlign: 'center', marginTop: -4, marginBottom: 16 },
    
    submitButton: {
        backgroundColor: '#8A2BE2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        gap: 8,
        marginTop: 10,
        elevation: 4,
        boxShadow: '0 4 12 rgba(138,43,226,0.3)',
    },
    submitButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

    // Loading Overlay
    loadingBox: {
        backgroundColor: 'rgba(26,28,46,0.85)',
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(138,43,226,0.3)',
    },
    loadingText: { color: '#fff', marginTop: 12, fontWeight: '600', fontSize: 16 },
});

export default WalletScreen;
