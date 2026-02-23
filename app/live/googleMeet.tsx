import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { courseService } from '@/src/services/courseService';
import { googleMeetService } from '@/src/services/googleMeetService';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    Modal,
    Image as RNImage,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
// GoogleSignin will be lazy-loaded to prevent top-level crashes in Expo Go
let GoogleSignin: any = null;
try {
    const { GoogleSignin: GS } = require('@react-native-google-signin/google-signin');
    GoogleSignin = GS;
} catch (e) {
    console.warn('GoogleSignin native module not found');
}

// ─── Particle types ───────────────────────────────────────────────────────────
const PARTICLE_COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8A2BE2', '#FF6D00'];

const AnimatedCalendarIcon = () => {
    const wiggle = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;
    const particles = useRef(
        Array.from({ length: 8 }, () => ({
            angle: Math.random() * 2 * Math.PI,
            x: useRef(new Animated.Value(0)).current,
            y: useRef(new Animated.Value(0)).current,
            opacity: useRef(new Animated.Value(0)).current,
            size: 6 + Math.random() * 6,
            color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        }))
    ).current;

    useEffect(() => {
        // ── Continuous wiggle ─────────────────────────────────────────────────
        Animated.loop(
            Animated.sequence([
                Animated.timing(wiggle, { toValue: 1, duration: 120, useNativeDriver: true, easing: Easing.linear }),
                Animated.timing(wiggle, { toValue: -1, duration: 120, useNativeDriver: true, easing: Easing.linear }),
                Animated.timing(wiggle, { toValue: 0.7, duration: 100, useNativeDriver: true, easing: Easing.linear }),
                Animated.timing(wiggle, { toValue: -0.7, duration: 100, useNativeDriver: true, easing: Easing.linear }),
                Animated.timing(wiggle, { toValue: 0, duration: 80, useNativeDriver: true, easing: Easing.linear }),
                Animated.delay(2600),
            ])
        ).start();

        // ── Subtle pulse ─────────────────────────────────────────────────────
        Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.08, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
                Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
                Animated.delay(1400),
            ])
        ).start();

        // ── Burst particles every 3 seconds ───────────────────────────────────
        const burst = () => {
            const anims = particles.map(p => {
                const dist = 50 + Math.random() * 30;
                const dx = Math.cos(p.angle) * dist;
                const dy = Math.sin(p.angle) * dist;
                p.x.setValue(0);
                p.y.setValue(0);
                p.opacity.setValue(0);
                return Animated.parallel([
                    Animated.sequence([
                        Animated.timing(p.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                        Animated.timing(p.opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
                    ]),
                    Animated.timing(p.x, { toValue: dx, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
                    Animated.timing(p.y, { toValue: dy, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
                ]);
            });
            Animated.parallel(anims).start();
        };

        burst();
        const interval = setInterval(burst, 3000);
        return () => clearInterval(interval);
    }, []);

    const rotate = wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] });

    return (
        <View style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center' }}>
            {/* Particles */}
            {particles.map((p, i) => (
                <Animated.View
                    key={i}
                    style={{
                        position: 'absolute',
                        width: p.size,
                        height: p.size,
                        borderRadius: p.size / 2,
                        backgroundColor: p.color,
                        opacity: p.opacity,
                        transform: [{ translateX: p.x }, { translateY: p.y }],
                    }}
                />
            ))}

            {/* Animated Calendar Icon */}
            <Animated.View style={{ transform: [{ rotate }, { scale }], shadowColor: '#4285F4', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 12 }}>
                {/* Card body */}
                <View style={{ width: 72, height: 72, borderRadius: 18, backgroundColor: '#fff', overflow: 'hidden', borderWidth: 1.5, borderColor: '#E0E0E0' }}>
                    {/* Top header bar (Google Blue) */}
                    <View style={{ backgroundColor: '#4285F4', height: 20, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
                        </View>
                    </View>
                    {/* Calendar body */}
                    <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Day number (31) in Google Red */}
                        <Text style={{ fontSize: 22, fontWeight: '900', color: '#EA4335', lineHeight: 26 }}>31</Text>
                        {/* Grid dots */}
                        <View style={{ flexDirection: 'row', gap: 3, marginTop: 3 }}>
                            {['#34A853', '#FBBC05', '#EA4335'].map((c, i) => (
                                <View key={i} style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: c }} />
                            ))}
                        </View>
                    </View>
                </View>
            </Animated.View>
        </View>
    );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
