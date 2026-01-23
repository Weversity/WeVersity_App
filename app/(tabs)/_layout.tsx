import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigationState } from '@react-navigation/native';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const { isAuthenticated } = useAuth();
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
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        }
      }}
      screenListeners={{
        tabPress: (e) => {
          // Check if the user is logged out and pressing the profile tab
          if (e.target?.includes('profile') && !isAuthenticated) {
            // Also check if they are already on the profile screen
            if (activeRouteName === 'profile') {
              e.preventDefault(); // Stop the default action
              // Navigate with a param to trigger the popup
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
          tabBarIcon: ({ color, size }) => <Ionicons name="film-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarIcon: ({ color, size }) => <Ionicons name="videocam-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="upcoming"
        options={{
          title: 'Upcoming',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="myCourses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
