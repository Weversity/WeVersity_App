import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigationState } from '@react-navigation/native';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function TabLayout() {
  const { isAuthenticated, unreadCount } = useAuth();
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
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <View style={{ width: size + 10, height: size + 10, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="chatbox-ellipses-outline" color={color} size={size} />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  backgroundColor: '#8A2BE2',
                  borderRadius: 9,
                  minWidth: 18,
                  height: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                  borderWidth: 1.5,
                  borderColor: '#fff',
                }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold', lineHeight: 12 }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
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
