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

  useEffect(() => {
    if (params.repress && !isAuthenticated) {
      setShowPopup(true);
    }
  }, [params.repress, isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoading && !isAuthenticated) {
        setShowPopup(true);
      }
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
              onAuthSuccess={() => { }}
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
