import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Lesson {
    id: string;
    title: string;
}

interface Question {
    id: string;
    type: 'true_false' | 'multiple_choice' | 'open_ended' | 'fill_blanks' | 'short_answer' | 'matching' | 'image' | 'ordering';
    title: string;
    options?: { id: string; text: string; isCorrect: boolean }[];
    correctAnswer?: string;
}

interface Quiz {
    id: string;
    title: string;
    summary?: string;
    questions: Question[];
}

interface Assignment {
    id: string;
    title: string;
}

interface Module {
    id: string;
    title: string;
    summary?: string;
    lessons: Lesson[];
    quizzes: Quiz[];
    assignments: Assignment[];
}

// Predefined Categories
const PREDEFINED_CATEGORIES = [
    'Artificial Intelligence',
    'Arts & Crafts',
    'Beauty Skincare',
    'Content Writing',
    'Cooking',
    'Cosmetics & Fragrance',
    'Customer Experience (CX)',
    'Data Science',
    'Design',
    'Development',
    'Finance & Accounting',
    'Health & Fitness',
    'IT & Software',
    'Lifestyle',
    'Marketing',
    'Music',
    'Personal Development',
    'Photography & Video',
    'Teaching & Academics',
];

export default function CreateCourseScreen() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    // Step 1: Course Details
    const [courseImage, setCourseImage] = useState<string | null>(null);
    const [courseTitle, setCourseTitle] = useState('');
    const [courseDescription, setCourseDescription] = useState('');

    // Rich text formatting state
    const [textFormat, setTextFormat] = useState('Normal');
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);

    // Categories, Tags, and Pricing State
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [pricingModel, setPricingModel] = useState<'free' | 'paid'>('free');
    const [coursePrice, setCoursePrice] = useState('');

    // Options Tabs State
    const [activeOptionsTab, setActiveOptionsTab] = useState<'general' | 'content_drip' | 'enrollment'>('general');
    const [difficultyLevel, setDifficultyLevel] = useState('Beginner');
    const [contentDripType, setContentDripType] = useState('none');
    const [maxStudents, setMaxStudents] = useState('0');

    // Step 2: Curriculum
    const [modules, setModules] = useState<Module[]>([
        {
            id: '1',
            title: 'Introduction',
            summary: '',
            lessons: [{ id: 'l1', title: 'Welcome to the Course' }],
            quizzes: [{ id: 'q1', title: 'Knowledge Check: Basics', questions: [] }],
            assignments: [{ id: 'a1', title: 'Setup Your Workspace' }],
        },
    ]);

    // Module Edit Modal State
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [moduleModalTitle, setModuleModalTitle] = useState('');
    const [moduleModalSummary, setModuleModalSummary] = useState('');
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

    // Quiz Editor State
    const [quizView, setQuizView] = useState<'initial' | 'details' | 'editor'>('initial');
    const [isQuizDetailsStepComplete, setIsQuizDetailsStepComplete] = useState(false);
    const [currentQuizQuestions, setCurrentQuizQuestions] = useState<Question[]>([]);
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
    const [showQuestionTypeDropdown, setShowQuestionTypeDropdown] = useState(false);
    const [quizActiveTab, setQuizActiveTab] = useState<'details' | 'settings'>('details');

    // Quiz Settings State
    const [quizTimeLimit, setQuizTimeLimit] = useState('0');
    const [quizTimeLimitUnit, setQuizTimeLimitUnit] = useState('Minutes');
    const [quizFeedbackMode, setQuizFeedbackMode] = useState('None');
    const [quizPassingGrade, setQuizPassingGrade] = useState('80');
    const [quizMaxQuestionAllowed, setQuizMaxQuestionAllowed] = useState('5');
    const [quizQuestionLayout, setQuizQuestionLayout] = useState('Single-question');
    const [quizQuestionOrder, setQuizQuestionOrder] = useState('Random');
    const [quizHideQuestionNumber, setQuizHideQuestionNumber] = useState(false);
    const [quizCharLimitShortAnswer, setQuizCharLimitShortAnswer] = useState('200');
    const [quizCharLimitEssay, setQuizCharLimitEssay] = useState('500');
    const [quizAutoStart, setQuizAutoStart] = useState(false);

    // Step 3: Overview
    const [whatWillILearn, setWhatWillILearn] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [totalCourseDuration, setTotalCourseDuration] = useState('');
    const [materialsIncluded, setMaterialsIncluded] = useState('');
    const [requirementsInstructions, setRequirementsInstructions] = useState('');


    // Modal states
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

    // Lesson modal state
    const [lessonTitle, setLessonTitle] = useState('');
    const [lessonContent, setLessonContent] = useState('');

    // Quiz modal state
    const [quizTitle, setQuizTitle] = useState('');
    const [quizSummary, setQuizSummary] = useState('');

    // Assignment modal state
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [assignmentContent, setAssignmentContent] = useState('');
    const [assignmentTimeLimit, setAssignmentTimeLimit] = useState('0');
    const [assignmentTimeLimitUnit, setAssignmentTimeLimitUnit] = useState('Weeks');
    const [assignmentTotalPoints, setAssignmentTotalPoints] = useState('10');
    const [assignmentMinPassPoints, setAssignmentMinPassPoints] = useState('5');
    const [assignmentFileUploadLimit, setAssignmentFileUploadLimit] = useState('1');
    const [assignmentMaxFileSize, setAssignmentMaxFileSize] = useState('2');
    const [assignmentResubmission, setAssignmentResubmission] = useState(true);
    const [assignmentMaxAttempts, setAssignmentMaxAttempts] = useState('5');

    // Edit state
    const [editingItem, setEditingItem] = useState<{ id: string; type: 'lesson' | 'quiz' | 'assignment'; moduleId: string } | null>(null);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 1,
        });

        if (!result.canceled) {
            setCourseImage(result.assets[0].uri);
        }
    };

    // Category Management
    const toggleCategory = (category: string) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(selectedCategories.filter(c => c !== category));
        } else {
            setSelectedCategories([...selectedCategories, category]);
        }
    };

    const addCustomCategory = () => {
        if (newCategoryName.trim()) {
            setCustomCategories([...customCategories, newCategoryName.trim()]);
            setSelectedCategories([...selectedCategories, newCategoryName.trim()]);
            setNewCategoryName('');
            setShowAddCategoryModal(false);
        }
    };

    // Tag Management
    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleContinue = () => {
        if (currentStep === 1) {
            if (!courseTitle.trim()) {
                Alert.alert('Required', 'Please enter a course title');
                return;
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(3);
        }
    };

    const handleBack = () => {
        if (currentStep === 3) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(1);
        } else {
            router.back();
        }
    };

    const handleSaveDraft = () => {
        Alert.alert('Draft Saved', 'Your course has been saved as a draft');
    };

    const handlePublishCourse = () => {
        Alert.alert(
            'Publish Course',
            'Are you sure you want to publish this course?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Publish',
                    onPress: () => {
                        Alert.alert('Success', 'Course published successfully!');
                        router.back();
                    },
                },
            ]
        );
    };

    const addNewModule = () => {
        const newModule: Module = {
            id: Date.now().toString(),
            title: `Module ${modules.length + 1}`,
            summary: '',
            lessons: [],
            quizzes: [],
            assignments: [],
        };
        setModules([...modules, newModule]);
    };

    const deleteModule = (id: string) => {
        if (modules.length === 1) {
            Alert.alert('Error', 'You must have at least one module');
            return;
        }
        setModules(modules.filter((m) => m.id !== id));
    };

    const openEditModuleModal = (module: Module) => {
        setEditingModuleId(module.id);
        setModuleModalTitle(module.title);
        setModuleModalSummary(module.summary || '');
        setShowModuleModal(true);
    };

    const saveModuleDetails = () => {
        if (!moduleModalTitle.trim()) {
            Alert.alert('Required', 'Please enter a module title');
            return;
        }

        const updatedModules = modules.map(module => {
            if (module.id === editingModuleId) {
                return {
                    ...module,
                    title: moduleModalTitle,
                    summary: moduleModalSummary,
                };
            }
            return module;
        });

        setModules(updatedModules);
        setShowModuleModal(false);
        setEditingModuleId(null);
        setModuleModalTitle('');
        setModuleModalSummary('');
    };

    const openLessonModal = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        setEditingItem(null);
        setLessonTitle('');
        setLessonContent('');
        setShowLessonModal(true);
    };

    const openQuizModal = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        setEditingItem(null);
        setQuizTitle('');
        setQuizSummary('');
        setShowQuizModal(true);
    };

    const openAssignmentModal = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        setEditingItem(null);
        setAssignmentTitle('');
        setAssignmentContent('');
        setShowAssignmentModal(true);
    };

    const handleEditItem = (item: any, type: 'lesson' | 'quiz' | 'assignment', moduleId: string) => {
        setSelectedModuleId(moduleId);
        setEditingItem({ id: item.id, type, moduleId });

        if (type === 'lesson') {
            setLessonTitle(item.title);
            // setLessonContent(item.content); // Assuming content exists or will exist
            setShowLessonModal(true);
        } else if (type === 'quiz') {
            setQuizTitle(item.title);
            setQuizSummary(item.summary || '');
            setCurrentQuizQuestions(item.questions || []); // Load questions
            // setQuizView('details'); // Default to details view
            setShowQuizModal(true);
        } else if (type === 'assignment') {
            setAssignmentTitle(item.title);
            // Populate other fields if they exist in the item object
            setShowAssignmentModal(true);
        }
    };

    const handleDeleteItem = (itemId: string, type: 'lesson' | 'quiz' | 'assignment', moduleId: string) => {
        Alert.alert(
            'Delete Item',
            `Are you sure you want to delete this ${type}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        const updatedModules = modules.map(module => {
                            if (module.id === moduleId) {
                                const updatedModule = { ...module };
                                if (type === 'lesson') {
                                    updatedModule.lessons = module.lessons.filter(l => l.id !== itemId);
                                } else if (type === 'quiz') {
                                    updatedModule.quizzes = module.quizzes.filter(q => q.id !== itemId);
                                } else if (type === 'assignment') {
                                    updatedModule.assignments = module.assignments.filter(a => a.id !== itemId);
                                }
                                return updatedModule;
                            }
                            return module;
                        });
                        setModules(updatedModules);
                    }
                }
            ]
        );
    };

    const saveLesson = () => {
        if (!lessonTitle.trim()) {
            Alert.alert('Required', 'Please enter a lesson title');
            return;
        }

        const updatedModules = modules.map(module => {
            if (module.id === selectedModuleId) {
                if (editingItem && editingItem.type === 'lesson' && editingItem.moduleId === selectedModuleId) {
                    // Update existing
                    return {
                        ...module,
                        lessons: module.lessons.map(l => l.id === editingItem.id ? { ...l, title: lessonTitle } : l)
                    };
                } else {
                    // Create new
                    return {
                        ...module,
                        lessons: [...module.lessons, { id: Date.now().toString(), title: lessonTitle }]
                    };
                }
            }
            return module;
        });

        setModules(updatedModules);
        setLessonTitle('');
        setLessonContent('');
        setShowLessonModal(false);
        setEditingItem(null);
    };

    const saveQuiz = () => {
        if (!quizTitle.trim()) {
            Alert.alert('Required', 'Please enter a quiz title');
            return;
        }

        const updatedModules = modules.map(module => {
            if (module.id === selectedModuleId) {
                if (editingItem && editingItem.type === 'quiz' && editingItem.moduleId === selectedModuleId) {
                    // Update existing
                    return {
                        ...module,
                        quizzes: module.quizzes.map(q => q.id === editingItem.id ? {
                            ...q,
                            title: quizTitle,
                            summary: quizSummary,
                            questions: currentQuizQuestions
                        } : q)
                    };
                } else {
                    // Create new
                    return {
                        ...module,
                        quizzes: [...module.quizzes, {
                            id: Date.now().toString(),
                            title: quizTitle,
                            summary: quizSummary,
                            questions: currentQuizQuestions
                        }]
                    };
                }
            }
            return module;
        });

        setModules(updatedModules);
        setQuizTitle('');
        setQuizSummary('');
        setCurrentQuizQuestions([]);
        setShowQuizModal(false);
        setEditingItem(null);
        setQuizView('details');
    };

    const handleAddQuestion = (type: Question['type']) => {
        const newQuestion: Question = {
            id: Date.now().toString(),
            type,
            title: '',
            options: type === 'multiple_choice' ? [
                { id: '1', text: 'Option 1', isCorrect: false },
                { id: '2', text: 'Option 2', isCorrect: false }
            ] : type === 'true_false' ? [
                { id: '1', text: 'True', isCorrect: false },
                { id: '2', text: 'False', isCorrect: false }
            ] : [],
        };
        const updatedQuestions = [...currentQuizQuestions, newQuestion];
        setCurrentQuizQuestions(updatedQuestions);
        setActiveQuestionId(newQuestion.id);
        setShowQuestionTypeDropdown(false);
    };

    const addOption = (questionId: string) => {
        setCurrentQuizQuestions(currentQuizQuestions.map(q => {
            if (q.id === questionId) {
                const newOption = {
                    id: Date.now().toString(),
                    text: `Option ${(q.options?.length || 0) + 1}`,
                    isCorrect: false
                };
                return { ...q, options: [...(q.options || []), newOption] };
            }
            return q;
        }));
    };

    const deleteOption = (questionId: string, optionId: string) => {
        setCurrentQuizQuestions(currentQuizQuestions.map(q => {
            if (q.id === questionId) {
                return { ...q, options: q.options?.filter(o => o.id !== optionId) };
            }
            return q;
        }));
    };

    const toggleCorrectOption = (questionId: string, optionId: string) => {
        setCurrentQuizQuestions(currentQuizQuestions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: q.options?.map(o => ({
                        ...o,
                        isCorrect: o.id === optionId
                    }))
                };
            }
            return q;
        }));
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setCurrentQuizQuestions(currentQuizQuestions.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const deleteQuestion = (id: string) => {
        setCurrentQuizQuestions(currentQuizQuestions.filter(q => q.id !== id));
        if (activeQuestionId === id) {
            setActiveQuestionId(null);
        }
    };

    const saveAssignment = () => {
        if (!assignmentTitle.trim()) {
            Alert.alert('Required', 'Please enter an assignment title');
            return;
        }

        const updatedModules = modules.map(module => {
            if (module.id === selectedModuleId) {
                if (editingItem && editingItem.type === 'assignment' && editingItem.moduleId === selectedModuleId) {
                    // Update existing
                    return {
                        ...module,
                        assignments: module.assignments.map(a => a.id === editingItem.id ? { ...a, title: assignmentTitle } : a)
                    };
                } else {
                    // Create new
                    return {
                        ...module,
                        assignments: [...module.assignments, { id: Date.now().toString(), title: assignmentTitle }]
                    };
                }
            }
            return module;
        });

        setModules(updatedModules);
        setAssignmentTitle('');
        setAssignmentContent('');
        setShowAssignmentModal(false);
        setEditingItem(null);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Create New</Text>
                    <Text style={styles.headerTitle}>Course</Text>
                </View>
                {/* Placeholder to balance the header title when there are no right-side buttons */}
                <View style={{ width: 24 }} />
            </View>

            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
                <Text style={styles.stepText}>Step {currentStep} of 3</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {currentStep === 1 ? (
                    // Step 1: Course Details
                    <View style={styles.stepContainer}>
                        <Text style={styles.sectionTitle}>Course Details</Text>

                        {/* Image Upload */}
                        <TouchableOpacity style={styles.imageUploadContainer} onPress={pickImage}>
                            {courseImage ? (
                                <Image source={{ uri: courseImage }} style={styles.uploadedImage} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="image-outline" size={48} color="#8A2BE2" />
                                    <Text style={styles.uploadText}>Tap to upload Image</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Course Title */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Course Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter course title"
                                placeholderTextColor="#999"
                                value={courseTitle}
                                onChangeText={setCourseTitle}
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Description</Text>

                            {/* Rich Text Toolbar */}
                            <View style={styles.richTextToolbar}>
                                {/* Text Format Dropdown */}
                                <View style={styles.toolbarDropdown}>
                                    <Text style={styles.dropdownText}>Normal</Text>
                                    <Ionicons name="chevron-down" size={14} color="#666" />
                                </View>

                                {/* Formatting Buttons */}
                                <TouchableOpacity
                                    style={[styles.toolbarButton, isBold && styles.toolbarButtonActive]}
                                    onPress={() => setIsBold(!isBold)}
                                >
                                    <Text style={[styles.toolbarButtonText, isBold && styles.toolbarButtonTextActive]}>B</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.toolbarButton, isItalic && styles.toolbarButtonActive]}
                                    onPress={() => setIsItalic(!isItalic)}
                                >
                                    <Text style={[styles.toolbarButtonTextItalic, isItalic && styles.toolbarButtonTextActive]}>I</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.toolbarButton, isUnderline && styles.toolbarButtonActive]}
                                    onPress={() => setIsUnderline(!isUnderline)}
                                >
                                    <Text style={[styles.toolbarButtonTextUnderline, isUnderline && styles.toolbarButtonTextActive]}>U</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.toolbarButton, isStrikethrough && styles.toolbarButtonActive]}
                                    onPress={() => setIsStrikethrough(!isStrikethrough)}
                                >
                                    <Text style={[styles.toolbarButtonTextStrike, isStrikethrough && styles.toolbarButtonTextActive]}>S</Text>
                                </TouchableOpacity>

                                <View style={styles.toolbarDivider} />

                                {/* Additional formatting icons */}
                                <TouchableOpacity style={styles.toolbarButton}>
                                    <Ionicons name="chatbox-outline" size={16} color="#666" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.toolbarButton}>
                                    <Ionicons name="color-palette-outline" size={16} color="#666" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.toolbarButton}>
                                    <Ionicons name="text-outline" size={16} color="#666" />
                                </TouchableOpacity>

                                <View style={styles.toolbarDivider} />

                                <TouchableOpacity style={styles.toolbarButton}>
                                    <Ionicons name="list-outline" size={16} color="#666" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.toolbarButton}>
                                    <Ionicons name="list" size={16} color="#666" />
                                </TouchableOpacity>

                                <View style={styles.toolbarDivider} />

                                <TouchableOpacity style={styles.toolbarButton}>
                                    <Ionicons name="link-outline" size={16} color="#666" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.toolbarButton}>
                                    <Ionicons name="image-outline" size={16} color="#666" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.toolbarButton}>
                                    <Ionicons name="code-slash-outline" size={16} color="#666" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.toolbarButton}>
                                    <Ionicons name="ellipsis-horizontal" size={16} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={[
                                    styles.input,
                                    styles.textArea,
                                    isBold && { fontWeight: 'bold' },
                                    isItalic && { fontStyle: 'italic' },
                                    isUnderline && { textDecorationLine: 'underline' },
                                    isStrikethrough && { textDecorationLine: 'line-through' },
                                ]}
                                placeholder="Enter course description"
                                placeholderTextColor="#999"
                                value={courseDescription}
                                onChangeText={setCourseDescription}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Continue Button */}
                        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                            <Text style={styles.continueButtonText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                ) : currentStep === 2 ? (
                    // Step 2: Curriculum
                    <View style={styles.stepContainer}>
                        {/* Search Box */}
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search"
                                placeholderTextColor="#999"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {/* Section Header */}
                        <View style={styles.curriculumHeader}>
                            <Text style={styles.sectionTitle}>Curriculum</Text>
                            <Text style={styles.stepIndicatorText}>Step 2 of 3</Text>
                        </View>

                        {/* Purple underline */}
                        <View style={styles.purpleUnderline} />

                        {modules.map((module, index) => (
                            <View key={module.id} style={styles.moduleCard}>
                                <View style={styles.moduleHeaderRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                                        <View style={styles.moduleNumberCircle}>
                                            <Text style={styles.moduleNumberText}>{index + 1}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => openEditModuleModal(module)} style={{ flex: 1 }}>
                                            <Text style={styles.moduleTitle}>{module.title}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity
                                        style={{ padding: 5 }}
                                        onPress={() => deleteModule(module.id)}
                                    >
                                        <Ionicons name="close" size={24} color="#999" />
                                    </TouchableOpacity>
                                </View>

                                {/* Module Content Items */}
                                <View style={{ gap: 10, marginBottom: 20 }}>
                                    {module.lessons.map((lesson) => (
                                        <View key={lesson.id} style={styles.contentItemRowNew}>
                                            <View style={styles.contentItemLeft}>
                                                <Ionicons name="menu" size={18} color="#ccc" style={{ marginRight: 10 }} />
                                                <View style={styles.lessonIconContainer}>
                                                    <Ionicons name="videocam" size={18} color="#8A2BE2" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.contentItemLabel}>LESSON</Text>
                                                    <Text style={styles.contentItemTitleText}>{lesson.title}</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.moreOptionsButton}
                                                onPress={() => {
                                                    Alert.alert('Lesson Options', 'Choose an action', [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        { text: 'Edit', onPress: () => handleEditItem(lesson, 'lesson', module.id) },
                                                        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteItem(lesson.id, 'lesson', module.id) }
                                                    ]);
                                                }}
                                            >
                                                <Ionicons name="ellipsis-vertical" size={16} color="#999" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    {module.quizzes.map((quiz) => (
                                        <View key={quiz.id} style={styles.contentItemRowNew}>
                                            <View style={styles.contentItemLeft}>
                                                <Ionicons name="menu" size={18} color="#ccc" style={{ marginRight: 10 }} />
                                                <View style={styles.quizIconContainer}>
                                                    <Ionicons name="help-circle" size={18} color="#8A2BE2" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.contentItemLabel}>QUIZ</Text>
                                                    <Text style={styles.contentItemTitleText}>{quiz.title}</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.moreOptionsButton}
                                                onPress={() => {
                                                    Alert.alert('Quiz Options', 'Choose an action', [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        { text: 'Edit', onPress: () => handleEditItem(quiz, 'quiz', module.id) },
                                                        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteItem(quiz.id, 'quiz', module.id) }
                                                    ]);
                                                }}
                                            >
                                                <Ionicons name="ellipsis-vertical" size={16} color="#999" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    {module.assignments.map((assignment) => (
                                        <View key={assignment.id} style={styles.contentItemRowNew}>
                                            <View style={styles.contentItemLeft}>
                                                <Ionicons name="menu" size={18} color="#ccc" style={{ marginRight: 10 }} />
                                                <View style={styles.assignmentIconContainer}>
                                                    <Ionicons name="document-text" size={18} color="#8A2BE2" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.contentItemLabel}>ASSIGNMENT</Text>
                                                    <Text style={styles.contentItemTitleText}>{assignment.title}</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.moreOptionsButton}
                                                onPress={() => {
                                                    Alert.alert('Assignment Options', 'Choose an action', [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        { text: 'Edit', onPress: () => handleEditItem(assignment, 'assignment', module.id) },
                                                        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteItem(assignment.id, 'assignment', module.id) }
                                                    ]);
                                                }}
                                            >
                                                <Ionicons name="ellipsis-vertical" size={16} color="#999" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>

                                {/* Module Actions - Pill Buttons */}
                                <View style={styles.moduleActionsPillContainer}>
                                    <TouchableOpacity
                                        style={styles.actionButtonPill}
                                        onPress={() => openLessonModal(module.id)}
                                    >
                                        <Ionicons name="add" size={16} color="#666" />
                                        <Text style={styles.actionButtonPillText}>Lesson</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.actionButtonPill}
                                        onPress={() => openQuizModal(module.id)}
                                    >
                                        <Ionicons name="add" size={16} color="#666" />
                                        <Text style={styles.actionButtonPillText}>Quiz</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.actionButtonPill}
                                        onPress={() => openAssignmentModal(module.id)}
                                    >
                                        <Ionicons name="add" size={16} color="#666" />
                                        <Text style={styles.actionButtonPillText}>Assignment</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        {/* Add New Module Button */}
                        <TouchableOpacity style={styles.addModuleButton} onPress={addNewModule}>
                            <Ionicons name="add-circle-outline" size={20} color="#8A2BE2" />
                            <Text style={styles.addModuleText}>Add New Module</Text>
                        </TouchableOpacity>

                        {/* Action Buttons */}
                        <View style={styles.bottomActions}>
                            <TouchableOpacity style={styles.backButtonBottom} onPress={handleBack}>
                                <Text style={styles.backButtonText}>Back</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.continueButtonBottom} onPress={handleContinue}>
                                <Text style={styles.continueButtonText}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    // Step 3: Overview
                    <View style={styles.stepContainer}>
                        <Text style={styles.sectionTitle}>Overview</Text>
                        <Text style={styles.overviewDescription}>
                            Provide essential course information to attract and inform potential students.
                        </Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>What Will I Learn?</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Master the basics of React Native"
                                placeholderTextColor="#999"
                                value={whatWillILearn}
                                onChangeText={setWhatWillILearn}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Target Audience</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Beginner developers"
                                placeholderTextColor="#999"
                                value={targetAudience}
                                onChangeText={setTargetAudience}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Total Course Duration</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 5 hours 30 minutes"
                                placeholderTextColor="#999"
                                value={totalCourseDuration}
                                onChangeText={setTotalCourseDuration}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Materials Included</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Source code, project files"
                                placeholderTextColor="#999"
                                value={materialsIncluded}
                                onChangeText={setMaterialsIncluded}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Requirements/Instructions</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., A computer with macOS or Windows"
                                placeholderTextColor="#999"
                                value={requirementsInstructions}
                                onChangeText={setRequirementsInstructions}
                            />
                        </View>
                        <View style={styles.bottomActions}>
                            <TouchableOpacity style={styles.backButtonBottom} onPress={handleBack}>
                                <Text style={styles.backButtonText}>Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.draftButtonBottom} onPress={handleSaveDraft}>
                                <Text style={styles.draftButtonText}>Save Draft</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.publishCourseButtonBottom} onPress={handlePublishCourse}>
                                <Text style={styles.publishCourseButtonText}>Publish Course</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* New Lesson Modal */}
            <Modal
                visible={showLessonModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowLessonModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Lesson | Topic: Untitled Topic</Text>
                            <TouchableOpacity onPress={() => setShowLessonModal(false)}>
                                <Ionicons name="close" size={28} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            <Text style={styles.modalLabel}>Naming</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Lesson title"
                                placeholderTextColor="#999"
                                value={lessonTitle}
                                onChangeText={setLessonTitle}
                            />

                            <Text style={styles.modalLabel}>Content</Text>

                            {/* Rich Text Toolbar for Lesson */}
                            <View style={styles.richTextToolbar}>
                                <TouchableOpacity style={styles.toolbarButton}>
                                    <Text style={styles.toolbarButtonText}>B</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.toolbarButton}>
                                    <Text style={styles.toolbarButtonTextItalic}>I</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.toolbarButton}>
                                    <Text style={styles.toolbarButtonTextUnderline}>U</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.toolbarButton}>
                                    <Ionicons name="list-outline" size={16} color="#666" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.toolbarButton}>
                                    <Ionicons name="link-outline" size={16} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={[styles.modalInput, styles.modalTextArea]}
                                placeholder="Enter lesson content"
                                placeholderTextColor="#999"
                                value={lessonContent}
                                onChangeText={setLessonContent}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />

                            <Text style={styles.modalSectionTitle}>Add Content Block</Text>
                            <Text style={styles.modalSectionSubtitle}>
                                Choose where hyperlinks will lead your course. You can rearrange them later.
                            </Text>

                            <View style={styles.contentBlocksGrid}>
                                <TouchableOpacity style={styles.contentBlock}>
                                    <Ionicons name="document-text-outline" size={32} color="#8A2BE2" />
                                    <Text style={styles.contentBlockText}>Text</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.contentBlock}>
                                    <Ionicons name="play-circle-outline" size={32} color="#8A2BE2" />
                                    <Text style={styles.contentBlockText}>Layout</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.contentBlock}>
                                    <Ionicons name="image-outline" size={32} color="#8A2BE2" />
                                    <Text style={styles.contentBlockText}>Image</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.contentBlock}>
                                    <Ionicons name="videocam-outline" size={32} color="#8A2BE2" />
                                    <Text style={styles.contentBlockText}>Video</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowLessonModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalSaveButton}
                                onPress={saveLesson}
                            >
                                <Text style={styles.modalSaveText}>Save Lesson</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* New Quiz Modal */}
            <Modal
                visible={showQuizModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowQuizModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.quizModalContainer}>
                        {/* Header */}
                        <View style={styles.quizHeaderNew}>
                            <View style={styles.quizHeaderLeft}>
                                <Ionicons name="clipboard-outline" size={20} color="#333" style={{ marginRight: 8 }} />
                                <Text style={styles.quizHeaderTitle}>{quizTitle || 'New Quiz'}</Text>
                            </View>
                            <View style={styles.quizHeaderRight}>
                                <TouchableOpacity onPress={() => setShowQuizModal(false)}>
                                    <Text style={styles.quizCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.quizNextButton}
                                    onPress={() => {
                                        if (quizActiveTab === 'details') {
                                            setQuizActiveTab('settings');
                                        } else {
                                            saveQuiz();
                                        }
                                    }}
                                >
                                    <Text style={styles.quizNextButtonText}>
                                        {quizActiveTab === 'details' ? 'Next' : 'Save'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Tabs at top centered */}
                        <View style={styles.quizTabsHeader}>
                            <View style={styles.quizTabsSegmented}>
                                <TouchableOpacity
                                    style={[styles.quizTabSegment, quizActiveTab === 'details' && styles.quizTabSegmentActive]}
                                    onPress={() => setQuizActiveTab('details')}
                                >
                                    <Text style={[styles.quizTabTextNew, quizActiveTab === 'details' && styles.quizTabActiveTextNew]}>Details</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.quizTabSegment, quizActiveTab === 'settings' && styles.quizTabSegmentActive]}
                                    onPress={() => setQuizActiveTab('settings')}
                                >
                                    <Text style={[styles.quizTabTextNew, quizActiveTab === 'settings' && styles.quizTabActiveTextNew]}>Settings</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.quizModalContent}>
                            {quizActiveTab === 'details' ? (
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {!isQuizDetailsStepComplete ? (
                                        <>
                                            {/* Input Card */}
                                            <View style={styles.quizInputCard}>
                                                <TextInput
                                                    style={styles.quizCardInput}
                                                    placeholder="Quiz Title"
                                                    placeholderTextColor="#999"
                                                    value={quizTitle}
                                                    onChangeText={setQuizTitle}
                                                />
                                                <TextInput
                                                    style={[styles.quizCardInput, styles.quizCardTextArea]}
                                                    placeholder="Quiz Summary..."
                                                    placeholderTextColor="#999"
                                                    value={quizSummary}
                                                    onChangeText={setQuizSummary}
                                                    multiline
                                                />
                                                <TouchableOpacity
                                                    style={[styles.quizOkButtonNew, { backgroundColor: quizTitle.trim() ? '#5A4AF4' : '#B0B5BD' }]}
                                                    onPress={() => {
                                                        if (!quizTitle.trim()) {
                                                            Alert.alert('Required', 'Please enter a quiz title');
                                                            return;
                                                        }
                                                        setIsQuizDetailsStepComplete(true);
                                                    }}
                                                >
                                                    <Text style={styles.quizOkButtonTextNew}>OK</Text>
                                                </TouchableOpacity>
                                            </View>

                                            {/* Placeholder Illustration */}
                                            <View style={styles.quizPlaceholderSection}>
                                                <Ionicons name="clipboard-outline" size={80} color="#E0E0E0" />
                                                <Text style={styles.quizPlaceholderTitle}>Enter a quiz title to begin.</Text>
                                                <Text style={styles.quizPlaceholderSubtitle}>Choose from a variety of question types to keep things interesting!</Text>
                                            </View>
                                        </>
                                    ) : (
                                        /* Image 2 UI after OK */
                                        <View style={{ flex: 1 }}>
                                            <View style={styles.quizDetailOverview}>
                                                <Text style={styles.quizTitleText}>{quizTitle}</Text>
                                                <Text style={styles.quizSummaryText}>{quizSummary}</Text>
                                                <TouchableOpacity onPress={() => setIsQuizDetailsStepComplete(false)}>
                                                    <Text style={styles.quizEditText}>Edit</Text>
                                                </TouchableOpacity>
                                            </View>

                                            <View style={styles.quizQuestionsHeader}>
                                                <Text style={styles.quizQuestionsTitle}>Questions</Text>
                                                <TouchableOpacity
                                                    style={styles.quizAddButton}
                                                    onPress={() => setShowQuestionTypeDropdown(!showQuestionTypeDropdown)}
                                                >
                                                    <Ionicons name="add" size={24} color="#666" />
                                                </TouchableOpacity>
                                            </View>

                                            {/* Question Type Dropdown Overlay (from previous design) */}
                                            {showQuestionTypeDropdown && (
                                                <View style={styles.questionDropdownOverlay}>
                                                    <Text style={styles.dropdownHeaderText}>Select Question Type</Text>
                                                    {[
                                                        { label: 'True/False', icon: 'radio-button-on-outline' },
                                                        { label: 'Multiple Choice', icon: 'checkbox-outline' },
                                                        { label: 'Open Ended/Essay', icon: 'reader-outline' },
                                                        { label: 'Fill in the Blanks', icon: 'remove-outline' },
                                                        { label: 'Short Answer', icon: 'text-outline' },
                                                        { label: 'Matching', icon: 'grid-outline' },
                                                        { label: 'Image Answering', icon: 'image-outline' },
                                                        { label: 'Ordering', icon: 'swap-vertical-outline' }
                                                    ].map((type) => (
                                                        <TouchableOpacity
                                                            key={type.label}
                                                            style={styles.dropdownItem}
                                                            onPress={() => {
                                                                handleAddQuestion(type.label.toLowerCase().replace(/ /g, '_').replace('/', '_') as Question['type']);
                                                                setQuizView('editor');
                                                            }}
                                                        >
                                                            <Ionicons name={type.icon as any} size={18} color="#8A2BE2" style={{ marginRight: 10 }} />
                                                            <Text style={{ fontSize: 13, color: '#333' }}>{type.label}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            )}

                                            {currentQuizQuestions.length === 0 ? (
                                                <View style={styles.quizPlaceholderSection}>
                                                    <View style={styles.illustrationWrap}>
                                                        <Ionicons name="document-text-outline" size={100} color="#E0E0E0" />
                                                    </View>
                                                    <Text style={styles.quizPlaceholderTitle}>Add your first question</Text>
                                                    <Text style={styles.quizPlaceholderSubtitle}>Get started by clicking the plus icon on the left.</Text>
                                                </View>
                                            ) : (
                                                <>
                                                    {/* List of questions */}
                                                    <View style={{ gap: 10, marginBottom: 20 }}>
                                                        {currentQuizQuestions.map((q, index) => (
                                                            <TouchableOpacity
                                                                key={q.id}
                                                                style={[
                                                                    styles.quizQuestionItem,
                                                                    activeQuestionId === q.id && styles.quizQuestionItemActive
                                                                ]}
                                                                onPress={() => {
                                                                    setActiveQuestionId(q.id);
                                                                    setShowQuestionTypeDropdown(false);
                                                                }}
                                                            >
                                                                <Text style={[
                                                                    styles.quizQuestionItemText,
                                                                    activeQuestionId === q.id && styles.quizQuestionItemTextActive
                                                                ]}>
                                                                    {index + 1}. {q.title || `New ${q.type.replace(/_/g, ' ')} Question`}
                                                                </Text>
                                                                <Ionicons name="ellipsis-vertical" size={18} color={activeQuestionId === q.id ? '#5A4AF4' : '#999'} />
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>

                                                    {/* Question Editor Section */}
                                                    {activeQuestionId && (
                                                        <View style={styles.quizQuestionEditor}>
                                                            <Text style={styles.quizEditorHeader}>
                                                                Question Editor: {currentQuizQuestions.find(q => q.id === activeQuestionId)?.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                            </Text>

                                                            <View style={styles.editorInputGroup}>
                                                                <Text style={styles.quizEditorLabel}>Question</Text>
                                                                <TextInput
                                                                    style={styles.quizEditorInput}
                                                                    placeholder="New Multiple Choice Question"
                                                                    placeholderTextColor="#999"
                                                                    value={currentQuizQuestions.find(q => q.id === activeQuestionId)?.title}
                                                                    onChangeText={(text) => updateQuestion(activeQuestionId, { title: text })}
                                                                />
                                                            </View>

                                                            <View style={styles.editorOptionsGroup}>
                                                                <Text style={styles.quizEditorLabel}>Options</Text>
                                                                {currentQuizQuestions.find(q => q.id === activeQuestionId)?.options?.map((opt, optIndex) => (
                                                                    <View key={opt.id} style={styles.quizOptionRow}>
                                                                        <TouchableOpacity
                                                                            onPress={() => toggleCorrectOption(activeQuestionId, opt.id)}
                                                                            style={styles.quizRadioButton}
                                                                        >
                                                                            <View style={[styles.radioOuter, opt.isCorrect && styles.radioOuterSelected]}>
                                                                                {opt.isCorrect && <View style={styles.radioInner} />}
                                                                            </View>
                                                                        </TouchableOpacity>
                                                                        <TextInput
                                                                            style={styles.quizOptionInput}
                                                                            value={opt.text}
                                                                            onChangeText={(text) => {
                                                                                const q = currentQuizQuestions.find(curr => curr.id === activeQuestionId);
                                                                                if (q && q.options) {
                                                                                    const updatedOptions = q.options.map(o => o.id === opt.id ? { ...o, text } : o);
                                                                                    updateQuestion(activeQuestionId, { options: updatedOptions });
                                                                                }
                                                                            }}
                                                                        />
                                                                        <TouchableOpacity onPress={() => deleteOption(activeQuestionId, opt.id)}>
                                                                            <Ionicons name="trash-outline" size={20} color="#999" />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                ))}
                                                                <TouchableOpacity
                                                                    style={styles.quizAddOptionButton}
                                                                    onPress={() => addOption(activeQuestionId)}
                                                                >
                                                                    <Text style={styles.quizAddOptionText}>Add Option</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    )}
                                                </>
                                            )}
                                        </View>
                                    )}

                                    {/* Cancel Button at bottom (optional but good for UX) */}
                                    <TouchableOpacity
                                        style={{ marginTop: 20, alignItems: 'center', marginBottom: 40 }}
                                        onPress={() => setShowQuizModal(false)}
                                    >
                                        <Text style={{ color: '#999', fontSize: 14 }}>Close</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            ) : (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ color: '#666', fontSize: 16 }}>Quiz settings will appear here.</Text>
                                    <TouchableOpacity
                                        style={[styles.quizOkButtonNew, { width: '80%', marginTop: 20, backgroundColor: '#8A2BE2' }]}
                                        onPress={saveQuiz}
                                    >
                                        <Text style={styles.quizOkButtonTextNew}>Save Quiz</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginTop: 20 }}
                                        onPress={() => setQuizActiveTab('details')}
                                    >
                                        <Text style={{ color: '#8A2BE2', fontWeight: '600' }}>Back to Details</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* New Assignment Modal */}
            <Modal
                visible={showAssignmentModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAssignmentModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Assignment | Topic: First Topic</Text>
                            <TouchableOpacity onPress={() => setShowAssignmentModal(false)}>
                                <Ionicons name="close" size={28} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            {/* Title */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                                <Text style={styles.modalLabel}>Title</Text>
                                <Text style={{ color: 'red', marginLeft: 2 }}>*</Text>
                            </View>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Enter Assignment Title"
                                placeholderTextColor="#999"
                                value={assignmentTitle}
                                onChangeText={setAssignmentTitle}
                            />

                            {/* Content */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, marginTop: 10 }}>
                                <Text style={styles.modalLabel}>Content</Text>
                                <Text style={{ color: 'red', marginLeft: 2 }}>*</Text>
                            </View>

                            <View style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#F9F9F9', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <Ionicons name="menu-outline" size={20} color="#666" />
                                        <Text style={{ fontSize: 13, color: '#333' }}>Text Block</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                    </View>
                                </View>
                                <View style={{ padding: 10 }}>
                                    {/* Simplified Rich Text Toolbar simulation */}
                                    <View style={{ flexDirection: 'row', gap: 15, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 }}>
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#333' }}>Normal</Text>
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <Text style={{ fontWeight: 'bold' }}>B</Text>
                                            <Text style={{ fontStyle: 'italic' }}>I</Text>
                                            <Text style={{ textDecorationLine: 'underline' }}>U</Text>
                                        </View>
                                    </View>
                                    <TextInput
                                        style={{ height: 150, textAlignVertical: 'top' }}
                                        multiline
                                        placeholder="Write your assignment content here..."
                                    />
                                </View>
                            </View>

                            {/* Settings Section */}
                            <Text style={styles.modalLabel}>Attachments</Text>
                            <TouchableOpacity style={{ backgroundColor: '#E0D4FC', borderRadius: 8, padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                                <Ionicons name="attach" size={20} color="#8A2BE2" />
                                <Text style={{ color: '#8A2BE2', fontWeight: 'bold' }}>Upload Attachment</Text>
                            </TouchableOpacity>

                            <Text style={styles.modalLabel}>Time Limit</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                                <TextInput
                                    style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                                    value={assignmentTimeLimit}
                                    onChangeText={setAssignmentTimeLimit}
                                    keyboardType="numeric"
                                />
                                <View style={[styles.modalInput, { flex: 1, marginBottom: 0, justifyContent: 'center' }]}>
                                    <Text>{assignmentTimeLimitUnit}</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                <Text style={styles.modalLabel}>Set Deadline From Assignment Start Time</Text>
                                <Ionicons name="toggle" size={24} color="#ccc" />
                            </View>

                            <Text style={[styles.modalLabel, { marginTop: 15 }]}>Total Points</Text>
                            <TextInput
                                style={[styles.modalInput, { marginBottom: 15 }]}
                                value={assignmentTotalPoints}
                                onChangeText={setAssignmentTotalPoints}
                                keyboardType="numeric"
                            />

                            <Text style={styles.modalLabel}>Minimum Pass Points</Text>
                            <TextInput
                                style={[styles.modalInput, { marginBottom: 15 }]}
                                value={assignmentMinPassPoints}
                                onChangeText={setAssignmentMinPassPoints}
                                keyboardType="numeric"
                            />

                            <Text style={styles.modalLabel}>File Upload Limit</Text>
                            <TextInput
                                style={[styles.modalInput, { marginBottom: 15 }]}
                                value={assignmentFileUploadLimit}
                                onChangeText={setAssignmentFileUploadLimit}
                                keyboardType="numeric"
                            />

                            <Text style={styles.modalLabel}>Maximum File Size Limit</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TextInput
                                    style={[styles.modalInput, { marginBottom: 15, flex: 1 }]}
                                    value={assignmentMaxFileSize}
                                    onChangeText={setAssignmentMaxFileSize}
                                    keyboardType="numeric"
                                />
                                <Text style={{ position: 'absolute', right: 10, top: 12, color: '#999' }}>MB</Text>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                <Text style={styles.modalLabel}>Allow Assignment Resubmission</Text>
                                <Ionicons name="toggle" size={24} color="#8A2BE2" />
                            </View>

                            <Text style={styles.modalLabel}>Maximum Resubmission Attempts</Text>
                            <TextInput
                                style={[styles.modalInput, { marginBottom: 15 }]}
                                value={assignmentMaxAttempts}
                                onChangeText={setAssignmentMaxAttempts}
                                keyboardType="numeric"
                            />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowAssignmentModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalSaveButton}
                                onPress={saveAssignment}
                            >
                                <Text style={styles.modalSaveText}>Save Assignment</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#8A2BE2',
    },
    backButton: {
        padding: 5,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    stepIndicator: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    stepText: {
        fontSize: 14,
        color: '#666',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    stepContainer: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 20,
    },
    imageUploadContainer: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0D4FC',
        borderStyle: 'dashed',
        backgroundColor: '#F9F7FF',
        marginBottom: 24,
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    uploadText: {
        marginTop: 10,
        fontSize: 14,
        color: '#8A2BE2',
        fontWeight: '500',
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#000',
        backgroundColor: '#F9F9F9',
    },
    textArea: {
        height: 120,
        paddingTop: 12,
    },
    continueButton: {
        backgroundColor: '#8A2BE2',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 20,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#000',
    },
    curriculumHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    stepIndicatorText: {
        fontSize: 14,
        color: '#666',
    },
    purpleUnderline: {
        height: 3,
        backgroundColor: '#8A2BE2',
        marginBottom: 20,
        width: '100%',
    },
    moduleCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EFEFEF',
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    moduleHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    moduleNumberContainer: {
        width: 14, // Tiny dot style
        height: 14,
        // borderRadius: 7,
        // backgroundColor: '#E0E0E0', 
        justifyContent: 'center',
        alignItems: 'center',
    },
    moduleNumber: {
        color: '#ccc',
        fontSize: 16,
        fontWeight: 'bold',
    },
    moduleInputTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        flex: 1,
    },
    moduleSubtitle: {
        fontSize: 12,
        color: '#999',
        marginLeft: 24, // Indent to align with title
    },
    contentItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    contentItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contentItemTitleText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    moreOptionsButton: {
        padding: 5,
    },
    questionCountBadge: {
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    questionCountText: {
        fontSize: 10,
        color: '#666',
        fontWeight: '600',
    },
    // New Styles for Redesigned Module UI
    moduleNumberCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#8A2BE2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    moduleNumberText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    moduleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    contentItemRowNew: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    lessonIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#E8D9FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    quizIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#E8D9FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    assignmentIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#E8D9FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    contentItemLabel: {
        fontSize: 10,
        color: '#8A2BE2',
        fontWeight: '600',
        marginBottom: 2,
    },
    moduleActionsPillContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 5,
    },
    actionButtonPill: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F7',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 6,
    },
    actionButtonPillText: {
        color: '#333',
        fontSize: 13,
        fontWeight: '600',
    },
    bottomActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 10,
    },
    backButtonBottom: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#8A2BE2',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        color: '#8A2BE2',
        fontSize: 16,
        fontWeight: 'bold',
    },
    addModuleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
        marginBottom: 24,
    },
    addModuleText: {
        color: '#8A2BE2',
        fontSize: 14,
        fontWeight: '600',
    },
    continueButtonBottom: {
        flex: 1,
        backgroundColor: '#8A2BE2',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // ... existing ...
    draftButtonBottom: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#8A2BE2',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    draftButtonText: {
        color: '#8A2BE2',
        fontSize: 16,
        fontWeight: 'bold',
    },
    publishCourseButtonBottom: {
        flex: 1,
        backgroundColor: '#8A2BE2',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    publishCourseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    richTextToolbar: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        flexWrap: 'wrap',
    },
    toolbarDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        gap: 6,
    },
    dropdownText: {
        fontSize: 12,
        color: '#333',
    },
    toolbarButton: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    toolbarButtonActive: {
        backgroundColor: '#8A2BE2',
        borderColor: '#8A2BE2',
    },
    toolbarButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    toolbarButtonTextItalic: {
        fontSize: 16,
        fontStyle: 'italic',
        fontWeight: 'bold',
        color: '#333',
    },
    toolbarButtonTextUnderline: {
        fontSize: 16,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        color: '#333',
    },
    toolbarButtonTextStrike: {
        fontSize: 16,
        fontWeight: 'bold',
        textDecorationLine: 'line-through',
        color: '#333',
    },
    toolbarButtonTextActive: {
        color: '#fff',
    },
    toolbarDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 4,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    modalContent: {
        padding: 20,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#000',
        backgroundColor: '#F9F9F9',
        marginBottom: 16,
    },
    modalTextArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 20,
        marginBottom: 8,
    },
    modalSectionSubtitle: {
        fontSize: 12,
        color: '#666',
        marginBottom: 16,
    },
    contentBlocksGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    contentBlock: {
        width: '22%',
        aspectRatio: 1,
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    contentBlockText: {
        fontSize: 11,
        color: '#333',
        marginTop: 6,
        textAlign: 'center',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    modalSaveButton: {
        flex: 1,
        backgroundColor: '#8A2BE2',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    modalSaveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Quiz Modal Styles Redesigned
    quizModalContainer: {
        width: '95%',
        height: '92%',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    quizHeaderNew: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    quizHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quizHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    quizHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    quizCancelText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    quizNextButton: {
        backgroundColor: '#5A4AF4',
        paddingHorizontal: 22,
        paddingVertical: 8,
        borderRadius: 20,
    },
    quizNextButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    quizTabsHeader: {
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 25,
        paddingHorizontal: 20,
    },
    quizTabsSegmented: {
        flexDirection: 'row',
        backgroundColor: '#F2F2F7',
        borderRadius: 10,
        padding: 4,
        width: '100%',
    },
    quizTabSegment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    quizTabSegmentActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    quizTabTextNew: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    quizTabActiveTextNew: {
        color: '#000',
        fontWeight: '600',
    },
    quizModalContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    quizInputCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    quizCardInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 14,
        fontSize: 15,
        color: '#000',
        backgroundColor: '#fff',
        marginBottom: 12,
    },
    quizCardTextArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    quizOkButtonNew: {
        backgroundColor: '#B0B5BD',
        borderRadius: 20,
        paddingVertical: 14,
        alignItems: 'center',
    },
    quizOkButtonTextNew: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    quizPlaceholderSection: {
        alignItems: 'center',
        marginTop: 20,
        paddingBottom: 40,
    },
    quizPlaceholderTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 20,
    },
    quizPlaceholderSubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 30,
        lineHeight: 20,
    },
    quizDetailOverview: {
        paddingVertical: 10,
        marginBottom: 20,
    },
    quizTitleText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    quizSummaryText: {
        fontSize: 15,
        color: '#666',
        marginBottom: 10,
    },
    quizEditText: {
        fontSize: 14,
        color: '#5A4AF4',
        fontWeight: '600',
    },
    quizQuestionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 15,
    },
    quizQuestionsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    quizAddButton: {
        backgroundColor: '#F2F2F7',
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    illustrationWrap: {
        marginBottom: 10,
    },
    questionDropdownOverlay: {
        position: 'absolute',
        top: 150,
        right: 0,
        width: 220,
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 1000,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    dropdownHeaderText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    quizQuestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9F9FB',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F0F0F3',
    },
    quizQuestionItemActive: {
        backgroundColor: '#EEEDFF',
        borderColor: '#5A4AF4',
    },
    quizQuestionItemText: {
        fontSize: 14,
        color: '#333',
    },
    quizQuestionItemTextActive: {
        color: '#5A4AF4',
        fontWeight: 'bold',
    },
    quizQuestionEditor: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    quizEditorHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 20,
    },
    editorInputGroup: {
        marginBottom: 20,
    },
    quizEditorLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    quizEditorInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#000',
        backgroundColor: '#fff',
    },
    editorOptionsGroup: {
        marginBottom: 20,
    },
    quizOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    quizRadioButton: {
        padding: 4,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterSelected: {
        borderColor: '#5A4AF4',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#5A4AF4',
    },
    quizOptionInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        color: '#000',
        backgroundColor: '#fff',
    },
    quizAddOptionButton: {
        marginTop: 5,
    },
    quizAddOptionText: {
        fontSize: 14,
        color: '#5A4AF4',
        fontWeight: '600',
    },
    overviewDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
});
