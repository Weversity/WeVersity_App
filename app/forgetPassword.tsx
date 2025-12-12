import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

const ForgetPasswordScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const router = useRouter();

    const handleResetPassword = () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address.');
            return;
        }
        // In a real application, you would send a request to your backend here
        // to initiate the password reset process.
        console.log('Reset password for email:', email);
        Alert.alert('Password Reset', 'If an account with that email exists, a password reset link has been sent.');
        router.back(); // Go back to the sign-in screen
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
                Enter your email address below and we&apos;ll send you a link to reset your password.
            </Text>
            <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#666"
            />
            <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                <Text style={styles.buttonText}>Reset Password</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.backToSignIn}>Back to Sign In</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    input: {
        width: '100%',
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 20,
    },
    button: {
        width: '100%',
        backgroundColor: '#8A2BE2',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backToSignIn: {
        fontSize: 14,
        color: '#8A2BE2',
        fontWeight: 'bold',
    },
});

export default ForgetPasswordScreen;
