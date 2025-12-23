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
      console.log('🚀 Final Authenticated Test Start...');
      // We try a simple select to verify the key's validity against the Project API
      const { data, error } = await supabase.from('profiles').select('id').limit(1);

      if (error) {
        console.error('❌ Connection Result: Failed');
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);
        console.error('Probable Cause: Check if the ANON_KEY in your .env matches the one in your Supabase Dashboard.');
      } else {
        console.log('✅ Connection Result: Success!');
        console.log('Verified database connectivity.');
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
            <Stack.Screen name="createCourse" options={{ headerShown: false }} />
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
