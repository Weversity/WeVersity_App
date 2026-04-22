import { Buffer } from 'buffer';
import 'react-native-get-random-values';
global.Buffer = Buffer;

import ErrorBoundary from '@/components/ErrorBoundary';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { CoursesProvider } from '@/src/context/CoursesContext';
import { registerForPushNotificationsAsync } from '@/src/services/pushNotifications';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../src/lib/polyfills';

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

    // Safety timeout: If auth takes too long (>15s), force the app to show to avoid getting stuck
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        console.warn('InitialLayout: Auth loading timed out after 15s. Forcing app ready.');
        setAppIsReady(true);
      }
    }, 15000);

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
  const router = useRouter();

  useEffect(() => {
    let notificationListener: Notifications.Subscription;
    let responseListener: Notifications.Subscription;

    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log('[RootLayout] Fetched Push Token, checking auth to save to backend...');
          // Optional: If we want to strictly wait for `user.id`, we could move this logic
          // into an auth-dependent effect or listen to auth state changes.
          // For now, this just registers the device. The actual user save might need `user.id`.
        }
      } catch (error) {
        console.error('[RootLayout] Error setting up notifications:', error);
      }
    };

    setupNotifications();

    // 1. Listener for when notification is received WHILE app is open (Foreground)
    notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('[RootLayout] Foreground Notification Received:', notification.request.content.title);
    });

    // 2. Listener for when user TAPS on a notification (Background / Killed state)
    responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[RootLayout] User tapped notification:', response.notification.request.content.title);
      const data = response.notification.request.content.data;

      console.log('[RootLayout] Deep linking data:', data);

      if (data) {
        const routeId = data.id;
        console.log(`[RootLayout] Navigating to screen: ${data.screen} with ID: ${routeId}`);

        switch (data.screen) {
          case 'chat':
            if (routeId) router.push(`/chat/${routeId}`);
            break;
          case 'course':
            if (routeId) router.push(`/courseDetails/${routeId}`);
            break;
          case 'learning':
            if (routeId) router.push(`/learning/${routeId}`);
            break;
          case 'community':
            router.push('/(tabs)/community' as any);
            break;
          default:
            router.push('/notifications');
            break;
        }
      } else {
        router.push('/notifications');
      }
    });

    return () => {
      if (notificationListener) notificationListener.remove();
      if (responseListener) responseListener.remove();
    };
  }, [router]);

  // Deep Linking Logic for Referral Tracking
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      try {
        const { path, queryParams } = Linking.parse(event.url);
        console.log('[DeepLink] Parsed Link:', { path, queryParams });

        if ((path?.includes('student-registration') || path?.includes('instructor-registration')) && queryParams?.ref) {
          const referralCode = queryParams.ref as string;
          console.log('[DeepLink] Found Referral Code:', referralCode);

          AsyncStorage.setItem('weversity_referral_code', referralCode)
            .then(() => console.log('[DeepLink] Referral code saved to AsyncStorage'))
            .catch(err => console.error('[DeepLink] Error saving referral code:', err));

          // Optionally, redirect to the specific signup page if needed
          // router.push(path as any);
        }
      } catch (error) {
        console.error('[DeepLink] Error handling deep link:', error);
      }
    };

    // 1. Handle link that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // 2. Handle links while app is in foreground/background
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <CoursesProvider>
            <AuthProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <BottomSheetModalProvider>
                  <InitialLayout />
                  <StatusBar style="auto" />
                </BottomSheetModalProvider>
              </ThemeProvider>
            </AuthProvider>
          </CoursesProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
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
