import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const NotificationIcon = () => {
    const router = useRouter();
    const { unreadCount } = useAuth();

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => router.push('/notifications')}
        >
            <View>
                <Ionicons name="notifications-outline" size={24} color="#fff" />
                {unreadCount > 0 && <View style={styles.notificationBadge} />}
            </View>
        </TouchableOpacity>
    );
};

export default NotificationIcon;

const styles = StyleSheet.create({
    container: {
        padding: 5,
    },
    notificationBadge: {
        position: 'absolute',
        top: -4,
        right: -2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#8A2BE2',
    },
});
