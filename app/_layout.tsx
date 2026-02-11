import { Buffer } from 'buffer';
import 'react-native-get-random-values';
global.Buffer = Buffer;

import ErrorBoundary from '@/components/ErrorBoundary';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import '../src/lib/polyfills';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { CoursesProvider } from '@/src/context/CoursesContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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

function LoadingScreen({ onLayout }: { onLayout: () => void }) {
  return (
    <View style={styles.loadingContainer} onLayout={onLayout}>
      <Image
        source={require('../assets/images/splash-icon-dark.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#8A2BE2" style={styles.indicator} />
    </View>
  );
}

function InitialLayout() {
  const { isLoading } = useAuth();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    console.log('InitialLayout: Checking auth loading state...', { isLoading });

    // Safety timeout: If auth takes too long (>5s), force the app to show to avoid getting stuck
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        console.warn('InitialLayout: Auth loading timed out. Forcing app ready.');
        setAppIsReady(true);
      }
    }, 5000);

    if (!isLoading) {
      console.log('InitialLayout: Auth finished loading. Preparing to hide splash screen...');
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        console.log('InitialLayout: Setting appIsReady to true');
        setAppIsReady(true);
      }, 500);
      return () => {
        clearTimeout(timer);
        clearTimeout(safetyTimer);
      };
    }

    return () => clearTimeout(safetyTimer);
  }, [isLoading]);

  // Ensure we hide splash screen as soon as our custom loading UI is mounted
  const onLayoutRootView = React.useCallback(async () => {
    console.log('InitialLayout: onLayoutRootView called. Hiding native splash screen...');
    try {
      await SplashScreen.hideAsync();
      console.log('InitialLayout: Native splash screen hidden successfully');
    } catch (e) {
      console.warn('InitialLayout: Error hiding splash screen:', e);
    }
  }, []);

  if (!appIsReady) {
    return <LoadingScreen onLayout={onLayoutRootView} />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="live/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="courseDetails/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="learning/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="viewProfile/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="instructorAnalytics/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="player/index" options={{ headerShown: false }} />

      <Stack.Screen name="profileSettings" options={{ headerShown: false }} />
      <Stack.Screen name="bookmarkedCourses" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="followers" options={{ headerShown: false }} />
      <Stack.Screen name="allMentors" options={{ headerShown: false }} />
      <Stack.Screen name="allReviews" options={{ headerShown: false }} />
      <Stack.Screen name="support" options={{ headerShown: false }} />
      <Stack.Screen name="allWatchedCourses" options={{ headerShown: false }} />
      <Stack.Screen name="forgetPassword" options={{ headerShown: false }} />
      <Stack.Screen name="quiz" options={{ headerShown: false }} />
      <Stack.Screen name="myUploadedCourses" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
      <Stack.Screen name="terms-of-service" options={{ headerShown: false }} />

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
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CoursesProvider>
          <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <InitialLayout />
              <StatusBar style="auto" />
            </ThemeProvider>
          </AuthProvider>
        </CoursesProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  indicator: {
    marginTop: 20,
  },
});
