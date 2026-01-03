import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

interface Option {
    id: string | number;
    text: string;
    isCorrect?: boolean;
}

interface Question {
    id?: string | number;
    question: string;
    options: Option[];
    correct_answer: string | number;
}

export default function QuizScreen() {
    const router = useRouter();
    const { courseId, lessonTitle, questions: questionsRaw } = useLocalSearchParams();

    const questions: Question[] = React.useMemo(() => {
        try {
            return JSON.parse(questionsRaw as string);
        } catch (e) {
            console.error("Failed to parse questions:", e);
            return [];
        }
    }, [questionsRaw]);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];

    const handleOptionPress = (index: number) => {
        setSelectedOption(index);
    };

    const handleNext = () => {
        if (selectedOption === null) return;

        // Check if correct
        const option = currentQuestion.options[selectedOption];
        const isCorrect = option.isCorrect ||
            String(option.id) === String(currentQuestion.correct_answer) ||
            String(option.text) === String(currentQuestion.correct_answer);

        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
        } else {
            setShowResult(true);
        }
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            setSelectedOption(null);
        } else {
            router.back();
        }
    };

    if (questions.length === 0) {
        return (
            <View style={styles.center}>
                <Text>No questions found for this quiz.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (showResult) {
        const percentage = Math.round((score / questions.length) * 100);
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ title: 'Quiz Result', headerLeft: () => null, headerShown: false }} />
                <View style={styles.resultContainer}>
                    <View style={styles.resultCard}>
                        <Ionicons
                            name={percentage >= 50 ? "trophy" : "alert-circle"}
                            size={100}
                            color={percentage >= 50 ? "#FFD700" : "#FF6347"}
                        />
                        <Text style={styles.resultTitle}>Quiz Completed!</Text>
                        <Text style={styles.resultScore}>{score} / {questions.length}</Text>
                        <Text style={styles.resultText}>You scored {percentage}%</Text>

                        <TouchableOpacity style={styles.finishButton} onPress={() => router.back()}>
                            <Text style={styles.finishButtonText}>Finish & Go Back</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{
                headerShown: true,
                title: lessonTitle as string || 'Quiz',
                headerStyle: { backgroundColor: '#8A2BE2' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                headerLeft: () => (
                    <TouchableOpacity onPress={handleBack} style={{ marginLeft: 10 }}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                )
            }} />

            <View style={styles.progressContainer}>
                <View style={styles.progressBarWrapper}>
                    <View style={[styles.progressBar, { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>Question {currentQuestionIndex + 1} of {questions.length}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.questionCard}>
                    <Text style={styles.questionText}>{currentQuestion.question}</Text>
                </View>

                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = selectedOption === index;
                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                style={[
                                    styles.optionButton,
                                    isSelected && styles.selectedOptionButton
                                ]}
                                onPress={() => handleOptionPress(index)}
                            >
                                <View style={[styles.radioCircle, isSelected && styles.selectedRadioCircle]}>
                                    {isSelected && <View style={styles.radioInnerCircle} />}
                                </View>
                                <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                                    {option.text}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextButton, selectedOption === null && styles.disabledButton]}
                    onPress={handleNext}
                    disabled={selectedOption === null}
                >
                    <Text style={styles.nextButtonText}>
                        {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    scrollContent: { padding: 20 },
    progressContainer: { padding: 20, paddingTop: 10 },
    progressBarWrapper: { height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressBar: { height: '100%', backgroundColor: '#8A2BE2' },
    progressText: { fontSize: 14, color: '#666', fontWeight: '500' },
    questionCard: { backgroundColor: '#fff', padding: 25, borderRadius: 20, marginBottom: 30, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
    questionText: { fontSize: 20, fontWeight: 'bold', color: '#333', lineHeight: 28 },
    optionsContainer: { gap: 12 },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 15,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#eee',
    },
    selectedOptionButton: {
        backgroundColor: '#F4F0FF',
        borderColor: '#8A2BE2',
    },
    optionText: { fontSize: 16, color: '#444', flex: 1, marginLeft: 12 },
    selectedOptionText: { color: '#8A2BE2', fontWeight: '600' },
    radioCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedRadioCircle: { borderColor: '#8A2BE2' },
    radioInnerCircle: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#8A2BE2' },
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff' },
    nextButton: {
        backgroundColor: '#8A2BE2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 30,
        elevation: 3,
    },
    disabledButton: { backgroundColor: '#ccc' },
    nextButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    resultCard: {
        backgroundColor: '#fff',
        width: '100%',
        padding: 40,
        borderRadius: 25,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
    },
    resultTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 20 },
    resultScore: { fontSize: 48, fontWeight: 'bold', color: '#8A2BE2', marginVertical: 10 },
    resultText: { fontSize: 18, color: '#666', marginBottom: 30 },
    finishButton: { backgroundColor: '#8A2BE2', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, width: '100%', alignItems: 'center' },
    finishButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    retryButton: { backgroundColor: '#8A2BE2', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 20, marginTop: 20 },
    retryButtonText: { color: '#fff', fontWeight: 'bold' },
});
