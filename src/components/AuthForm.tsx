import { supabase } from '@/src/auth/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Role, useAuth } from '../context/AuthContext';
import PhoneInput from './PhoneNumberInput';

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
        const [isLoading, setIsLoading] = useState(false);

        // Validation State
        const [errors, setErrors] = useState<{ [key: string]: string }>({});

        // Forgot Password State
        const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
        const [resetEmail, setResetEmail] = useState('');
        const [isResetting, setIsResetting] = useState(false);

        // Sign-up specific state
        const [firstName, setFirstName] = useState('');
        const [lastName, setLastName] = useState('');
        const [userName, setUserName] = useState('');
        const [phoneNumber, setPhoneNumber] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
        const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

        const validateForm = () => {
            let newErrors: { [key: string]: string } = {};
            let isValid = true;

            if (isSignUp) {
                if (!firstName.trim()) newErrors.firstName = "First Name is required";
                if (!lastName.trim()) newErrors.lastName = "Last Name is required";
                if (!userName.trim()) newErrors.userName = "Username is required";

                if (!phoneNumber) {
                    newErrors.phoneNumber = "Phone Number is required";
                } else if (phoneNumber.length < 10) {
                    newErrors.phoneNumber = "Please enter a valid phone number";
                }

                if (!confirmPassword) {
                    newErrors.confirmPassword = "Confirm Password is required";
                } else if (password !== confirmPassword) {
                    newErrors.confirmPassword = "Passwords do not match";
                }
            }

            if (!email.trim()) {
                newErrors.email = "Email is required";
            } else if (!/\S+@\S+\.\S+/.test(email)) {
                newErrors.email = "Please enter a valid email address";
            }

            if (!password) {
                newErrors.password = "Password is required";
            } else if (isSignUp && password.length < 6) {
                newErrors.password = "Password must be at least 6 characters";
            }

            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        };

        const handleLogin = async () => {
            if (!validateForm()) return;

            setIsLoading(true);
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    if (error.message.includes("Email not confirmed")) {
                        Alert.alert("Verify Email", "Please check your inbox and verify your email before logging in.");
                    } else {
                        throw error;
                    }
                    return;
                }

                if (data.user) {
                    const userRole = data.user.user_metadata?.role || 'student';
                    const normalizedRole: Role = (userRole.charAt(0).toUpperCase() + userRole.slice(1)) as Role;
                    login(normalizedRole);

                    if (onAuthSuccess) {
                        onAuthSuccess();
                    } else {
                        router.replace('/(tabs)/profile');
                    }
                }
            } catch (error: any) {
                Alert.alert('Login Failed', error.message || "An error occurred during login");
            } finally {
                setIsLoading(false);
            }
        }

        const handleSignUp = async () => {
            if (!validateForm()) return;

            setIsLoading(true);
            try {
                const { data: existingPhone, error: phoneCheckError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('phone_number', phoneNumber)
                    .maybeSingle();

                if (phoneCheckError && phoneCheckError.code !== 'PGRST116') {
                    console.error("Phone check error:", phoneCheckError);
                }

                if (existingPhone) {
                    setErrors(prev => ({ ...prev, phoneNumber: "This phone number is already in use. Please use a different number." }));
                    setIsLoading(false);
                    return;
                }

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            role: role,
                            full_name: `${firstName} ${lastName}`.trim(),
                            first_name: firstName,
                            last_name: lastName,
                            ref_phone: phoneNumber,
                        },
                    },
                });

                if (error) throw error;

                if (data.user) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert([
                            {
                                id: data.user.id,
                                role: role,
                                first_name: firstName,
                                last_name: lastName,
                                full_name: `${firstName} ${lastName}`.trim(),
                                username: userName || email.split('@')[0],
                                approved: role === 'student' ? true : false,
                                email: email,
                                phone_number: phoneNumber,
                            }
                        ]);

                    if (profileError) {
                        console.error("Profile creation failed:", profileError);
                        throw new Error("Failed to create user profile. Please try again.");
                    }

                    if (role === 'student') {
                        Alert.alert("Success", "Verify your email to start learning!", [
                            { text: "OK", onPress: () => setIsSignUp(false) }
                        ]);
                    } else {
                        Alert.alert("Success", "Verify your email. Your dashboard will be active after admin approval.", [
                            { text: "OK", onPress: () => setIsSignUp(false) }
                        ]);
                    }

                    setPassword('');
                    setConfirmPassword('');
                }
            } catch (error: any) {
                console.error("Signup Error:", error);
                Alert.alert('Signup Failed', error.message || "An error occurred during sign up");
            } finally {
                setIsLoading(false);
            }
        };

        const handleResetPassword = async () => {
            if (!resetEmail) {
                Alert.alert("Error", "Please enter your email.");
                return;
            }
            setIsResetting(true);
            try {
                const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                    redirectTo: 'weversity://reset-password',
                });
                if (error) throw error;
                Alert.alert("Check your email!", "Reset link sent to your email.");
                setIsForgotModalVisible(false);
                setResetEmail('');
            } catch (error: any) {
                Alert.alert("Error", error.message || "Failed to send reset email.");
            } finally {
                setIsResetting(false);
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
                    <View style={{ width: '100%' }}>
                        <TextInput
                            style={[styles.input, errors.email ? styles.errorInput : null]}
                            placeholder="Email"
                            value={email}
                            onChangeText={(text) => { setEmail(text); if (errors.email) setErrors({ ...errors, email: '' }) }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor="#666"
                        />
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                    </View>
                ) : (
                    <View style={{ width: '100%' }}>
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
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.inputField}
                        placeholder="Password"
                        value={password}
                        onChangeText={(text) => { setPassword(text); if (errors.password) setErrors({ ...errors, password: '' }) }}
                        secureTextEntry={!isPasswordVisible}
                        placeholderTextColor="#666"
                    />
                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                        <Ionicons name={isPasswordVisible ? "eye-outline" : "eye-off-outline"} size={24} color="#666" />
                    </TouchableOpacity>
                </View>
                {errors.password && <Text style={[styles.errorText, { marginTop: -5, marginBottom: 10 }]}>{errors.password}</Text>}

                <View style={styles.optionsContainer}>
                    <TouchableOpacity style={styles.checkboxContainer} onPress={() => setIsSignedIn(!isSignedIn)}>
                        <Ionicons
                            name={isSignedIn ? 'checkbox-outline' : 'square-outline'}
                            size={24}
                            color="#8A2BE2"
                        />
                        <Text style={styles.checkboxText}>Keep me signed in</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsForgotModalVisible(true)}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Login</Text>
                    )}
                </TouchableOpacity>
                {showSignUpLink && <TouchableOpacity onPress={() => { setIsSignUp(true); setErrors({}); }}>
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
                    <View style={styles.halfInputContainer}>
                        <TextInput
                            style={[styles.input, styles.noMargin, errors.firstName ? styles.errorInput : null]}
                            placeholder="First Name"
                            value={firstName}
                            onChangeText={(text) => { setFirstName(text); if (errors.firstName) setErrors({ ...errors, firstName: '' }) }}
                            placeholderTextColor="#666"
                        />
                        {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                    </View>

                    <View style={styles.halfInputContainer}>
                        <TextInput
                            style={[styles.input, styles.noMargin, errors.lastName ? styles.errorInput : null]}
                            placeholder="Last Name"
                            value={lastName}
                            onChangeText={(text) => { setLastName(text); if (errors.lastName) setErrors({ ...errors, lastName: '' }) }}
                            placeholderTextColor="#666"
                        />
                        {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                    </View>
                </View>

                <View style={{ width: '100%' }}>
                    <TextInput
                        style={[styles.input, errors.userName ? styles.errorInput : null]}
                        placeholder="Username"
                        value={userName}
                        onChangeText={(text) => { setUserName(text); if (errors.userName) setErrors({ ...errors, userName: '' }) }}
                        autoCapitalize="none"
                        placeholderTextColor="#666"
                    />
                    {errors.userName && <Text style={styles.errorText}>{errors.userName}</Text>}
                </View>

                <View style={{ width: '100%' }}>
                    <TextInput
                        style={[styles.input, errors.email ? styles.errorInput : null]}
                        placeholder="Email"
                        value={email}
                        onChangeText={(text) => { setEmail(text); if (errors.email) setErrors({ ...errors, email: '' }) }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#666"
                    />
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                <View style={{ width: '100%' }}>
                    <View style={[
                        styles.phoneInputWrapper,
                        errors.phoneNumber ? styles.errorInput : null
                    ]}>
                        <PhoneInput
                            ref={phoneInput}
                            defaultValue={phoneNumber}
                            defaultCode="US"
                            layout="first"
                            onChangeFormattedText={(text) => { setPhoneNumber(text); if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' }) }}
                            containerStyle={styles.phoneInputContainer}
                            textContainerStyle={styles.phoneInputTextContainer}
                            flagButtonStyle={styles.phoneInputFlagButton}
                            countryPickerButtonStyle={styles.phoneInputCountryPickerButton}
                            withDarkTheme={false}
                            withShadow
                            autoFocus={false}
                        />
                    </View>
                    {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
                </View>

                <View style={{ width: '100%' }}>
                    <View style={[styles.inputContainer, errors.password ? styles.errorInput : null]}>
                        <TextInput
                            style={styles.inputField}
                            placeholder="Password"
                            value={password}
                            onChangeText={(text) => { setPassword(text); if (errors.password) setErrors({ ...errors, password: '' }) }}
                            secureTextEntry={!isPasswordVisible}
                            placeholderTextColor="#666"
                        />
                        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                            <Ionicons name={isPasswordVisible ? "eye-outline" : "eye-off-outline"} size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                <View style={{ width: '100%' }}>
                    <View style={[styles.inputContainer, errors.confirmPassword ? styles.errorInput : null]}>
                        <TextInput
                            style={styles.inputField}
                            placeholder="Re-enter Password"
                            value={confirmPassword}
                            onChangeText={(text) => { setConfirmPassword(text); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' }) }}
                            secureTextEntry={!isConfirmPasswordVisible}
                            placeholderTextColor="#666"
                        />
                        <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={styles.eyeIcon}>
                            <Ionicons name={isConfirmPasswordVisible ? "eye-outline" : "eye-off-outline"} size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSignUp}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Register</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setIsSignUp(false); setErrors({}); }}>
                    <Text style={styles.toggleText}>Already have an account? <Text style={{ fontWeight: 'bold' }}>Sign In</Text></Text>
                </TouchableOpacity>
            </View>
        );

        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.outerContainer}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1 }}>
                        {withHeader && (
                            <View style={styles.header}>
                                <Text style={styles.headerText}>Profile</Text>
                            </View>
                        )}
                        <ScrollView
                            contentContainerStyle={styles.container}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {isSignUp && showSignUpLink ? renderSignUpForm() : renderSignInForm()}
                        </ScrollView>

                        {/* Forgot Password Modal */}
                        <Modal
                            transparent={true}
                            visible={isForgotModalVisible}
                            animationType="fade"
                            onRequestClose={() => setIsForgotModalVisible(false)}
                        >
                            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                    <ScrollView contentContainerStyle={styles.modalScrollContainer} showsVerticalScrollIndicator={false}>
                                        <TouchableOpacity
                                            activeOpacity={1}
                                            onPress={() => { }} // Prevent closing when tapping content
                                            style={styles.modalContent}
                                        >
                                            <Text style={styles.modalTitle}>Reset Password</Text>
                                            <Text style={styles.modalDescription}>Enter your email to receive a password reset link.</Text>

                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter your email"
                                                value={resetEmail}
                                                onChangeText={setResetEmail}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                placeholderTextColor="#666"
                                            />

                                            <TouchableOpacity
                                                style={styles.modalButton}
                                                onPress={handleResetPassword}
                                                disabled={isResetting}
                                            >
                                                {isResetting ? (
                                                    <ActivityIndicator color="#fff" />
                                                ) : (
                                                    <Text style={styles.buttonText}>Send Link</Text>
                                                )}
                                            </TouchableOpacity>

                                            <TouchableOpacity onPress={() => setIsForgotModalVisible(false)}>
                                                <Text style={styles.modalCancelText}>Back to Sign In</Text>
                                            </TouchableOpacity>
                                        </TouchableOpacity>
                                    </ScrollView>
                                </TouchableWithoutFeedback>
                            </KeyboardAvoidingView>
                        </Modal>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
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
        paddingBottom: 50, // Added extra padding for scroll comfort
    },
    formContainer: {
        width: '100%',
        alignItems: 'center',
    },
    loginLogo: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
        marginBottom: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 10,
    },
    errorInput: {
        borderColor: 'red',
        borderWidth: 1,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginBottom: 8,
        marginLeft: 5,
        marginTop: -5,
        alignSelf: 'flex-start'
    },
    inputContainer: {
        width: '100%',
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
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
        marginBottom: 10,
        columnGap: 15,
        width: '100%',
    },
    halfInputContainer: {
        width: '48%',
    },
    halfInput: {
        width: '100%',
    },
    noMargin: {
        marginBottom: 5,
    },
    phoneInputWrapper: {
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 10,
    },
    phoneInputContainer: {
        width: '100%',
        height: 60,
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
        marginBottom: 15,
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
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalScrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#8A2BE2',
        marginBottom: 10,
    },
    modalDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButton: {
        width: '100%',
        backgroundColor: '#8A2BE2',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 15,
    },
    modalCancelText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default AuthForm;