const GoogleMeetScreen = () => {
    const router = useRouter();
    const [isLinked, setIsLinked] = useState(false); // Toggle state for demo
    const [sessionTitle, setSessionTitle] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [scheduledDate, setScheduledDate] = useState('dd/mm/yyyy --:--');

    // Calendar & Time Picker State
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Detailed Time State
    const [selectedHour, setSelectedHour] = useState('10');
    const [selectedMinute, setSelectedMinute] = useState('00');
    const [selectedSecond, setSelectedSecond] = useState('00');
    const [selectedPeriod, setSelectedPeriod] = useState('AM');

    // Logic State
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isScheduling, setIsScheduling] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [isCourseDropdownVisible, setIsCourseDropdownVisible] = useState(false);
    const [isNativeModuleMissing, setIsNativeModuleMissing] = useState(false);
    const [bannerStatus, setBannerStatus] = useState<'default' | 'live' | 'scheduled'>('default');

    // Button press scale animation
    const btnScale = useRef(new Animated.Value(1)).current;
    const handleAuthorizeWithAnim = () => {
        Animated.sequence([
            Animated.spring(btnScale, { toValue: 0.93, useNativeDriver: true, speed: 50, bounciness: 10 }),
            Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
        ]).start(() => handleAuthorize());
    };

    const bannerConfigs = {
        default: {
            text: 'Ready to start your class!',
            bgColor: '#E8F5E9',
            textColor: '#2E7D32',
            borderColor: '#C8E6C9'
        },
        live: {
            text: '🔴 You are now live! Join the class to start teaching.',
            bgColor: '#FFEBEE',
            textColor: '#D32F2F',
            borderColor: '#FFCDD2'
        },
        scheduled: {
            text: '📅 Your class has been scheduled successfully!',
            bgColor: '#E3F2FD',
            textColor: '#1976D2',
            borderColor: '#BBDEFB'
        }
    };

    React.useEffect(() => {
        // Configure Google Sign-In with Safety Guard
        try {
            if (GoogleSignin) {
                GoogleSignin.configure({
                    scopes: ['https://www.googleapis.com/auth/calendar.events'],
                    webClientId: '636424335937-7i9odsp5fr6sh0ppsjcb1v27bd0f0m74.apps.googleusercontent.com',
                    offlineAccess: true,
                });
            } else {
                console.warn('GoogleSignin module is missing');
                setIsNativeModuleMissing(true);
            }
        } catch (e) {
            console.error('Failed to configure GoogleSignin:', e);
            setIsNativeModuleMissing(true);
        }

        initData();
    }, []);

    const initData = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            // 1. Check Authorization (Backend API + User Metadata)
            const isAuthorized = await googleMeetService.checkAuthorization();
            setIsLinked(isAuthorized);

            if (isAuthorized) {
                // 2. Fetch Sessions
                const fetchedSessions = await googleMeetService.fetchSessions(user.id);
                setSessions(fetchedSessions);

                // 3. Fetch Courses for dropdown
                const fetchedCourses = await courseService.fetchInstructorCourses(user.id);
                setCourses(fetchedCourses);
            }
        } catch (error) {
            console.error('Error initializing Google Meet data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAuthorize = async () => {
        if (isNativeModuleMissing) {
            Alert.alert(
                'Development Build Required',
                'Google Sign-In is not supported in Expo Go. Please use a development build (npx expo run:android) to access this feature.'
            );
            return;
        }
        try {
            setLoading(true);
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const serverAuthCode = userInfo.type === 'success' ? userInfo.data.serverAuthCode : null;

            if (serverAuthCode) {
                // Update Supabase user metadata with the serverAuthCode
                const { error } = await supabase.auth.updateUser({
                    data: { google_calendar_token: serverAuthCode }
                });

                if (error) throw error;

                setIsLinked(true);
                Alert.alert('Success', 'Google Calendar authorized successfully!');
                initData();
            } else {
                throw new Error('No server auth code received. Please try again.');
            }
        } catch (error: any) {
            console.error('Authorization failed:', error);
            Alert.alert('Authorization Failed', error.message || 'Could not connect to Google');
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleMeeting = async () => {
        if (!sessionTitle.trim()) {
            Alert.alert('Error', 'Please enter a session title');
            return;
        }

        if (scheduledDate.includes('dd/mm/yyyy')) {
            Alert.alert('Error', 'Please select a date and time');
            return;
        }

        try {
            setIsScheduling(true);

            // Format date to ISO string for API
            // Current format: "20/2/2026 10:00:00 AM"
            const [datePart, timePart, period] = scheduledDate.split(' ');
            const [day, month, year] = datePart.split('/').map(Number);
            let [hour, minute, second] = timePart.split(':').map(Number);

            if (period === 'PM' && hour < 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;

            const isoDate = new Date(year, month - 1, day, hour, minute, second).toISOString();

            const result = await googleMeetService.scheduleMeeting(
                sessionTitle,
                isoDate,
                selectedCourse ? courses.find(c => c.title === selectedCourse)?.id : null
            );

            Alert.alert('Success', 'Meeting scheduled successfully!');
            setSessionTitle('');
            setSelectedCourse('');
            setScheduledDate('dd/mm/yyyy --:--');
            setBannerStatus('scheduled');
            initData(); // Refresh sessions
        } catch (error: any) {
            Alert.alert('Scheduling Failed', error.message || 'Error creating meeting');
        } finally {
            setIsScheduling(false);
        }
    };

    const handleInstantMeeting = async () => {
        try {
            setIsScheduling(true);
            const isoDate = new Date().toISOString();
            await googleMeetService.scheduleMeeting(
                sessionTitle || 'Instant Meeting',
                isoDate,
                selectedCourse ? courses.find(c => c.title === selectedCourse)?.id : null
            );
            Alert.alert('Success', 'Instant meeting created!');
            setBannerStatus('live');
            initData();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error creating instant meeting');
        } finally {
            setIsScheduling(false);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        Alert.alert(
            'Delete Session',
            'Are you sure you want to delete this session?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await googleMeetService.deleteSession(sessionId);
                            Alert.alert('Success', 'Session deleted successfully');
                            initData(); // Refresh list
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete session');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const generateDays = (month: number, year: number) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    };

    const handleDateSelect = () => {
        const formattedDate = `${selectedDay}/${selectedMonth + 1}/${selectedYear} ${selectedHour}:${selectedMinute}:${selectedSecond} ${selectedPeriod}`;
        setScheduledDate(formattedDate);
        setIsPickerVisible(false);
    };

    const formatSessionDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const isToday = date.toDateString() === now.toDateString();
        const isTomorrow = date.toDateString() === tomorrow.toDateString();

        const time = date.toLocaleString([], { hour: '2-digit', minute: '2-digit' }).replace(/^0/, '');

        if (isToday) return `Today, ${time}`;
        if (isTomorrow) return `Tomorrow, ${time}`;

        return date.toLocaleString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' }).replace(/^0/, '');
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Google Meet</Text>
        </View>
    );

    const renderCalendarModal = () => {
        const days = generateDays(selectedMonth, selectedYear);
        const times = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

        return (
            <Modal
                transparent={true}
                visible={isPickerVisible}
                animationType="fade"
                onRequestClose={() => setIsPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarContainer}>
                        {/* Modal Header */}
                        <View style={styles.calendarHeader}>
                            <Text style={styles.calendarHeaderTitle}>Schedule Meeting</Text>
                            <TouchableOpacity onPress={() => setIsPickerVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {/* Month Selector */}
                        <View style={styles.monthSelector}>
                            <TouchableOpacity onPress={() => {
                                if (selectedMonth === 0) {
                                    setSelectedMonth(11);
                                    setSelectedYear(v => v - 1);
                                } else setSelectedMonth(v => v - 1);
                            }}>
                                <Ionicons name="chevron-back" size={20} color="#8A2BE2" />
                            </TouchableOpacity>
                            <Text style={styles.monthText}>{months[selectedMonth]} {selectedYear}</Text>
                            <TouchableOpacity onPress={() => {
                                if (selectedMonth === 11) {
                                    setSelectedMonth(0);
                                    setSelectedYear(v => v + 1);
                                } else setSelectedMonth(v => v + 1);
                            }}>
                                <Ionicons name="chevron-forward" size={20} color="#8A2BE2" />
                            </TouchableOpacity>
                        </View>

                        {/* Weekdays Row */}
                        <View style={styles.weekdaysRow}>
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <Text key={d} style={styles.weekdayText}>{d}</Text>
                            ))}
                        </View>

                        {/* Days Grid */}
                        <View style={styles.daysGrid}>
                            {days.map((day, index) => (
                                <TouchableOpacity
                                    key={index}
                                    disabled={!day}
                                    onPress={() => day && setSelectedDay(day)}
                                    style={[
                                        styles.dayButton,
                                        day === selectedDay && styles.selectedDayButton
                                    ]}
                                >
                                    <Text style={[
                                        styles.dayText,
                                        day === selectedDay && styles.selectedDayText
                                    ]}>{day || ''}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Improved Granular Time Picker */}
                        <Text style={styles.pickerSubLabel}>SELECT TIME</Text>
                        <View style={styles.timePickerContainer}>
                            {/* Hours Scroll */}
                            <View style={styles.timeColumn}>
                                <Text style={styles.columnLabel}>HOUR</Text>
                                <ScrollView showsVerticalScrollIndicator={false} style={styles.columnScroll}>
                                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(h => (
                                        <TouchableOpacity
                                            key={h}
                                            onPress={() => setSelectedHour(h)}
                                            style={[styles.timeItem, selectedHour === h && styles.selectedTimeItem]}
                                        >
                                            <Text style={[styles.timeItemText, selectedHour === h && styles.selectedTimeItemText]}>{h}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Minutes Scroll */}
                            <View style={styles.timeColumn}>
                                <Text style={styles.columnLabel}>MIN</Text>
                                <ScrollView showsVerticalScrollIndicator={false} style={styles.columnScroll}>
                                    {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
                                        <TouchableOpacity
                                            key={m}
                                            onPress={() => setSelectedMinute(m)}
                                            style={[styles.timeItem, selectedMinute === m && styles.selectedTimeItem]}
                                        >
                                            <Text style={[styles.timeItemText, selectedMinute === m && styles.selectedTimeItemText]}>{m}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Seconds Scroll */}
                            <View style={styles.timeColumn}>
                                <Text style={styles.columnLabel}>SEC</Text>
                                <ScrollView showsVerticalScrollIndicator={false} style={styles.columnScroll}>
                                    {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(s => (
                                        <TouchableOpacity
                                            key={s}
                                            onPress={() => setSelectedSecond(s)}
                                            style={[styles.timeItem, selectedSecond === s && styles.selectedTimeItem]}
                                        >
                                            <Text style={[styles.timeItemText, selectedSecond === s && styles.selectedTimeItemText]}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* AM/PM Column */}
                            <View style={styles.timeColumn}>
                                <Text style={styles.columnLabel}>PERIOD</Text>
                                <View style={styles.periodContainer}>
                                    {['AM', 'PM'].map(p => (
                                        <TouchableOpacity
                                            key={p}
                                            onPress={() => setSelectedPeriod(p)}
                                            style={[styles.periodButton, selectedPeriod === p && styles.selectedPeriodButton]}
                                        >
                                            <Text style={[styles.periodButtonText, selectedPeriod === p && styles.selectedPeriodButtonText]}>{p}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Confirm Button */}
                        <TouchableOpacity style={styles.confirmButton} onPress={handleDateSelect}>
                            <Text style={styles.confirmButtonText}>Confirm Selection</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    const renderUnlinkedView = () => (
        <View style={styles.content}>
            {isNativeModuleMissing && (
                <View style={styles.warningBanner}>
                    <Ionicons name="warning" size={20} color="#856404" />
                    <Text style={styles.warningText}>
                        Google Sign-In requires a development build (npx expo run:android). It won't work in Expo Go.
                    </Text>
                </View>
            )}
            <View style={styles.authCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Google Meet</Text>
                </View>

                {/* ✨ Animated 3D Calendar Icon with burst particles */}
                <View style={styles.calendarIconWrapper}>
                    <AnimatedCalendarIcon />
                </View>

                <Text style={styles.authTitle}>Connect Google Calendar</Text>
                <Text style={styles.authSubtitle}>
                    We need permission to create Meet links on your calendar.
                </Text>

                <Animated.View style={{ transform: [{ scale: btnScale }], width: '100%' }}>
                    <TouchableOpacity
                        style={styles.googleSignInButton}
                        onPress={handleAuthorizeWithAnim}
                        activeOpacity={0.88}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                {/* Official Google Icon in White Box */}
                                <View style={styles.googleIconBox}>
                                    <RNImage
                                        source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                                        style={{ width: 20, height: 20 }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <View style={styles.googleTextContainer}>
                                    <Text style={styles.googleSignInText}>AUTHORIZE WITH GOOGLE</Text>
                                </View>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {renderSessionsList()}
        </View>
    );

    const renderCourseModal = () => (
        <Modal
            transparent={true}
            visible={isCourseDropdownVisible}
            animationType="slide"
            onRequestClose={() => setIsCourseDropdownVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.calendarContainer}>
                    <View style={styles.calendarHeader}>
                        <Text style={styles.calendarHeaderTitle}>Select Course</Text>
                        <TouchableOpacity onPress={() => setIsCourseDropdownVisible(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight: 300 }}>
                        <TouchableOpacity
                            style={styles.courseItem}
                            onPress={() => { setSelectedCourse(''); setIsCourseDropdownVisible(false); }}
                        >
                            <Text style={styles.courseItemText}>None (Optional)</Text>
                        </TouchableOpacity>
                        {courses.map(course => (
                            <TouchableOpacity
                                key={course.id}
                                style={styles.courseItem}
                                onPress={() => { setSelectedCourse(course.title); setIsCourseDropdownVisible(false); }}
                            >
                                <Text style={styles.courseItemText}>{course.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    const renderSessionsList = () => (
        <View style={styles.sessionsSection}>
            <View style={styles.sessionsHeader}>
                <View style={styles.headerIconBg}>
                    <Ionicons name="list" size={16} color="#fff" />
                </View>
                <Text style={styles.sectionTitle}>Your Meet Sessions</Text>
            </View>
            {sessions && sessions.length > 0 ? (
                sessions.map((session) => (
                    <View key={session.id} style={styles.sessionCard}>
                        <View style={styles.sessionInfo}>
                            <Text style={styles.sessionTitleText} numberOfLines={1}>{session.title}</Text>
                            <View style={styles.sessionTimeContainer}>
                                <Ionicons name="time-outline" size={14} color="#718096" style={{ marginRight: 4 }} />
                                <Text style={styles.sessionDateText}>{formatSessionDate(session.scheduled_at)}</Text>
                            </View>
                            {session.course_id && (
                                <View style={styles.courseBadge}>
                                    <Text style={styles.courseBadgeText}>
                                        {courses.find(c => c.id === session.course_id)?.title || 'Linked Course'}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.sessionActions}>
                            <TouchableOpacity
                                style={styles.joinButtonSquare}
                                onPress={() => router.push(session.google_meet_url)}
                            >
                                <Ionicons name="videocam" size={20} color="#8A2BE2" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteButtonIcon}
                                onPress={() => handleDeleteSession(session.id)}
                            >
                                <Ionicons name="trash-outline" size={20} color="#CBD5E0" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            ) : (
                <View style={styles.emptySessionsCard}>
                    <View style={styles.emptyIconBg}>
                        <Ionicons name="calendar-outline" size={64} color="#CBD5E0" />
                    </View>
                    <Text style={styles.emptyTitle}>No Active Sessions</Text>
                    <Text style={styles.emptySubtitle}>Your live or upcoming classes will appear here once you start or schedule a session.</Text>
                </View>
            )}
        </View>
    );
    const renderLinkedView = () => (
        <View style={styles.content}>
            {/* Dynamic Success Banner */}
            <View style={[
                styles.successBanner,
                {
                    backgroundColor: bannerConfigs[bannerStatus].bgColor,
                    borderColor: bannerConfigs[bannerStatus].borderColor
                }
            ]}>
                <Text style={[
                    styles.successBannerText,
                    { color: bannerConfigs[bannerStatus].textColor }
                ]}>
                    {bannerConfigs[bannerStatus].text}
                </Text>
            </View>

            <View style={styles.meetCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Google Meet</Text>
                    <TouchableOpacity onPress={async () => {
                        const { error } = await supabase.auth.updateUser({
                            data: { google_calendar_token: null }
                        });
                        if (!error) {
                            setIsLinked(false);
                            initData();
                        }
                    }}>
                        <Text style={styles.disconnectLink}>[x] Disconnect</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.formBody}>
                    <TextInput
                        style={styles.input}
                        placeholder="Session Title"
                        placeholderTextColor="#999"
                        value={sessionTitle}
                        onChangeText={setSessionTitle}
                    />

                    <TouchableOpacity style={styles.dropdown} onPress={() => setIsCourseDropdownVisible(true)}>
                        <Text style={styles.dropdownText}>
                            {selectedCourse || 'Link to Course (Optional)'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>

                    <Text style={styles.label}>SCHEDULE DATE & TIME</Text>
                    <TouchableOpacity style={styles.datePicker} onPress={() => setIsPickerVisible(true)}>
                        <Text style={styles.datePickerText}>{scheduledDate}</Text>
                        <Ionicons name="calendar-outline" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.scheduleButton}
                        onPress={handleScheduleMeeting}
                        disabled={isScheduling}
                    >
                        {isScheduling ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="calendar" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.buttonText}>Schedule Meeting</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={styles.instantButton}
                        onPress={handleInstantMeeting}
                        disabled={isScheduling}
                    >
                        {isScheduling ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="flash" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.buttonText}>Start Instant Session</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {renderSessionsList()}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" />
            {renderHeader()}
            <View style={styles.whiteWrapper}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {isLinked ? renderLinkedView() : renderUnlinkedView()}
                </ScrollView>
            </View>
            {renderCalendarModal()}
            {renderCourseModal()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#8A2BE2',
    },
    whiteWrapper: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
        backgroundColor: '#8A2BE2',
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 12,
    },
    content: {
        padding: 20,
    },
    successBanner: {
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    successBannerText: {
        color: '#2E7D32',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    meetCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#F0EFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    disconnectLink: {
        color: '#FF5252',
        fontSize: 12,
        fontWeight: '600',
    },
    authCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 30,
        marginBottom: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    calendarIconWrapper: {
        marginBottom: 20,
    },
    calendarIconBg: {
        width: 60,
        height: 60,
        backgroundColor: '#4A5568',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    authTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2D3748',
        textAlign: 'center',
        marginBottom: 12,
    },
    authSubtitle: {
        fontSize: 15,
        color: '#718096',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    googleAuthorizeButton: {
        backgroundColor: '#4285F4',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    googleBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    googleLogoContainer: {
        width: 32,
        height: 32,
        backgroundColor: '#fff',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    googleBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    formBody: {
        gap: 16,
    },
    input: {
        backgroundColor: '#F9F9FF',
        borderWidth: 1,
        borderColor: '#E6E6FF',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#333',
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9F9FF',
        borderWidth: 1,
        borderColor: '#E6E6FF',
        borderRadius: 12,
        padding: 16,
    },
    dropdownText: {
        fontSize: 16,
        color: '#666',
    },
    label: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#8A8A8E',
        marginTop: 4,
    },
    datePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9F9FF',
        borderWidth: 1,
        borderColor: '#E6E6FF',
        borderRadius: 12,
        padding: 16,
    },
    datePickerText: {
        fontSize: 16,
        color: '#666',
    },
    scheduleButton: {
        backgroundColor: '#8A2BE2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 8,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#F0EFFF',
    },
    dividerText: {
        paddingHorizontal: 15,
        color: '#8A8A8E',
        fontSize: 12,
        fontWeight: 'bold',
    },
    instantButton: {
        backgroundColor: '#FF8C00', // Deep Orange
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#FF8C00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    sessionsSection: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
    },
    headerIconBg: {
        width: 28,
        height: 28,
        backgroundColor: '#8A2BE2',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    emptySessionsCard: {
        backgroundColor: '#F7FAFC',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
    },
    emptyIconBg: {
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#718096',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#A0AEC0',
        textAlign: 'center',
    },
    sessionsHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 16,
    },
    // Calendar Picker Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    calendarContainer: {
        backgroundColor: '#fff',
        width: '100%',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    calendarHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    monthSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9F9FF',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    monthText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#8A2BE2',
    },
    weekdaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    weekdayText: {
        fontSize: 12,
        color: '#999',
        fontWeight: 'bold',
        width: 40,
        textAlign: 'center',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    dayButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 2,
    },
    selectedDayButton: {
        backgroundColor: '#8A2BE2',
        borderRadius: 20,
    },
    dayText: {
        fontSize: 14,
        color: '#333',
    },
    selectedDayText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    pickerSubLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#999',
        marginTop: 20,
        marginBottom: 12,
    },
    timePickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        height: 150,
    },
    timeColumn: {
        flex: 1,
        alignItems: 'center',
    },
    columnLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#999',
        marginBottom: 8,
    },
    columnScroll: {
        width: '100%',
    },
    timeItem: {
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
        marginHorizontal: 5,
        marginBottom: 4,
        backgroundColor: '#F9F9FF',
        borderWidth: 1,
        borderColor: '#E6E6FF',
    },
    selectedTimeItem: {
        backgroundColor: '#8A2BE2',
        borderColor: '#8A2BE2',
    },
    timeItemText: {
        fontSize: 14,
        color: '#666',
    },
    selectedTimeItemText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    periodContainer: {
        width: '100%',
        gap: 10,
    },
    periodButton: {
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#F9F9FF',
        borderWidth: 1,
        borderColor: '#E6E6FF',
    },
    selectedPeriodButton: {
        backgroundColor: '#8A2BE2',
        borderColor: '#8A2BE2',
    },
    periodButtonText: {
        fontSize: 14,
        color: '#666',
    },
    selectedPeriodButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    confirmButton: {
        backgroundColor: '#8A2BE2',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    warningBanner: {
        backgroundColor: '#fff3cd',
        borderWidth: 1,
        borderColor: '#ffeeba',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    warningText: {
        color: '#856404',
        fontSize: 13,
        marginLeft: 10,
        flex: 1,
    },
    sessionCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    sessionInfo: {
        flex: 1,
        paddingRight: 10,
    },
    sessionTitleText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A202C',
        marginBottom: 4,
    },
    sessionTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    sessionDateText: {
        fontSize: 13,
        color: '#718096',
        fontWeight: '500',
    },
    courseBadge: {
        backgroundColor: '#F0EFFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 6,
    },
    courseBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8A2BE2',
    },
    sessionActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    joinButtonSquare: {
        width: 44,
        height: 44,
        backgroundColor: '#F3EBFF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonIcon: {
        padding: 8,
    },
    googleSignInButton: {
        backgroundColor: '#4285F4',
        borderRadius: 10,
        width: '100%',
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    googleIconBox: {
        width: 32,
        height: 32,
        backgroundColor: '#fff',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    googleTextContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    googleSignInText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    joinButton: {
        backgroundColor: '#8A2BE2',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    joinButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    courseItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0EFFF',
    },
    courseItemText: {
        fontSize: 15,
        color: '#333',
    },
});

export default GoogleMeetScreen;
