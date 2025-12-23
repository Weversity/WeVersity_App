import AuthForm from '@/src/components/AuthForm';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  const router = useRouter();
  const [userType, setUserType] = useState('student');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign Up</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <Image
          source={{ uri: 'https://res.cloudinary.com/dn93gd6yw/image/upload/v1764761617/email_assets/pwseyxxtugjoigi0vyf2.png' }}
          style={styles.logo}
        />
        <Text style={styles.title}>
          Sign up as a {userType === 'student' ? 'Student' : 'Instructor'}
        </Text>
      </View>
      <AuthForm 
        initialView="signup" 
        hideSignUpTitle={true} 
        onRoleChange={setUserType}
        role={userType}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 5 : 45,
    paddingBottom: 15,
    backgroundColor: '#8A2BE2',
  },
  backButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    alignItems: 'center',
    paddingTop: 20,
  },
  logo: {
    width: 200,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
