import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SuggestedQuestionsProps {
    questions: string[];
    onPress: (question: string) => void;
}

const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ questions, onPress }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Suggested Questions</Text>
            <FlatList
                data={questions}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.questionButton} onPress={() => onPress(item)}>
                        <Text style={styles.questionText}>{item}</Text>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        paddingHorizontal: 16,
    },
    listContent: {
        paddingHorizontal: 12,
    },
    questionButton: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    questionText: {
        fontSize: 14,
        color: '#333',
    },
});

export default SuggestedQuestions;
