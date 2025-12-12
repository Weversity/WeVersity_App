import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Role, useAuth } from '../context/AuthContext';
import PhoneInput from './PhoneNumberInput';

// Changed onLogin to onAuthSuccess for clarity
const AuthForm: React.FC<{
    onAuthSuccess?: () => void,
    showSignUpLink?: boolean,
    initialView?: 'login' | 'signup',
    hideSignInTitle?: boolean,
    hideSignUpTitle?: boolean,
    customSignInTitle?: string,
    welcomeMessage?: string,
    withHeader?: boolean,
    role?: 'student' | 'instructor',
    onRoleChange?: (role: 'student' | 'instructor') => void,
}> = ({
    onAuthSuccess,
    showSignUpLink = true,
    initialView = 'login',
    hideSignInTitle = false,
    hideSignUpTitle = false,
    customSignInTitle = undefined,
    welcomeMessage,
    withHeader = false,
    role = 'student',
    onRoleChange,
}) => {
        const [isSignUp, setIsSignUp] = useState(initialView === 'signup');
        const [isSignedIn, setIsSignedIn] = useState(false);
        const phoneInput = useRef<PhoneInput>(null);

        const router = useRouter();
        const { login } = useAuth();

        // Common state
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [isPasswordVisible, setIsPasswordVisible] = useState(false);

        // Sign-up specific state
        const [firstName, setFirstName] = useState('');
        const [lastName, setLastName] = useState('');
        const [userName, setUserName] = useState('');
        const [phoneNumber, setPhoneNumber] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
        const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

        const handleLogin = () => {
            // Mock login for demonstration. A real app would verify credentials.
            const mockRole: Role = email.includes('instructor') ? 'Instructor' : 'Student';
            login(mockRole);

            if (onAuthSuccess) {
                onAuthSuccess();
            } else {
                router.replace('/(tabs)/profile');
            }
        }

        const handleSignUp = () => {
            if (password !== confirmPassword) {
                Alert.alert("Error", "Passwords do not match.");
                return;
            }
            const userRole: Role = role.charAt(0).toUpperCase() + role.slice(1) as Role;

            login(userRole);

            if (onAuthSuccess) {
                onAuthSuccess();
            } else {
                router.replace('/(tabs)/profile');
            }
        };

        const renderSignInForm = () => (

            <View style={styles.formContainer}>

                {!hideSignInTitle && (
                    <>
                        <Image source={{ uri: 'https://res.cloudinary.com/dn93gd6yw/image/upload/v1764761617/email_assets/pwseyxxtugjoigi0vyf2.png' }} style={styles.loginLogo} />
                        <Text style={styles.title}>Login to WeVersity</Text>
                    </>
                )}



                <View style={styles.tabContainer}>
                    <TouchableOpacity style={[styles.tabButton, loginMethod === 'email' && styles.tabButtonActive]} onPress={() => setLoginMethod('email')}>
                        <Text style={[styles.tabText, loginMethod === 'email' && styles.tabTextActive]}>Email</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tabButton, loginMethod === 'phone' && styles.tabButtonActive]} onPress={() => setLoginMethod('phone')}>
                        <Text style={[styles.tabText, loginMethod === 'phone' && styles.tabTextActive]}>Phone Number</Text>
                    </TouchableOpacity>
                </View>



                {loginMethod === 'email' ? (

                    <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#666" />

                ) : (

                    <PhoneInput

                        ref={phoneInput}

                        defaultValue={phoneNumber}

                        defaultCode="US"

                        layout="first"

                        onChangeFormattedText={(text) => setPhoneNumber(text)}

                        containerStyle={styles.phoneInputContainer}

                        textContainerStyle={styles.phoneInputTextContainer}

                        flagButtonStyle={styles.phoneInputFlagButton}

                        countryPickerButtonStyle={styles.phoneInputCountryPickerButton}

                        withDarkTheme={false}

                        withShadow

                        autoFocus={false}

                    />

                )}



                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.inputField}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!isPasswordVisible}
                        placeholderTextColor="#666"
                    />
                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                        <Ionicons name={isPasswordVisible ? "eye-outline" : "eye-off-outline"} size={24} color="#666" />
                    </TouchableOpacity>
                </View>



                <View style={styles.optionsContainer}>
                    <TouchableOpacity style={styles.checkboxContainer} onPress={() => setIsSignedIn(!isSignedIn)}>
                        <Ionicons
                            name={isSignedIn ? 'checkbox-outline' : 'square-outline'}
                            size={24}
                            color="#8A2BE2"
                        />
                        <Text style={styles.checkboxText}>Keep me signed in</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/forgetPassword')}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
                {showSignUpLink && <TouchableOpacity onPress={() => setIsSignUp(true)}>
                    <Text style={styles.toggleText}>Don&apos;t have an account? <Text style={{ fontWeight: 'bold' }}>Sign Up</Text></Text>
                </TouchableOpacity>}
            </View>

        );

        const renderSignUpForm = () => (
            <View style={styles.formContainer}>
                {!hideSignUpTitle && (
                    <>
                        <Image source={{ uri: 'https://res.cloudinary.com/dn93gd6yw/image/upload/v1764761617/email_assets/pwseyxxtugjoigi0vyf2.png' }} style={styles.loginLogo} />
                        <Text style={[styles.title, { marginBottom: 5 }]}>Create Account</Text>
                    </>
                )}
                <View style={styles.tabContainer}>
                    <TouchableOpacity style={[styles.tabButton, role === 'student' && styles.tabButtonActive]} onPress={() => onRoleChange?.('student')} activeOpacity={0.8}>
                        <Text style={[styles.tabText, role === 'student' && styles.tabTextActive]}>Student</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tabButton, role === 'instructor' && styles.tabButtonActive]} onPress={() => onRoleChange?.('instructor')} activeOpacity={0.8}>
                        <Text style={[styles.tabText, role === 'instructor' && styles.tabTextActive]}>Instructor</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.row}>
                    <TextInput style={[styles.input, styles.halfInput]} placeholder="First Name" value={firstName} onChangeText={setFirstName} placeholderTextColor="#666" />
                    <TextInput style={[styles.input, styles.halfInput]} placeholder="Last Name" value={lastName} onChangeText={setLastName} placeholderTextColor="#666" />
                </View>
                <TextInput style={styles.input} placeholder="Username" value={userName} onChangeText={setUserName} autoCapitalize="none" placeholderTextColor="#666" />
                <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#666" />
                <PhoneInput
                    ref={phoneInput}
                    defaultValue={phoneNumber}
                    defaultCode="US"
                    layout="first"
                    onChangeFormattedText={(text) => setPhoneNumber(text)}
                    containerStyle={styles.phoneInputContainer}
                    textContainerStyle={styles.phoneInputTextContainer}
                    flagButtonStyle={styles.phoneInputFlagButton}
                    countryPickerButtonStyle={styles.phoneInputCountryPickerButton}
                    withDarkTheme={false}
                    withShadow
                    autoFocus={false}
                />
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.inputField}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!isPasswordVisible}
                        placeholderTextColor="#666"
                    />
                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                        <Ionicons name={isPasswordVisible ? "eye-outline" : "eye-off-outline"} size={24} color="#666" />
                    </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.inputField}
                        placeholder="Re-enter Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!isConfirmPasswordVisible}
                        placeholderTextColor="#666"
                    />
                    <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={styles.eyeIcon}>
                        <Ionicons name={isConfirmPasswordVisible ? "eye-outline" : "eye-off-outline"} size={24} color="#666" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                    <Text style={styles.buttonText}>Register</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsSignUp(false)}>
                    <Text style={styles.toggleText}>Already have an account? <Text style={{ fontWeight: 'bold' }}>Sign In</Text></Text>
                </TouchableOpacity>
            </View>
        );


        return (
            <View style={styles.outerContainer}>
                {withHeader && (
                    <View style={styles.header}>
                        <Text style={styles.headerText}>Profile</Text>
                    </View>
                )}
                <ScrollView contentContainerStyle={styles.container}>
                    {isSignUp && showSignUpLink ? renderSignUpForm() : renderSignInForm()}
                </ScrollView>
            </View>
        );
    };

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#8A2BE2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    formContainer: {
        width: '100%',
        alignItems: 'center',
    },
    loginLogo: {
        width: 100, // Restored original size
        height: 100, // Restored original size
        resizeMode: 'contain',
        marginBottom: 5, // Restored original margin
    },
    title: {
        fontSize: 28, // Restored original size
        fontWeight: 'bold',
        marginBottom: 5, // Restored original margin
        textAlign: 'center', // Restored original alignment
    },
    input: {
        width: '100%',
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 10, // Reduced from 15
    },
    inputContainer: {
        width: '100%',
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10, // Reduced from 15
        paddingHorizontal: 15,
    },
    inputField: {
        flex: 1,
        height: 50,
        fontSize: 16,
    },
    eyeIcon: {
        padding: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        columnGap: 15,
    },
    halfInput: {
        width: '49.25%',
    },
    phoneInputContainer: {
        width: '100%',
        height: 60,
        marginBottom: 10, // Reduced from 15
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    }, phoneInputTextContainer: {
        backgroundColor: 'transparent',
        paddingVertical: 0,
        height: '100%',
        borderRadius: 10,
        color: '#333',
    },
    phoneInputFlagButton: {
        marginLeft: 8,
        marginRight: 8,
        justifyContent: 'center',
    },
    phoneInputCountryPickerButton: {
        backgroundColor: 'transparent',
        height: '100%',
        justifyContent: 'center',
        paddingLeft: 0,
        paddingRight: 0,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 15, // Reduced from 25
        height: 55,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 5,
        backgroundColor: '#fff',
    },
    tabButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    tabButtonActive: {
        backgroundColor: '#8A2BE2',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 2,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    tabTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    button: {
        width: '100%',
        backgroundColor: '#8A2BE2',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    toggleText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#666',
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        width: '100%',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#8A2BE2',
        fontWeight: 'bold',
    },
});

export default AuthForm;