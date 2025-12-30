import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { liveSessionService } from '../services/liveSessionService';
import NotificationPopup from './NotificationPopup';

// Helper function to format date for the specific date box
const getDateParts = (dateString: string) => {
    if (!dateString) return { month: '---', day: '--', time: '--:--', weekday: '----' };
    const date = new Date(dateString);
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'AM' : 'PM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const time = `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

    return {
        month: monthNames[date.getMonth()],
        day: date.getDate(),
        time: time,
        weekday: weekDays[date.getDay()]
    };
};

// Helper function for the regular list date formatting
const formatScheduledTime = (dateString: string) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    const now = new Date();

    // Check if today
    const isToday = date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const time = `${hours}:${minutesStr} ${ampm}`;

    if (isToday) {
        return `TODAY • ${time}`;
    }

    return `${month} ${day}, ${year} • ${time}`;
};

// Helper function to extract course data
const getCourseData = (item: any) => {
    if (!item) return null;
    const course = Array.isArray(item.course) ? item.course[0] : item.course;
    return course;
};

// Countdown Hook
const useCountdown = (targetDate: string) => {
    const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = new Date(targetDate).getTime() - now;

            if (distance < 0) {
                setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
                clearInterval(interval);
                return;
            }

            const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft({
                hours: h < 10 ? `0${h}` : `${h}`,
                minutes: m < 10 ? `0${m}` : `${m}`,
                seconds: s < 10 ? `0${s}` : `${s}`
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    return timeLeft;
};

// Spotlight Card Component (Featured Soonest Class)
const SpotlightCard = memo(({ item, onNotify }: { item: any; onNotify: (item: any) => void }) => {
    const course = getCourseData(item);
    const title = course?.title || 'Master Class';
    const courseImage = course?.image_url || course?.thumbnail || course?.cover_image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2670&auto=format&fit=crop';
    const instructor = Array.isArray(course?.instructor) ? course.instructor[0] : course?.instructor;
    const instructorName = `${instructor?.first_name || ''} ${instructor?.last_name || ''}`.trim() || 'Instructor';
    const instructorPicture = instructor?.avatar_url || `https://ui-avatars.com/api/?name=${instructorName}&background=8A2BE2&color=fff`;

    const { hours, minutes, seconds } = useCountdown(item.scheduled_at);
    const dateParts = getDateParts(item.scheduled_at);

    return (
        <View style={styles.spotlightSection}>
            <View style={styles.masterClassRow}>
                <View style={styles.blueBar} />
                <Text style={styles.spotlightHeaderTitle}>FEATURED HIGHLIGHTS</Text>
            </View>

            <View style={styles.spotlightCard}>
                <View style={styles.spotlightImageContainer}>
                    <Image source={{ uri: courseImage }} style={styles.spotlightImage} />

                    {/* Time Overlay */}
                    <View style={styles.spotlightOverlay}>
                        <View style={styles.spotlightTimeRow}>
                            <Ionicons name="time-outline" size={14} color="#fff" />
                            <Text style={styles.spotlightTimeText}>{hours} : {minutes} : {seconds}</Text>
                        </View>

                        <View style={styles.categoryBadgeRow}>
                            <View style={styles.webinarBadge}>
                                <Text style={styles.devBadgeText}>WEBINAR</Text>
                            </View>
                        </View>

                        <Text style={styles.spotlightTitleText} numberOfLines={2}>{title}</Text>
                    </View>
                </View>

                {/* Date Box & Instructor Info Row */}
                <View style={styles.spotlightBottomRow}>
                    {/* Real Date Box from image */}
                    <View style={styles.dateBox}>
                        <View style={styles.dateColumn}>
                            <Text style={styles.dateMonthText}>{dateParts.month}</Text>
                            <Text style={styles.dateDayText}>{dateParts.day}</Text>
                        </View>
                        <View style={styles.dateSeparator} />
                        <View style={styles.timeColumn}>
                            <View style={styles.timeRow}>
                                <Ionicons name="time-outline" size={16} color="#1a1a1a" />
                                <Text style={styles.timeTextBold}>{dateParts.time}</Text>
                            </View>
                            <Text style={styles.dayText}>{dateParts.weekday}</Text>
                        </View>
                    </View>

                    <View style={styles.spotlightDivider} />

                    {/* Instructor Info */}
                    <View style={styles.spotlightInstructorRow}>
                        <Image source={{ uri: instructorPicture }} style={styles.instrAvatar} />
                        <View>
                            <Text style={styles.instrNameSmall}>INSTRUCTOR</Text>
                            <Text style={styles.instrNameMain}>{instructorName}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
});

// Helper function to calculate time until event
const getTimeUntil = (dateString: string) => {
    if (!dateString) return 'TBA';
    const now = new Date().getTime();
    const distance = new Date(dateString).getTime() - now;

    if (distance < 0) return 'STARTED';

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} ${days === 1 ? 'DAY' : 'DAYS'} LEFT`;
    if (hours > 0) return `${hours} ${hours === 1 ? 'HOUR' : 'HOURS'} LEFT`;
    return 'STARTING SOON';
};

// Horizontal Card Component (Regular List)
const SessionItem = memo(({ item, onNotify }: { item: any; onNotify: (item: any) => void }) => {
    const course = getCourseData(item);
    const title = course?.title || 'Upcoming Class';
    const courseImage = course?.image_url || course?.thumbnail || course?.cover_image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2670&auto=format&fit=crop';

    const instructor = Array.isArray(course?.instructor) ? course.instructor[0] : course?.instructor;
    const instructorName = `${instructor?.first_name || ''} ${instructor?.last_name || ''}`.trim() || 'Instructor';
    const instructorPicture = instructor?.avatar_url || `https://ui-avatars.com/api/?name=${instructorName}&background=8A2BE2&color=fff`;

    const formattedDate = formatScheduledTime(item.scheduled_at).toUpperCase();
    const timeUntil = getTimeUntil(item.scheduled_at);

    return (
        <View style={styles.horizontalCard}>
            <View style={styles.cardTopRow}>
                <View style={styles.horizontalImageContainer}>
                    <Image source={{ uri: courseImage }} style={styles.horizontalImage} />
                    <View style={styles.playBadgeContainer}>
                        <Ionicons name="play" size={12} color="#fff" />
                    </View>
                </View>

                <View style={styles.horizontalContent}>
                    <Text style={styles.horizontalDateText}>{formattedDate}</Text>
                    <Text style={styles.horizontalTitle} numberOfLines={2}>{title}</Text>

                    <View style={styles.metricsRow}>
                        <View style={styles.metricItem}>
                            <Ionicons name="time-outline" size={12} color="#999" />
                            <Text style={styles.metricText}>{timeUntil}</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Ionicons name="apps-outline" size={12} color="#999" />
                            <Text style={styles.metricText}>WEBINAR</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.cardBottomRow}>
                <View style={styles.instructorSection}>
                    <Image source={{ uri: instructorPicture }} style={styles.instrAvatar} />
                    <Text style={styles.instrName}>{instructorName}</Text>
                </View>

                <TouchableOpacity style={styles.notifyButtonStyle} onPress={() => onNotify(item)}>
                    <Ionicons name="notifications" size={14} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.notifyButtonText}>Notify Me</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const UpcomingClasses = ({ searchQuery = '' }: { searchQuery?: string }) => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedSession, setSelectedSession] = useState<any | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const data = await liveSessionService.fetchUpcomingClasses();
            const sorted = (data || []).sort((a: any, b: any) =>
                new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
            );
            setSessions(sorted);
        } catch (error) {
            console.error('Error loading upcoming classes:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [loadData]);

    const filteredSessions = useMemo(() => {
        if (!searchQuery.trim()) return sessions;
        const query = searchQuery.toLowerCase();
        return sessions.filter(item => {
            const course = getCourseData(item);
            const instructor = Array.isArray(course?.instructor) ? course.instructor[0] : course?.instructor;
            const iName = `${instructor?.first_name || ''} ${instructor?.last_name || ''}`.toLowerCase();
            return (
                course?.title?.toLowerCase().includes(query) ||
                iName.includes(query)
            );
        });
    }, [sessions, searchQuery]);

    const spotlightClass = useMemo(() => {
        if (filteredSessions.length === 0) return null;
        return filteredSessions[0];
    }, [filteredSessions]);

    const listData = useMemo(() => {
        if (filteredSessions.length <= 1) return [];
        return filteredSessions.slice(1);
    }, [filteredSessions]);

    const handleNotify = useCallback((item: any) => {
        setSelectedSession(item);
        setModalVisible(true);
    }, []);

    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedSession(null);
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#8A2BE2" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading Classes...</Text>
            </View>
        );
    }

    return (
        <View style={styles.fullContainer}>
            <FlatList
                data={listData}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <SessionItem item={item} onNotify={handleNotify} />}
                ListHeaderComponent={
                    <>
                        {spotlightClass && (
                            <SpotlightCard item={spotlightClass} onNotify={handleNotify} />
                        )}
                        <View style={styles.resultsHeader}>
                            <Text style={styles.upcomingListTitle}>Upcoming Events</Text>
                            <Text style={styles.resultsCount}>{sessions.length} Results</Text>
                        </View>
                    </>
                }
                ListEmptyComponent={
                    !loading && sessions.length === 0 ? (
                        <View style={styles.centerContainer}>
                            <Ionicons name="calendar-outline" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>No upcoming classes scheduled.</Text>
                        </View>
                    ) : null
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A2BE2" />
                }
                contentContainerStyle={styles.listPadding}
            />

            {selectedSession && (
                <NotificationPopup
                    visible={modalVisible}
                    onClose={handleCloseModal}
                    onNotify={() => {
                        Alert.alert("Success", "We'll notify you when the class starts!");
                        handleCloseModal();
                    }}
                    courseTitle={getCourseData(selectedSession)?.title || 'Class'}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    fullContainer: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    listPadding: {
        paddingBottom: 30,
    },
    spotlightSection: {
        paddingHorizontal: 16,
        paddingTop: 15,
        marginBottom: 10,
    },
    masterClassRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    blueBar: {
        width: 3,
        height: 16,
        backgroundColor: '#4E55FF',
        marginRight: 8,
        borderRadius: 2,
    },
    spotlightHeaderTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1a1a1a',
        letterSpacing: 0.5,
    },
    spotlightCard: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#fff',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    spotlightImageContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        position: 'relative',
    },
    spotlightImage: {
        width: '100%',
        height: '100%',
    },
    spotlightOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 16,
    },
    spotlightTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        marginBottom: 10,
    },
    spotlightTimeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6,
        fontFamily: 'monospace',
    },
    categoryBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    webinarBadge: {
        backgroundColor: '#4E55FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    devBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    spotlightTitleText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        lineHeight: 28,
    },
    spotlightBottomRow: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dateColumn: {
        alignItems: 'center',
        marginRight: 12,
    },
    dateMonthText: {
        fontSize: 11,
        color: '#FF3B5C',
        fontWeight: 'bold',
    },
    dateDayText: {
        fontSize: 22,
        color: '#1a1a1a',
        fontWeight: 'bold',
    },
    dateSeparator: {
        width: 1,
        height: 30,
        backgroundColor: '#EEE',
        marginRight: 12,
    },
    timeColumn: {
        justifyContent: 'center',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    timeTextBold: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginLeft: 4,
    },
    dayText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    spotlightDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#EEE',
        marginHorizontal: 16,
    },
    spotlightInstructorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    instrNameSmall: {
        fontSize: 9,
        color: '#999',
        fontWeight: 'bold',
    },
    instrNameMain: {
        fontSize: 13,
        color: '#1a1a1a',
        fontWeight: 'bold',
    },
    // List Header
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 15,
    },
    upcomingListTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    resultsCount: {
        fontSize: 11,
        color: '#999',
        fontWeight: '600',
    },
    // Regular Card
    horizontalCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTopRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    horizontalImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 15,
        overflow: 'hidden',
        position: 'relative',
    },
    horizontalImage: {
        width: '100%',
        height: '100%',
    },
    playBadgeContainer: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: '#4E55FF',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    horizontalContent: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    horizontalDateText: {
        color: '#4E55FF',
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    horizontalTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
        lineHeight: 20,
    },
    metricsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    metricText: {
        fontSize: 10,
        color: '#999',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    cardBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
    },
    instructorSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    instrAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    instrName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    notifyButtonStyle: {
        backgroundColor: '#4E55FF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    notifyButtonText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        marginTop: 15,
        textAlign: 'center',
    }
});

export default UpcomingClasses;
