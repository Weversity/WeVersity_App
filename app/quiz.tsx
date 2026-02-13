import { supabase } from '@/src/auth/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Option {
    id: string | number;
    text: string;
    isCorrect?: boolean;
}

interface Question {
    id?: string | number;
    question: string;
    title?: string;
    options: Option[];
    correct_answer: string | number;
}

export default function QuizScreen() {
    const router = useRouter();
    const { courseId, lessonId, lessonTitle, questions: questionsRaw } = useLocalSearchParams();

    const questions: Question[] = React.useMemo(() => {
        try {
            if (!questionsRaw) return [];
            const parsed = JSON.parse(questionsRaw as string);
            console.log("Parsed Questions Data:", JSON.stringify(parsed, null, 2)); // Debug Log

            // Handle different data structures from Supabase/Backend
            if (Array.isArray(parsed)) return parsed;
            if (parsed.meta_data && Array.isArray(parsed.meta_data)) return parsed.meta_data;
            if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;

            return [];
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

    // Logic: Use question specific title if available, otherwise fallback to lessonTitle
    const displayHeading = currentQuestion ? (currentQuestion.title || (lessonTitle as string) || "Quiz") : "";

    const handleOptionPress = (index: number) => {
        setSelectedOption(index);
    };

    const updateProgress = async () => {
        if (!courseId || !lessonId) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch current progress
            const { data: enrollment, error: fetchErr } = await supabase
                .from('enrollments')
                .select('completed_lessons')
                .eq('student_id', user.id)
                .eq('course_id', courseId)
                .single();

            if (fetchErr) throw fetchErr;

            const completed = enrollment?.completed_lessons || [];
            if (!completed.includes(lessonId as string)) {
                const updatedCompleted = [...completed, lessonId as string];
                await supabase
                    .from('enrollments')
                    .update({ completed_lessons: updatedCompleted })
                    .eq('student_id', user.id)
                    .eq('course_id', courseId);
                console.log("Quiz progress updated successfully");
            }
        } catch (err) {
            console.error("Failed to update quiz progress:", err);
        }
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
            updateProgress(); // Mark completed when results are shown
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

    const handleRetake = () => {
        setScore(0);
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setShowResult(false);
    };

    if (!questions || questions.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={{ marginBottom: 20, fontSize: 16, color: '#666' }}>No questions found for this quiz.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.resultContinueBtn}>
                    <Text style={styles.resultContinueBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (showResult) {
        const percentage = Math.round((score / questions.length) * 100);
        const isPassed = percentage >= 80;
        const passingMarks = (questions.length * 0.8).toFixed(1);

        return (
            <SafeAreaView style={styles.container}>
                {/* Ensure header is SHOWN in result screen, as requested */}
                <Stack.Screen options={{ headerShown: true, title: 'Quiz Result' }} />
                <View style={styles.resultContainer}>
                    <View style={styles.resultCard}>
                        {/* Header */}
                        <Text style={styles.quizTag}>COURSE QUIZ</Text>
                        <Text style={styles.resultMainTitle}>{lessonTitle}</Text>
                        <View style={styles.divider} />

                        {/* Stats Grid */}
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>QUESTIONS</Text>
                                <Text style={styles.statValue}>{questions.length}</Text>
                            </View>
                            {/* Removed TIME stat as requested */}
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>TOTAL MARKS</Text>
                                <Text style={styles.statValue}>{questions.length}.0</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>PASSING</Text>
                                <Text style={styles.statValue}>{passingMarks}</Text>
                            </View>
                        </View>

                        {/* Feedback Box */}
                        <View style={[styles.feedbackBox, { backgroundColor: isPassed ? '#E8F5E9' : '#FFEBEE' }]}>
                            <Text style={[styles.feedbackTitle, { color: isPassed ? '#2E7D32' : '#C62828' }]}>
                                {isPassed ? "Congratulations! You Passed." : "You Failed. Try Again!"}
                            </Text>
                            <Text style={[styles.feedbackScore, { color: isPassed ? '#333' : '#333' }]}>
                                You scored {percentage}.0%
                            </Text>
                        </View>

                        {/* Buttons */}
                        <TouchableOpacity style={styles.resultContinueBtn} onPress={() => router.back()}>
                            <Text style={styles.resultContinueBtnText}>CONTINUE LEARNING</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.resultRetakeBtn} onPress={handleRetake}>
                            <Text style={styles.resultRetakeBtnText}>RETAKE QUIZ</Text>
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
                title: (lessonTitle as string) || (courseId as string) || 'Quiz',
                headerStyle: { backgroundColor: '#8A2BE2' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                headerTitleAlign: 'center',
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
                {/* Main Heading as requested */}
                <Text style={styles.lessonTitleText}>{lessonTitle}</Text>

                <View style={styles.questionCard}>
                    <View style={styles.questionRow}>
                        <Text style={styles.questionNumberText}>{currentQuestionIndex + 1}.</Text>
                        <Text style={styles.questionTitleText}>{displayHeading}</Text>
                    </View>

                    {/* Explicitly showing the Question Text below the heading */}
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
                <View style={styles.footerRow}>
                    {currentQuestionIndex > 0 ? (
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBack}
                        >
                            <Ionicons name="arrow-back" size={20} color="#8A2BE2" style={{ marginRight: 8 }} />
                            <Text style={styles.backButtonText}>Previous</Text>
                        </TouchableOpacity>
                    ) : <View style={{ width: '48%' }} />}

                    <TouchableOpacity
                        style={[styles.nextButton, selectedOption === null && styles.disabledButton]}
                        onPress={handleNext}
                        disabled={selectedOption === null}
                    >
                        <Text style={styles.nextButtonText}>
                            {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
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
    questionCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        marginBottom: 30,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    // Restored lessonTitleText style
    lessonTitleText: { fontSize: 18, color: '#666', marginBottom: 15, fontWeight: '600', textAlign: 'center' },
    questionRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 },
    questionNumberText: { fontSize: 24, fontWeight: 'bold', color: '#8A2BE2', marginRight: 10, lineHeight: 30 },
    questionTitleText: { fontSize: 22, fontWeight: 'bold', color: '#333', flex: 1, lineHeight: 30 },
    // Re-added/Ensured questionText style is good
    questionText: { fontSize: 18, color: '#444', lineHeight: 26, marginTop: 5 },
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
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backButton: {
        width: '48%',
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#8A2BE2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 30,
    },
    backButtonText: { color: '#8A2BE2', fontSize: 16, fontWeight: 'bold' },
    nextButton: {
        width: '48%',
        backgroundColor: '#8A2BE2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 30,
        elevation: 3,
    },
    disabledButton: { backgroundColor: '#ccc', elevation: 0 },
    nextButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // Result Screen Styles - Redesigned
    resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 20 },
    resultCard: {
        backgroundColor: '#fff',
        width: '100%',
        padding: 30,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        alignItems: 'center'
    },
    quizTag: { fontSize: 10, color: '#999', fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
    resultMainTitle: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 20, textAlign: 'center' },
    divider: { height: 1, width: '100%', backgroundColor: '#f0f0f0', marginBottom: 25 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', marginBottom: 25 },
    statItem: { width: '30%', alignItems: 'center', marginBottom: 20 }, // Adjusted width for 3 items
    statLabel: { fontSize: 11, color: '#999', fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },

    feedbackBox: {
        width: '100%',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    feedbackTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    feedbackScore: { fontSize: 14, fontWeight: '500', color: '#555' },

    resultContinueBtn: {
        width: '100%',
        backgroundColor: '#8A2BE2',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 15,
        elevation: 2
    },
    resultContinueBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
    resultRetakeBtn: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#fff'
    },
    resultRetakeBtnText: { color: '#666', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },
});
