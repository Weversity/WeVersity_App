import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/src/context/AuthContext';
import { CoursesProvider } from '@/src/context/CoursesContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

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
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </CoursesProvider>
  );
}
