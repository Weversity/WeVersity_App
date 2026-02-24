import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface ChatInputProps {
    onSend: (text: string) => void;
    placeholder?: string;
    onFocus?: () => void;
    onBlur?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
    onSend,
    placeholder = 'Type a message...',
    onFocus,
    onBlur
}) => {
    const [text, setText] = useState('');
    const [inputHeight, setInputHeight] = useState(40);

    const handleSend = () => {
        if (text.trim()) {
            onSend(text.trim());
            setText('');
            setInputHeight(40);
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.inputContainer, { height: Math.max(40, Math.min(120, inputHeight)) }]}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#999999"
                    multiline
                    value={text}
                    onChangeText={setText}
                    onContentSizeChange={(event) => {
                        setInputHeight(event.nativeEvent.contentSize.height);
                    }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    textAlignVertical="center"
                />
            </View>
            <TouchableOpacity
                style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!text.trim()}
            >
                <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    inputContainer: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 8 : 0,
        justifyContent: 'center',
        marginRight: 8,
    },
    input: {
        fontSize: 16,
        color: '#333333',
        maxHeight: 120,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#8A2BE2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
});

export default ChatInput;
