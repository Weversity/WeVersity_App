import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthForm from './AuthForm'; // Assuming AuthForm handles email/password

const { height } = Dimensions.get('window');

const LoginPopup: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const [showInternalPopup, setShowInternalPopup] = useState(false); // Internal state for animation
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (visible) {
      setShowInternalPopup(true);
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowInternalPopup(false);
        setShowPhoneLogin(false);
      });
    }
  }, [visible, slideAnimation]);

  useEffect(() => {
    if (showPhoneLogin) {
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnimation.setValue(0); // Reset fade animation when not showing phone login
    }
  }, [showPhoneLogin, fadeAnimation])

  const slideUp = {
    transform: [
      {
        translateY: slideAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [height, height * 0.01], // Adjusted to come up higher
        }),
      },
    ],
  };

  const fadeIn = {
    opacity: fadeAnimation,
  };

  const handlePhoneLogin = () => {
    setShowPhoneLogin(true);
  };

  const handleClose = () => {
    // Only animate closing if it's currently showing
    if (showInternalPopup) {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowInternalPopup(false);
        setShowPhoneLogin(false); // Reset phone login state
        onClose(); // Call the prop onClose to inform parent if needed
      });
    }
  };



  const handleSignUpPress = () => {
    handleClose();
    router.push('/signup');
  };

  const renderSocialLogins = () => (
    <View style={{ flex: 1 }}>
      <View>
        <TouchableOpacity style={styles.button} onPress={handlePhoneLogin}>
          <Ionicons name="mail-outline" size={24} color="black" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Continue with Email or Phone</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Ionicons name="logo-facebook" size={24} color="#1877F2" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Continue with Facebook</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Ionicons name="logo-google" size={24} color="#DB4437" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>
      <View style={{ marginTop: 'auto' }}>
        <Text style={styles.legalText}>
          By continuing with an account, you agree to our{' '}
          <Text style={styles.bold}>Terms of Service</Text> and acknowledge that you have read our{' '}
          <Text style={styles.bold}>Privacy Policy</Text>.
        </Text>
        <View style={styles.divider} />
        <TouchableOpacity onPress={handleSignUpPress}>
          <Text style={styles.signupText}>
            Don&apos;t have an account? <Text style={styles.signupLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPhoneLogin = () => (
    <Animated.View style={[styles.emailLoginContainer, fadeIn]}>
      <AuthForm onAuthSuccess={handleClose} showSignUpLink={false} hideSignInTitle={true} />
    </Animated.View>
  );

  return (
    <Modal transparent visible={showInternalPopup} onRequestClose={handleClose}>
      <View style={styles.container}>
        <Animated.View style={[styles.popup, slideUp]}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close-circle-outline" size={30} color="gray" />
          </TouchableOpacity>

          {/* Conditionally rendered header */}
          <View style={showPhoneLogin ? styles.headerContentPhoneLogin : styles.headerContent}>
            <Image source={{ uri: 'https://res.cloudinary.com/dn93gd6yw/image/upload/v1764913053/weversity/aekx2f9ciildnnnmg62p.jpg' }} style={styles.logo} />
            <Text style={styles.title}>Login to WeVersity</Text>
          </View>

          {showPhoneLogin ? renderPhoneLogin() : renderSocialLogins()}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  popup: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 10, // Reduced top padding as requested
    height: height * 0.9,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20, // Heading-Buttons gap 20
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 0,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 10, // Logo-Heading gap 10
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: 'center',
  },
  buttonText: {
    marginLeft: 10,
    fontSize: 16,
  },
  buttonIcon: {
    position: 'absolute',
    left: 15,
  },
  legalText: {
    textAlign: 'center',
    color: 'gray',
    fontSize: 12,
  },
  bold: {
    fontWeight: 'bold',
    color: 'black'
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  signupText: {
    textAlign: 'center',
    fontSize: 16,
  },
  signupLink: {
    color: '#8A2BE2',
    fontWeight: 'bold',
  },
  emailLoginContainer: {
    flex: 1,
    justifyContent: 'center', // This combined with AuthForm's center content should ensure centering
  },
  headerContentPhoneLogin: {
    alignItems: 'center',
    marginBottom: 10, // Minimized margin to keep it at top, form will center below
  }
});

export default LoginPopup;
