import AuthForm from '@/src/components/AuthForm';
import LoginPopup from '@/src/components/LoginPopup';
import InstructorProfile from '@/src/components/profile/InstructorProfile';
import StudentProfile from '@/src/components/profile/StudentProfile';
import { useAuth } from '@/src/context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';

export default function ProfileScreen() {
  const { isAuthenticated, role, isLoading, logout } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const params = useLocalSearchParams();

  // Effect to handle re-pressing the tab while already on the screen
  useEffect(() => {
    // Check if repress param exists and we are not auth
    if (params.repress && !isAuthenticated) {
      setShowPopup(true);
      // Optional: Clear params to avoid loop if navigating back? 
      // Actually Expo Router params persist, so comparing against previous value might be needed if we used a stable ID, 
      // but Date.now() guarantees change, so simple truthiness + dependency on [params.repress] is enough.
    }
  }, [params.repress, isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      // When the screen comes into focus, show the popup if not authenticated
      if (!isLoading && !isAuthenticated) {
        setShowPopup(true);
      }
      // Hide the popup when the screen goes out of focus
      return () => setShowPopup(false);
    }, [isLoading, isAuthenticated])
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.contentArea}>
        {isAuthenticated ? (
          <>
            {role === 'Student' && <StudentProfile />}
            {role === 'Instructor' && <InstructorProfile logout={logout} />}
          </>
        ) : (
          showPopup
            ? <LoginPopup visible={showPopup} onClose={() => setShowPopup(false)} />
            : <AuthForm
              onAuthSuccess={() => {
                // Optionally, refresh or navigate upon successful login
              }}
              showSignUpLink={false}
              withHeader={true}
            />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonContainer: {
    margin: 20,
  },
  loginPrompt: {
    fontSize: 18,
    color: '#666',
  },
});
