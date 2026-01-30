import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
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
import AuthForm from './AuthForm';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LoginPopup: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const [showInternalPopup, setShowInternalPopup] = useState(false);
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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
        const { dy } = gestureState;
        return Math.abs(dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down (positive dy) or resist dragging up
        // Simple version: just setValue
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        } else {
          // Elastic resistance for dragging up could go here, for now stick to 0 or slight minimal movement
          panY.setValue(gestureState.dy * 0.1);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
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

  const renderSocialLogins = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.topContent}>
        <TouchableOpacity style={styles.button} onPress={handlePhoneLogin}>
          <Ionicons name="person-outline" size={24} color="black" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Continue with Email or Phone</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Image
            source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
            style={[styles.buttonIcon, { width: 24, height: 24 }]}
            resizeMode="contain"
          />
          {/* <Ionicons name="logo-google" size={24} color="#DB4437" style={styles.buttonIcon} /> */}
          <Text style={styles.buttonText}>Continue with Google</Text>
        </TouchableOpacity>
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

        {/* <View style={styles.divider} /> */}

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
      {/* AuthForm handles its own validation and rendering */}
      <AuthForm onAuthSuccess={closeSheet} showSignUpLink={false} hideSignInTitle={true} />
    </View>
  );

  return (
    <Modal transparent visible={showInternalPopup} onRequestClose={closeSheet} animationType="none">
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={closeSheet}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY: panY }] }]}
            {...panResponderRef.panHandlers}
          >
            <View style={styles.sheetHeader}>
              {/* Removed Help Question Mark as requested */}
              <View />
              <TouchableOpacity onPress={closeSheet}>
                <Ionicons name="close" size={28} color="black" />
              </TouchableOpacity>
            </View>


            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header - Logo and Title */}
              <View style={styles.headerContent}>
                <Image source={{ uri: 'https://res.cloudinary.com/dn93gd6yw/image/upload/v1764913053/weversity/aekx2f9ciildnnnmg62p.jpg' }} style={styles.logo} />

                {/* 
                    Logic for Title: 
                    If showPhoneLogin is true, it should say 'Login to WeVersity' instead of 'Log in' 
                    Wait, request says: "Heading Update: When the user clicks 'Use phone/email/username', the heading in the next view should say 'Login to WeVersity' instead of just 'Log in'."
                    
                    The previous code was:
                    {!showPhoneLogin && <Text ...>Log in to WeVersity</Text>}
                    {showPhoneLogin && <Text ...>Log in</Text>}

                    So I should make both say 'Login to WeVersity' or similar.
                    The request says "Login to WeVersity" for the internal view. 
                    The main view already says "Log in to WeVersity".
                 */}
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
    justifyContent: 'flex-end',
    width: '100%',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: SCREEN_HEIGHT * 0.95, // Increased slightly more to be very close to top
    height: SCREEN_HEIGHT * 0.9,    // Use a high percentage of screen
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10, // Reduced margin
    marginTop: 10,
  },
  scrollContent: {
    flexGrow: 1, // Important to allow bottom section to sit at bottom
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800', // Thicker font
    textAlign: 'center',
    marginBottom: 30, // Reduced margin
    color: '#000',
    marginTop: 10,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 140, // Increased size as requested
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
    borderRadius: 8, // Less rounded than before
    marginBottom: 12,
    justifyContent: 'flex-start', // Align left-center like designs usually do, or center if requested. Let's stick to center-ish or left. The image shows centered text relative to button, left icon.
    // justifyContent: 'center', // Keeps it centered
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  buttonText: {
    textAlign: 'center',
    flex: 1, // verification
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  buttonIcon: {
    position: 'absolute',
    left: 15,
  },
  bottomSection: {
    marginTop: 'auto', // Pushes to bottom
    // paddingBottom: 20,
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
    color: '#8e8e8e', // Light gray text
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
    paddingBottom: 10, // Extra safe space
    marginBottom: 10, // from bottom of screen
  },
  signupText: {
    fontSize: 15,
    color: '#000',
  },
  signupLink: {
    color: '#8A2BE2', // Changed to Purple as requested
    fontWeight: 'bold',
    fontSize: 15,
  },
  emailLoginContainer: {
    justifyContent: 'center',
  },
});

export default LoginPopup;
