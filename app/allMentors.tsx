import { followedMentorsStore, Mentor, MENTORS, toggleFollow } from '@/src/data/mentorsStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function AllMentorsScreen() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [followed, setFollowed] = useState(new Set(followedMentorsStore));

    const handleToggleFollow = (mentorId: string) => {
        toggleFollow(mentorId);
        setFollowed(new Set(followedMentorsStore));
    };

    const filteredMentors = MENTORS.filter(mentor =>
        mentor.name.toLowerCase().includes(search.toLowerCase()) ||
        mentor.specialty.toLowerCase().includes(search.toLowerCase())
    );

    const renderMentorCard = ({ item }: { item: Mentor }) => {
        const isFollowed = followed.has(item.id);

        return (
            <View style={styles.mentorCard}>
                <Image source={{ uri: item.avatar }} style={styles.mentorAvatar} />
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
                    style={[styles.followButton, isFollowed && styles.followingButton]}
                    onPress={() => handleToggleFollow(item.id)}
                >
                    <Text style={[styles.followButtonText, isFollowed && styles.followingButtonText]}>
                        {isFollowed ? 'Following' : 'Follow'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
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
            </View>

            {/* Mentors Grid */}
            <FlatList
                data={filteredMentors}
                renderItem={renderMentorCard}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.gridContainer}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                extraData={followed}
            />
        </SafeAreaView>
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
        paddingBottom: 15,
        backgroundColor: '#8A2BE2',
    },
    backButton: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        margin: 20,
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
});
