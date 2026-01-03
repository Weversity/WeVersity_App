import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/src/context/AuthContext';
import { CoursesProvider } from '@/src/context/CoursesContext';
import { supabase } from '@/src/lib/supabase';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🚀 Final Authenticated Test Start...');
        // We try a simple select to verify the key's validity against the Project API
        // NOTE: We don't catch AuthApiError here because it's handled by Supabase-js refresh logic,
        // but we wrap the whole call to ensure no uncaught rejections.
        const { data, error } = await supabase.from('profiles').select('id').limit(1);

        if (error) {
          // If it's a session error, it's not a "connection failed" in terms of API keys
          if (error.message?.includes('Refresh Token') || error.message?.includes('session')) {
            console.log('ℹ️ Connection verified, but session is invalid/expired (User likely logged out).');
            return;
          }
          console.error('❌ Connection Result: Failed');
          console.error('Error Message:', error.message);
          console.error('Error Code:', error.code);
          console.error('Probable Cause: Check if the ANON_KEY in your .env matches the one in your Supabase Dashboard.');
        } else {
          console.log('✅ Connection Result: Success!');
          console.log('Verified database connectivity.');
        }
      } catch (err: any) {
        // Handle unexpected uncaught errors (like the ones in the user logs)
        if (err?.message?.includes('Refresh Token') || err?.message?.includes('session')) {
          console.log('ℹ️ Connection verified, but session is invalid/expired (User likely logged out).');
        } else {
          console.error('❌ Unexpected Connection Test Error:', err?.message || err);
        }
      }
    };

    testConnection();
  }, []);

  return (
    <CoursesProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="live/[id]" options={{ headerShown: false }} />
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
  );
}
