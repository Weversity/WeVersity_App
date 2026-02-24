import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Message } from './types';

interface MessageBubbleProps {
    message: Message;
}

const AI_AVATAR = 'https://res.cloudinary.com/dn93gd6yw/image/upload/v1764752399/WeVersity_Logo-T_yluiwx.png';

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isUser = message.sender === 'user';

    return (
        <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
            {!isUser && (
                <View style={styles.avatarContainer}>
                    <Image source={{ uri: AI_AVATAR }} style={styles.avatar} />
                </View>
            )}
            <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
                    {message.text}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 4,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    userContainer: {
        justifyContent: 'flex-end',
    },
    aiContainer: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        marginRight: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    avatar: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
    },
    bubble: {
        maxWidth: '75%',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    userBubble: {
        backgroundColor: '#8A2BE2',
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: '#f0f0f0',
        borderBottomLeftRadius: 4,
    },
    text: {
        fontSize: 16,
        lineHeight: 22,
    },
    userText: {
        color: '#ffffff',
    },
    aiText: {
        color: '#333333',
    },
});

export default React.memo(MessageBubble);

