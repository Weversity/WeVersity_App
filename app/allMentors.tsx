import { followedMentorsStore, toggleFollow } from '@/src/data/mentorsStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function AllMentorsScreen() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [instructors, setInstructors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [followed, setFollowed] = useState(new Set(followedMentorsStore));

    const fetchInstructors = async (query = '') => {
        setIsLoading(true);
        try {
            const { supabase } = await import('@/src/auth/supabase');
            let supabaseQuery = (supabase as any)
                .from('profiles')
                .select(`
                    id, 
                    first_name, 
                    last_name, 
                    avatar_url,
                    courses (
                        id,
                        enrollments (count),
                        reviews (rating)
                    )
                `)
                .eq('role', 'instructor');

            if (query) {
                supabaseQuery = supabaseQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
            }

            const { data, error } = await supabaseQuery;

            if (error) throw error;

            if (data) {
                const mapped = data.map((p: any) => {
                    const first = p.first_name || '';
                    const last = p.last_name || '';
                    const initials = (first?.[0] || '') + (last?.[0] || '');

                    // Calculate Stats
                    let totalStudents = 0;
                    let totalRatingSum = 0;
                    let totalRatingCount = 0;

                    if (p.courses && Array.isArray(p.courses)) {
                        p.courses.forEach((c: any) => {
                            // Enrollments Count
                            if (c.enrollments && c.enrollments[0]) {
                                totalStudents += c.enrollments[0].count || 0;
                            }

                            // Ratings
                            if (c.reviews && Array.isArray(c.reviews)) {
                                c.reviews.forEach((r: any) => {
                                    if (r.rating) {
                                        totalRatingSum += r.rating;
                                        totalRatingCount++;
                                    }
                                });
                            }
                        });
                    }

                    const avgRating = totalRatingCount > 0 ? (totalRatingSum / totalRatingCount) : 0;

                    return {
                        id: p.id,
                        name: `${first} ${last}`.trim() || 'Instructor',
                        avatar: p.avatar_url,
                        initials: initials.toUpperCase() || 'IN',
                        specialty: 'Professional Mentor',
                        followers: totalStudents,
                        rating: Number(avgRating.toFixed(1))
                    };
                });
                setInstructors(mapped);
            }
        } catch (error) {
            console.error('Error fetching instructors:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInstructors();
    }, []);

    // Debounced search could be better, but simple useEffect for now
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchInstructors(search);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const handleToggleFollow = (mentorId: string) => {
        toggleFollow(mentorId);
        setFollowed(new Set(followedMentorsStore));
    };

    // No longer using local filteredMentors

    const renderMentorCard = ({ item }: { item: any }) => {
        const isFollowed = followed.has(item.id);

        return (
            <View style={styles.mentorCard}>
                {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.mentorAvatar} />
                ) : (
                    <View style={[styles.mentorAvatar, styles.initialsContainer]}>
                        <Text style={styles.initialsText}>{item.initials}</Text>
                    </View>
                )}
                <Text style={styles.mentorName}>{item.name}</Text>
                <Text style={styles.mentorSpecialty}>{item.specialty}</Text>

                <View style={styles.mentorStats}>
                    <View style={styles.statItem}>
                        <Ionicons name="people-outline" size={16} color="#666" />
                        <Text style={styles.statText}>{item.followers.toLocaleString()}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text style={styles.statText}>{item.rating}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.followButton}
                    onPress={() => router.push({
                        pathname: `/instructorAnalytics/${item.id}`,
                        params: {
                            name: item.name,
                            avatar: item.avatar || '',
                            initials: item.initials
                        }
                    } as any)}
                >
                    <Text style={styles.followButtonText}>View Profile</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Mentors</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search mentors..."
                    placeholderTextColor="#999"
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }}>
                    <ActivityIndicator size="large" color="#8A2BE2" />
                    <Text style={{ marginTop: 10, color: '#666' }}>Loading mentors...</Text>
                </View>
            ) : instructors.length > 0 ? (
                <FlatList
                    data={instructors}
                    renderItem={renderMentorCard}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.gridContainer}
                    columnWrapperStyle={styles.row}
                    showsVerticalScrollIndicator={false}
                    extraData={followed}
                />
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }}>
                    <Ionicons name="people-outline" size={64} color="#ccc" />
                    <Text style={{ marginTop: 10, color: '#999', fontSize: 16 }}>No mentors found</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F7FC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 5 : 45,
        paddingBottom: 12,
        backgroundColor: '#8A2BE2',
    },
    backButton: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 10,
        paddingHorizontal: 15,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    gridContainer: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    mentorCard: {
        width: (width - 45) / 2,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    mentorAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 12,
        borderWidth: 3,
        borderColor: '#8A2BE2',
    },
    mentorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
        textAlign: 'center',
    },
    mentorSpecialty: {
        fontSize: 12,
        color: '#666',
        marginBottom: 12,
        textAlign: 'center',
    },
    mentorStats: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    followButton: {
        backgroundColor: '#8A2BE2',
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 20,
        width: '100%',
        alignItems: 'center',
    },
    followingButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#8A2BE2',
    },
    followButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    followingButtonText: {
        color: '#8A2BE2',
    },
    initialsContainer: {
        backgroundColor: '#E6E6FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        color: '#8A2BE2',
        fontSize: 24,
        fontWeight: 'bold',
    },
});
