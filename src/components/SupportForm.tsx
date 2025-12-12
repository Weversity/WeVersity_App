import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SupportFormProps {
    visible: boolean;
    onClose: () => void;
    onStartChat: (email: string, message: string) => void;
}

const SupportForm: React.FC<SupportFormProps> = ({ visible, onClose, onStartChat }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleStartChatPress = () => {
        if (email && message) {
            onStartChat(email, message);
        } else {
            alert('Please fill out the form to start the chat.');
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView 
                style={styles.wrapper}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                           <Ionicons name="close-circle" size={30} color="#ccc" />
                        </TouchableOpacity>
                        <Image 
                            source={{ uri: 'https://res.cloudinary.com/dn93gd6yw/image/upload/v1764752399/WeVersity_Logo-T_yluiwx.png' }}
                            style={styles.logo}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Your Email"
                            placeholderTextColor="#666"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TextInput
                            style={[styles.input, styles.messageInput]}
                            placeholder="Your Message"
                            placeholderTextColor="#666"
                            value={message}
                            onChangeText={setMessage}
                            multiline
                        />
                        <TouchableOpacity style={styles.startButton} onPress={handleStartChatPress}>
                            <Text style={styles.startButtonText}>Start Chat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        maxHeight: '95%',
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
    },
    logo: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 15,
    },
    messageInput: {
        height: 120,
        textAlignVertical: 'top',
    },
    startButton: {
        width: '100%',
        backgroundColor: '#8A2BE2',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SupportForm;