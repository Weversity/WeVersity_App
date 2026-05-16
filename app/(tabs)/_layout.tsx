import { useAuth } from '@/src/context/AuthContext';
import { HapticsService } from '@/src/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigationState } from '@react-navigation/native';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function TabLayout() {
  const { isAuthenticated, unreadMessagesCount } = useAuth();
  const router = useRouter();
  const activeRouteName = useNavigationState(state => state.routes[state.index]?.name);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8A2BE2', // Purple
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: 80, // Reduced height
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        }
      }}
      screenListeners={{
        tabPress: (e: any) => {
          // 1. Haptic Feedback for premium feel
          // e.target usually looks like "inbox-12345"
          // We only vibrate if the target tab is NOT the current active tab
          const targetName = e.target?.split('-')[0];
          if (targetName && activeRouteName !== targetName) {
            HapticsService.medium();
          }

          // 2. Auth Check for Profile Tab
          if (e.target?.includes('profile') && !isAuthenticated) {
            if (activeRouteName === 'profile') {
              e.preventDefault();
              router.setParams({ repress: Date.now().toString() });
            }
          }
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Shorts',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="film-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="videocam-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="upcoming"
        options={{
          title: 'Upcoming',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="calendar-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="myCourses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="library-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarBadge: unreadMessagesCount > 0 ? (unreadMessagesCount > 99 ? '99+' : unreadMessagesCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#8A2BE2',
            color: '#fff',
            fontSize: 10,
            fontWeight: 'bold',
            marginTop: 4,
          },
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="chatbox-ellipses-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
