import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import AuthForm from './AuthForm';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LoginPopup: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const [showInternalPopup, setShowInternalPopup] = useState(false);
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // The vertical position of the sheet. Starts off-screen (SCREEN_HEIGHT).
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Use useRef to keep track of gesture state without re-renders
  const lastGestureDy = useRef(0);

  const { login } = useAuth();
  const router = useRouter();

  const resetPosition = () => {
    Animated.spring(panY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 5,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(panY, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowInternalPopup(false);
      setShowPhoneLogin(false);
      onClose(); // Notify parent
    });
  };

  // Re-create PanResponder with proper logic for "Down Drag Only" preferrably
  const panResponderRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger for significant vertical movements
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down (positive dy)
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        } else {
          // Resist dragging up
          panY.setValue(gestureState.dy * 0.1);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120) {
          closeSheet();
        } else {
          resetPosition();
        }
      }
    })
  ).current;


  useEffect(() => {
    if (visible) {
      setShowInternalPopup(true);
      // Animate In: slide up to 0
      panY.setValue(SCREEN_HEIGHT);
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      // If visible becomes false externally
      Animated.timing(panY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowInternalPopup(false);
        setShowPhoneLogin(false);
      });
    }
  }, [visible]);

  // Keyboard Listeners for dynamic sizing
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Interpolate backdrop opacity
  // When panY is 0 (fully open), opacity is 0.5
  // When panY is SCREEN_HEIGHT (closed), opacity is 0
  const backdropOpacity = panY.interpolate({
    inputRange: [0, SCREEN_HEIGHT / 2, SCREEN_HEIGHT],
    outputRange: [0.5, 0.2, 0],
    extrapolate: 'clamp',
  });

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
    // Check if running in Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';

    if (!isExpoGo) {
      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        GoogleSignin.configure({
          offlineAccess: true,
          webClientId: '636424335937-7i9odsp5fr6sh0ppsjcb1v27bd0f0m74.apps.googleusercontent.com',
        });
      } catch (e) {
        console.warn('GoogleSignin.configure failed:', e);
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    // Check if running in Expo Go
    if (Constants.appOwnership === 'expo') {
      Alert.alert(
        'Development Build Required',
        'Google Login requires a development build. It will not work in the standard Expo Go app. Use "npx expo run:android" to test locally.'
      );
      return;
    }

    try {
      console.log('🔵 [Google Login] Step 1: Starting Google Sign-In...');
      const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');

      console.log('🔵 [Google Login] Step 2: Checking Play Services...');
      await GoogleSignin.hasPlayServices();

      console.log('🔵 [Google Login] Step 3: Showing Google Account Picker...');
      const userInfo = await GoogleSignin.signIn();

      console.log('🔵 [Google Login] Step 4: User Info Received:', JSON.stringify(userInfo, null, 2));

      // ✅ ROBUST extracted logic for v11+ / v12+
      // New versions return { data: { idToken... }, type: 'success' }
      // Older versions returned { idToken... } directly
      let idToken = userInfo?.data?.idToken || userInfo?.idToken;

      if (!idToken) {
        console.error('❌ [Google Login] No idToken found in response');
        console.error('Full userInfo structure:', JSON.stringify(userInfo, null, 2));
        Alert.alert(
          'Login Failed',
          'Could not retrieve authentication token from Google. This usually means the Client ID or SHA-1 is mismatched in Google Cloud Console.'
        );
        return;
      }

      console.log('🔵 [Google Login] Step 5: ID Token Retrieved:', idToken.substring(0, 20) + '...');
      console.log('🔵 [Google Login] Step 6: Authenticating with Supabase...');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        console.error('❌ [Google Login] Supabase Error:', error.message);
        console.error('Error Details:', JSON.stringify(error, null, 2));
        Alert.alert('Authentication Failed', `Supabase error: ${error.message}`);
        return;
      }

      console.log('✅ [Google Login] Step 7: Supabase Authentication Successful');
      console.log('Session Data:', JSON.stringify(data.session, null, 2));

      if (data.session) {
        console.log('🔵 [Google Login] Step 8: Checking if user exists in profiles...');

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, approved')
          .eq('id', data.session.user.id)
          .single();

        if (profileError || !profile) {
          // User doesn't exist in database - this is a new user trying to login
          console.log('🔵 [Google Login] User profile not found, Attempting auto-creation...');

          const fullName = data.session.user.user_metadata?.full_name || 'Google User';
          const email = data.session.user.email;
          const [firstName, ...lastNameArr] = fullName.split(' ');
          const lastName = lastNameArr.join(' ') || '';

          const { error: insertError } = await supabase
            .from('profiles')
            .upsert([
              {
                id: data.session.user.id,
                role: 'student',
                first_name: firstName,
                last_name: lastName,
                username: email,
                approved: true,
                email: email,
              }
            ], { onConflict: 'id' });

          if (insertError) {
            console.error('❌ [Google Login] Profile Auto-creation failed:', insertError.message);
            // Even if creation fails, we don't necessarily want to kick them out if the session is valid
          } else {
            console.log('✅ [Google Login] Profile auto-created successfully');
          }
        }

        if (profile?.role === 'instructor' && profile?.approved === false) {
          await supabase.auth.signOut();
          Alert.alert(
            "Account Pending",
            "Your instructor account is still pending approval. Please wait for an email once your account is activated.",
            [{ text: "OK" }]
          );
          return;
        }

        // User exists, proceed with login
        console.log('✅ [Google Login] Step 9: User profile found, Navigating to Dashboard...');
        closeSheet();

        // ✅ ADDED: Explicit navigation to ensure redirection happens
        // The onAuthStateChange listener should also trigger, but this ensures it
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 300);
      } else {
        console.warn('⚠️ [Google Login] No session created despite successful authentication');
        Alert.alert('Login Issue', 'Authentication succeeded but no session was created. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ [Google Login] Full Error:', error);
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);

      // User-friendly error messages based on status codes
      const { statusCodes } = require('@react-native-google-signin/google-signin');
      let userMessage = 'An unexpected error occurred. Please try again.';

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        userMessage = 'Sign-in was cancelled.';
      } else if (error.code === statusCodes.IN_PROGRESS) {
        userMessage = 'Sign-in is already in progress.';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        userMessage = 'Google Play Services not available.';
      }

      Alert.alert('Google Sign-In Error', userMessage);
    }
  };

  const handleAppleLogin = async () => {
    try {
      console.log('🔵 [Apple Login] Step 1: Starting Apple Sign-In...');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identityToken returned from Apple.');
      }

      console.log('🔵 [Apple Login] Step 2: Authenticating with Supabase...');
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        console.error('❌ [Apple Login] Supabase Error:', error.message);
        Alert.alert('Authentication Failed', `Supabase error: ${error.message}`);
        return;
      }

      console.log('✅ [Apple Login] Step 3: Supabase Authentication Successful');

      if (data.session) {
        console.log('🔵 [Apple Login] Step 4: Checking if user exists in profiles...');

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, approved')
          .eq('id', data.session.user.id)
          .single();

        if (profileError || !profile) {
          console.log('🔵 [Apple Login] User profile not found, Attempting auto-creation...');

          const fullNameObj = credential.fullName;
          const appleEmail = credential.email || data.session.user.email;

          const firstName = fullNameObj?.givenName || 'Apple';
          const lastName = fullNameObj?.familyName || 'User';

          const { error: insertError } = await supabase
            .from('profiles')
            .upsert([
              {
                id: data.session.user.id,
                role: 'student',
                first_name: firstName,
                last_name: lastName,
                username: appleEmail,
                approved: true,
                email: appleEmail,
              }
            ], { onConflict: 'id' });

          if (insertError) {
            console.error('❌ [Apple Login] Profile Auto-creation failed:', insertError.message);
          } else {
            console.log('✅ [Apple Login] Profile auto-created successfully');
          }
        }

        if (profile?.role === 'instructor' && profile?.approved === false) {
          await supabase.auth.signOut();
          Alert.alert(
            "Account Pending",
            "Your instructor account is still pending approval. Please wait for an email once your account is activated.",
            [{ text: "OK" }]
          );
          return;
        }

        console.log('✅ [Apple Login] Step 5: User profile found, Navigating to Dashboard...');
        closeSheet();
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 300);
      } else {
        console.warn('⚠️ [Apple Login] No session created');
        Alert.alert('Login Issue', 'Authentication succeeded but no session was created.');
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign-In Cancelled', 'The Apple sign-in process was cancelled.');
      } else {
        console.error('❌ [Apple Login] Error:', error);
        Alert.alert('Apple Sign-In Error', 'An unexpected error occurred. Please try again.');
      }
    }
  };

  const renderSocialLogins = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.topContent}>
        <TouchableOpacity style={styles.button} onPress={handlePhoneLogin}>
          <Ionicons name="person-outline" size={24} color="black" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Continue with Email or Phone</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
          <Image
            source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
            style={[styles.buttonIcon, { width: 24, height: 24 }]}
            resizeMode="contain"
          />
          <Text style={styles.buttonText}>Continue with Google</Text>
        </TouchableOpacity>
        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.button} onPress={handleAppleLogin}>
            <Ionicons name="logo-apple" size={24} color="black" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Continue with Apple</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.legalContainer}>
          <TouchableOpacity onPress={toggleCheckbox} style={styles.checkboxContainer}>
            <Ionicons
              name={agreedToTerms ? "checkbox" : "square-outline"}
              size={20}
              color={agreedToTerms ? "#8A2BE2" : "#666"}
            />
          </TouchableOpacity>
          <Text style={styles.legalText}>
            By continuing with an account, you agree to our{' '}
            <Text style={styles.linkText} onPress={openTerms}>Terms of Service</Text> and acknowledge that you have read our{' '}
            <Text style={styles.linkText} onPress={openPrivacy}>Privacy Policy</Text>.
          </Text>
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>
            Don&apos;t have an account?
          </Text>
          <TouchableOpacity onPress={handleSignUpPress}>
            <Text style={styles.signupLink}> Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPhoneLogin = () => (
    <View style={styles.emailLoginContainer}>
      <AuthForm onAuthSuccess={closeSheet} showSignUpLink={false} hideSignInTitle={true} />
    </View>
  );

  return (
    <Modal transparent visible={showInternalPopup} onRequestClose={closeSheet} animationType="none">
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={closeSheet}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}
          enabled={Platform.OS === 'ios'}
        >
          <Animated.View
            style={[
              styles.sheet,
              { transform: [{ translateY: panY }] },
              isKeyboardVisible && { height: '100%', maxHeight: '100%', borderTopLeftRadius: 0, borderTopRightRadius: 0 }
            ]}
          >
            <View style={styles.sheetHeader} {...panResponderRef.panHandlers}>
              <View style={styles.dragHandle} />
              <TouchableOpacity onPress={closeSheet} style={styles.closeIcon}>
                <Ionicons name="close" size={28} color="black" />
              </TouchableOpacity>
            </View>


            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                isKeyboardVisible && { paddingBottom: 150 }
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.headerContent}>
                <Image source={{ uri: 'https://res.cloudinary.com/dn93gd6yw/image/upload/v1764913053/weversity/aekx2f9ciildnnnmg62p.jpg' }} style={styles.logo} />

                <Text style={styles.title}>
                  {showPhoneLogin ? 'Login to WeVersity' : 'Log in to WeVersity'}
                </Text>
              </View>

              {showPhoneLogin ? renderPhoneLogin() : renderSocialLogins()}
            </ScrollView>

          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingHorizontal: 20,
    maxHeight: SCREEN_HEIGHT * 0.95,
    height: SCREEN_HEIGHT * 0.9,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sheetHeader: {
    height: 40,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#dbdbdb',
    borderRadius: 3,
    marginTop: 10,
  },
  closeIcon: {
    position: 'absolute',
    right: 0,
    top: 5,
    padding: 5,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 30,
    color: '#000',
    marginTop: 10,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 0,
  },
  topContent: {
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  buttonText: {
    textAlign: 'center',
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  buttonIcon: {
    position: 'absolute',
    left: 15,
  },
  bottomSection: {
    marginTop: 'auto',
  },
  legalContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  checkboxContainer: {
    marginRight: 10,
    marginTop: 2,
  },
  legalText: {
    flex: 1,
    color: '#8e8e8e',
    fontSize: 12,
    lineHeight: 16,
  },
  bold: {
    fontWeight: '700',
    color: '#000'
  },
  linkText: {
    fontWeight: '700',
    color: '#8A2BE2',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  signupText: {
    fontSize: 15,
    color: '#000',
  },
  signupLink: {
    color: '#8A2BE2',
    fontWeight: 'bold',
    fontSize: 15,
  },
  emailLoginContainer: {
    justifyContent: 'center',
  },
});

export default LoginPopup;
