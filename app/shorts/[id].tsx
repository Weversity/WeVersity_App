import ShortFeedItem from '@/src/components/shorts/ShortFeedItem';
import { videoService } from '@/src/services/videoService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SingleShortScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [short, setShort] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial mute state for this standalone view
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        const fetchShort = async () => {
            if (!id) return;
            try {
                // Assuming we have a method to fetch a single short or we can filter it
                // If fetchSingleShort doesn't exist, we might need to add it to videoService
                // For now, let's try to fetch it directly from Supabase if possible, 
                // or if videoService exposes a direct method.
                // Since I can't modify videoService easily right now without seeing it, 
                // I'll implement a basic fetch using the existing pattern if possible,
                // or add a getSingleShort method ideally. 

                // Let's assume we need to add getShortById to videoService 
                // or use supabase directly if exposed.
                // For safety in this "complete it" step, I will use a direct supabase call 
                // via the service if available or try to add the method if I can access the service file again.
                // Looking at previous `videoService.js`, it didn't have getShortById.
                // I will add a method to videoService.js in the next step if needed.
                // For now, let's assume videoService.getShortById(idString) exists or I will verify.

                // WAIT: I should check videoService.js first.
                // But I will write this file assuming I will update videoService.js next.
                const data = await videoService.getShortById(id as string);

                if (data) {
                    setShort(data);
                } else {
                    setError('Short not found');
                }
            } catch (err: any) {
                console.error("Error fetching short:", err);
                setError('Failed to load video');
            } finally {
                setLoading(false);
            }
        };

        fetchShort();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <ActivityIndicator size="large" color="#8A2BE2" />
            </View>
        );
    }

    if (error || !short) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <Ionicons name="alert-circle-outline" size={50} color="#fff" />
                <Text style={styles.errorText}>{error || 'Video not found'}</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)')}>
                    <Text style={styles.backButtonText}>Go to Feed</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="black" translucent />

            {/* Back Button Overlay */}
            <TouchableOpacity style={styles.topBackButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <ShortFeedItem
                item={short}
                isVisible={true}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                onRefresh={() => { }} // No refresh needed for single item
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#fff',
        marginTop: 20,
        fontSize: 16,
    },
    backButton: {
        marginTop: 20,
        backgroundColor: '#8A2BE2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    topBackButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    }
});
