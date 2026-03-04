import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import ShortFeedItem from '../../src/components/shorts/ShortFeedItem';
const { width, height } = Dimensions.get('window');

export default function PlayerScreen() {
    const params = useLocalSearchParams();
    const { video_url, id, likes_count, description, instructor_id, instructor_name, instructor_avatar, type } = params;
    const router = useRouter();

    const item = {
        id: id as string,
        video_url: video_url as string,
        type: type as 'image' | 'video',
        likes_count: parseInt(likes_count as string || '0'),
        description: description as string,
        instructor_id: instructor_id as string,
        instructor: {
            id: instructor_id as string,
            first_name: instructor_name as string,
            avatar_url: instructor_avatar as string
        }
    };

    const [isMuted, setIsMuted] = React.useState(false);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" backgroundColor="black" />

            {/* Simple Back Overlay */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>

            <ShortFeedItem
                item={item}
                isVisible={true}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                onRefresh={() => { }}
                containerHeight={height - (StatusBar.currentHeight || 0)}
                containerWidth={width}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 999,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    }
});
