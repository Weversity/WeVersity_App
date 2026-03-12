import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const NotificationIcon = () => {
    const router = useRouter();
    const { unreadCount } = useAuth();

    console.log('Current Unread Count:', unreadCount);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
        >
            <View style={{ position: 'relative' }}>
                <Ionicons name="notifications-outline" size={24} color="#fff" />
                {unreadCount > 0 && <View style={styles.notificationDot} />}
            </View>
        </TouchableOpacity>
    );
};

export default NotificationIcon;

const styles = StyleSheet.create({
    container: {
        padding: 5,
    },
    notificationDot: {
        position: 'absolute',
        top: -1,
        right: -1,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF3B30',
        borderWidth: 1.5,
        borderColor: '#8A2BE2', // Matches header purple
        zIndex: 999,
        elevation: 5,
    },
});
