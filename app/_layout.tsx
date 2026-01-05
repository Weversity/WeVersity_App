import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/src/context/AuthContext';
import { CoursesProvider } from '@/src/context/CoursesContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();


  return (
    <QueryClientProvider client={queryClient}>
      <CoursesProvider>
        <AuthProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              {/* ... existing screens ... */}
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="live/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="courseDetails/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="learning/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="profileSettings" options={{ headerShown: false }} />
              <Stack.Screen name="bookmarkedCourses" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="followers" options={{ headerShown: false }} />
              <Stack.Screen name="allMentors" options={{ headerShown: false }} />
              <Stack.Screen name="allReviews" options={{ headerShown: false }} />
              <Stack.Screen name="support" options={{ headerShown: false }} />

              <Stack.Screen name="allWatchedCourses" options={{ headerShown: false }} />

              <Stack.Screen
                name="notifications"
                options={{
                  title: 'Notifications',
                  headerStyle: { backgroundColor: '#8A2BE2' },
                  headerTintColor: '#fff',
                  headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
                  headerTitleAlign: 'center',
                }}
              />
              <Stack.Screen name="myUploadedCourses" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </AuthProvider>
      </CoursesProvider>
    </QueryClientProvider>
  );
}
