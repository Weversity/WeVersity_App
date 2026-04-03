import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  StatusBar,
} from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming,
    runOnJS,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import AuthForm from './AuthForm';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LoginPopup: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const translateY = useSharedValue(SCREEN_HEIGHT * 0.9);
  const context = useSharedValue({ y: 0 });

  const { login } = useAuth();
  const router = useRouter();

  const scrollTo = (destination: number) => {
    'worklet';
    translateY.value = withSpring(destination, { 
      damping: 50,
      stiffness: 100,
      mass: 0.5,
    });
  };

  useEffect(() => {
    if (visible) {
      scrollTo(0); // Open to its naturally calculated top
    } else {
      scrollTo(SCREEN_HEIGHT * 0.9);
    }
  }, [visible]);

  const closeSheet = () => {
    translateY.value = withTiming(SCREEN_HEIGHT * 0.9, { duration: 300 }, () => {
        runOnJS(onClose)();
        runOnJS(setShowPhoneLogin)(false);
    });
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y;
      // Clamp: 0 is open, SCREEN_HEIGHT * 0.9 is closed
      translateY.value = Math.max(translateY.value, -20); // allow slightly over-drag
    })
    .onEnd((event) => {
      if (translateY.value > SCREEN_HEIGHT * 0.3 || event.velocityY > 500) {
        runOnJS(closeSheet)();
      } else {
        scrollTo(0);
      }
    });

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(visible ? 1 : 0),
    };
  }, [visible]);

  const handlePhoneLogin = () => {
    setShowPhoneLogin(true);
  };

  const handleSignUpPress = () => {
    closeSheet();
    router.push('/signup');
  };

  const toggleCheckbox = () => {
    setAgreedToTerms(!agreedToTerms);
  };

  const openTerms = () => {
    closeSheet();
    router.push('/terms-of-service');
  };

  const openPrivacy = () => {
    closeSheet();
    router.push('/privacy-policy');
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const isExpoGo = Constants.appOwnership === 'expo';
    if (!isExpoGo) {
      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        if (GoogleSignin) {
          GoogleSignin.configure({
            offlineAccess: true,
            webClientId: '636424335937-7i9odsp5fr6sh0ppsjcb1v27bd0f0m74.apps.googleusercontent.com',
          });
        }
      } catch (e) {
        console.warn('[LoginPopup] GoogleSignin.configure failed:', e);
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    if (Constants.appOwnership === 'expo') {
      Alert.alert('Development Build Required', 'Google Login requires a development build.');
      return;
    }
    try {
      let idToken;
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      idToken = userInfo?.data?.idToken || userInfo?.idToken;

      if (!idToken) {
        Alert.alert('Login Failed', 'Could not retrieve ID token.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;

      if (data.session) {
        // ... (profile logic is identical, kept for functionality)
        const { data: profile } = await supabase.from('profiles').select('role, approved').eq('id', data.session.user.id).single();
        if (profile?.role === 'instructor' && !profile?.approved) {
           await supabase.auth.signOut();
           Alert.alert("Pending", "Account pending approval.");
           return;
        }
        closeSheet();
        setTimeout(() => router.replace('/(tabs)'), 300);
      }
    } catch (error: any) {
      console.error('Google Sign-In Error', error);
    }
  };

  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('No token');
      const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
      if (error) throw error;
      if (data.session) {
        closeSheet();
        setTimeout(() => router.replace('/(tabs)'), 300);
      }
    } catch (e) { console.error(e); }
  };

  const renderSocialLogins = () => (
    <View style={styles.socialContainer}>
      <TouchableOpacity style={styles.button} onPress={handlePhoneLogin}>
        <Ionicons name="person-outline" size={24} color="black" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Continue with Email or Phone</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
        <Image source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} style={[styles.buttonIcon, { width: 22, height: 22 }]} />
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
      {Platform.OS === 'ios' && (
        <TouchableOpacity style={styles.button} onPress={handleAppleLogin}>
          <Ionicons name="logo-apple" size={24} color="black" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Continue with Apple</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.legalRow}>
        <TouchableOpacity onPress={toggleCheckbox}>
          <Ionicons name={agreedToTerms ? "checkbox" : "square-outline"} size={20} color={agreedToTerms ? "#8A2BE2" : "#666"} />
        </TouchableOpacity>
        <Text style={styles.legalText}>
          By continuing, you agree to our <Text style={styles.linkText} onPress={openTerms}>Terms</Text> and <Text style={styles.linkText} onPress={openPrivacy}>Privacy Policy</Text>.
        </Text>
      </View>
      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>New to WeVersity?</Text>
        <TouchableOpacity onPress={handleSignUpPress}>
          <Text style={styles.signupLink}> Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!visible && translateY.value === 0) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={closeSheet} animationType="none" statusBarTranslucent={true}>
      <View style={StyleSheet.absoluteFill}>
        {visible && <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={closeSheet} />
        </Animated.View>

        <Animated.View style={[styles.sheet, rBottomSheetStyle]}>
          <GestureDetector gesture={gesture}>
            <View style={styles.headerArea}>
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>
              {showPhoneLogin && (
                <TouchableOpacity onPress={() => setShowPhoneLogin(false)} style={styles.backBtn}>
                  <Ionicons name="chevron-back-circle" size={32} color="#ddd" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
                <Ionicons name="close-circle" size={32} color="#ddd" />
              </TouchableOpacity>
              
              <View style={styles.header}>
                <Image source={{ uri: 'https://res.cloudinary.com/dn93gd6yw/image/upload/v1764913053/weversity/aekx2f9ciildnnnmg62p.jpg' }} style={styles.logo} />
                <Text style={styles.title}>{showPhoneLogin ? 'Welcome Back' : 'Log in to Grow'}</Text>
              </View>
            </View>
          </GestureDetector>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView 
              contentContainerStyle={[
                styles.scrollContent,
                keyboardHeight > 0 && { paddingBottom: keyboardHeight + 20 }
              ]} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {showPhoneLogin ? (
                <View style={styles.formContainer}>
                   <AuthForm onAuthSuccess={closeSheet} showSignUpLink={false} hideSignInTitle={true} disableScroll={true} />
                </View>
              ) : renderSocialLogins()}
            </ScrollView>
            {renderFooter()}
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    height: SCREEN_HEIGHT * 0.9,
    width: '100%',
    backgroundColor: 'white',
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.1, // Start 10% from top
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  headerArea: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
  },
  dragHandleContainer: {
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%',
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#dbdbdb',
    borderRadius: 3,
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    top: 20,
    zIndex: 10,
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1C3D',
    marginTop: -5,
    textAlign: 'center',
  },
  socialContainer: {
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonIcon: {
    position: 'absolute',
    left: 15,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 70 : 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    width: '100%',
    justifyContent: 'space-between',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align checkmark with first line of text
    gap: 10,
    marginTop: 15,
    marginBottom: 10,
  },
  legalText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  linkText: {
    color: '#8A2BE2',
    fontWeight: '700',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 5,
  },
  signupText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  signupLink: {
    color: '#8A2BE2',
    fontWeight: 'bold',
    fontSize: 15,
  },
  formContainer: {
    marginTop: 10,
  },
});

export default LoginPopup;
