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

interface Module {
    id: string;
    title: string;
    lessons: Lesson[];
    quizzes: Quiz[];
    assignments: Assignment[];
}

interface Lesson {
    id: string;
    title: string;
}

interface Quiz {
    id: string;
    title: string;
}

interface Assignment {
    id: string;
    title: string;
}

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

    // Step 2: Curriculum
    const [modules, setModules] = useState<Module[]>([
        {
            id: '1',
            title: 'Introduction',
            lessons: [{ id: 'l1', title: 'Welcome to the Course' }],
            quizzes: [{ id: 'q1', title: 'Knowledge Check: Basics' }],
            assignments: [{ id: 'a1', title: 'Setup Your Workspace' }],
        },
    ]);
    
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

    const openLessonModal = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        setShowLessonModal(true);
    };

    const openQuizModal = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        setShowQuizModal(true);
    };

    const saveLesson = () => {
        if (!lessonTitle.trim()) {
            Alert.alert('Required', 'Please enter a lesson title');
            return;
        }

        const updatedModules = modules.map(module => {
            if (module.id === selectedModuleId) {
                return {
                    ...module,
                    lessons: [...module.lessons, { id: Date.now().toString(), title: lessonTitle }]
                };
            }
            return module;
        });

        setModules(updatedModules);
        setLessonTitle('');
        setLessonContent('');
        setShowLessonModal(false);
    };

    const saveQuiz = () => {
        if (!quizTitle.trim()) {
            Alert.alert('Required', 'Please enter a quiz title');
            return;
        }

        const updatedModules = modules.map(module => {
            if (module.id === selectedModuleId) {
                return {
                    ...module,
                    quizzes: [...module.quizzes, { id: Date.now().toString(), title: quizTitle }]
                };
            }
            return module;
        });

        setModules(updatedModules);
        setQuizTitle('');
        setQuizSummary('');
        setShowQuizModal(false);
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

                        {/* Modules List */}
                        {modules.map((module, index) => (
                            <View key={module.id} style={styles.moduleCard}>
                                <View style={styles.moduleHeader}>
                                    <View style={styles.moduleNumberContainer}>
                                        <Text style={styles.moduleNumber}>{index + 1}</Text>
                                    </View>
                                    <TextInput
                                        style={styles.moduleInput}
                                        value={module.title}
                                        onChangeText={(text) => {
                                            const updated = [...modules];
                                            updated[index].title = text;
                                            setModules(updated);
                                        }}
                                        placeholder="Module title"
                                        placeholderTextColor="#999"
                                    />
                                    {modules.length > 1 && (
                                        <TouchableOpacity onPress={() => deleteModule(module.id)}>
                                            <Ionicons name="close" size={24} color="#666" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Module Content Items */}
                                {module.lessons.map((lesson) => (
                                    <View key={lesson.id} style={styles.contentItem}>
                                        <View style={styles.contentItemLeft}>
                                            <Ionicons name="menu" size={16} color="#999" />
                                            <View style={styles.contentIconContainer}>
                                                <Ionicons name="videocam" size={16} color="#8A2BE2" />
                                            </View>
                                            <View>
                                                <Text style={styles.contentItemLabel}>LESSON</Text>
                                                <Text style={styles.contentItemTitle}>{lesson.title}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}

                                {module.quizzes.map((quiz) => (
                                    <View key={quiz.id} style={[styles.contentItem, styles.contentItemHighlight]}>
                                        <View style={styles.contentItemLeft}>
                                            <Ionicons name="menu" size={16} color="#999" />
                                            <View style={styles.contentIconContainer}>
                                                <Ionicons name="help-circle" size={16} color="#8A2BE2" />
                                            </View>
                                            <View>
                                                <Text style={styles.contentItemLabel}>QUIZ</Text>
                                                <Text style={styles.contentItemTitle}>{quiz.title}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}

                                {module.assignments.map((assignment) => (
                                    <View key={assignment.id} style={styles.contentItem}>
                                        <View style={styles.contentItemLeft}>
                                            <Ionicons name="menu" size={16} color="#999" />
                                            <View style={styles.contentIconContainer}>
                                                <Ionicons name="document-text" size={16} color="#8A2BE2" />
                                            </View>
                                            <View>
                                                <Text style={styles.contentItemLabel}>ASSIGNMENT</Text>
                                                <Text style={styles.contentItemTitle}>{assignment.title}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}

                                {/* Module Actions */}
                                <View style={styles.moduleActions}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => openLessonModal(module.id)}
                                    >
                                        <Ionicons name="videocam" size={24} color="#fff" />
                                        <Text style={styles.actionButtonText}>Lessons</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => openQuizModal(module.id)}
                                    >
                                        <Ionicons name="help-circle" size={24} color="#fff" />
                                        <Text style={styles.actionButtonText}>Quizzes</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.actionButton}>
                                        <Ionicons name="document-text" size={24} color="#fff" />
                                        <Text style={styles.actionButtonText}>Assignments</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Delete Module Link */}
                                {modules.length > 1 && (
                                    <TouchableOpacity
                                        style={styles.deleteModuleLink}
                                        onPress={() => deleteModule(module.id)}
                                    >
                                        <Ionicons name="trash-outline" size={14} color="#FF5252" />
                                        <Text style={styles.deleteModuleText}>Delete Module</Text>
                                    </TouchableOpacity>
                                )}
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
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <View style={styles.quizTabsContainer}>
                                <Text style={styles.modalTitle}>New Quiz | Topic</Text>
                                <View style={styles.quizTabs}>
                                    <TouchableOpacity style={styles.quizTabActive}>
                                        <Text style={styles.quizTabTextActive}>Question Details</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.quizTab}>
                                        <Text style={styles.quizTabText}>Settings</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setShowQuizModal(false)}>
                                <Ionicons name="close" size={28} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            <View style={styles.quizInputContainer}>
                                <TextInput
                                    style={styles.quizInput}
                                    placeholder="Quiz Title"
                                    placeholderTextColor="#999"
                                    value={quizTitle}
                                    onChangeText={setQuizTitle}
                                />

                                <TextInput
                                    style={[styles.quizInput, styles.quizTextArea]}
                                    placeholder="Quiz Summary"
                                    placeholderTextColor="#999"
                                    value={quizSummary}
                                    onChangeText={setQuizSummary}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />

                                <TouchableOpacity style={styles.quizOkButton}>
                                    <Text style={styles.quizOkButtonText}>Ok</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.quizEmptyState}>
                                <Ionicons name="clipboard-outline" size={64} color="#CCC" />
                                <Text style={styles.quizEmptyTitle}>Enter a quiz title to begin.</Text>
                                <Text style={styles.quizEmptySubtitle}>
                                    Choose from a variety of question types to keep things interesting!
                                </Text>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowQuizModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalSaveButton}
                                onPress={saveQuiz}
                            >
                                <Text style={styles.modalSaveText}>Next</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
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
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0D4FC',
        padding: 16,
        marginBottom: 16,
    },
    moduleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    moduleNumberContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#8A2BE2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    moduleNumber: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    moduleInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    contentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginBottom: 8,
    },
    contentItemHighlight: {
        borderWidth: 2,
        borderColor: '#8A2BE2',
        backgroundColor: '#F9F7FF',
    },
    contentItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    contentIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: '#E0D4FC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentItemLabel: {
        fontSize: 10,
        color: '#8A2BE2',
        fontWeight: '600',
    },
    contentItemTitle: {
        fontSize: 13,
        color: '#000',
        fontWeight: '500',
    },
    moduleActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
        marginBottom: 12,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#8A2BE2',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    deleteModuleLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 6,
    },
    deleteModuleText: {
        color: '#FF5252',
        fontSize: 12,
        fontWeight: '600',
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
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        color: '#8A2BE2',
        fontSize: 16,
        fontWeight: 'bold',
    },
    continueButtonBottom: {
        flex: 1,
        backgroundColor: '#8A2BE2',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
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
    // Quiz Modal Styles
    quizTabsContainer: {
        flex: 1,
    },
    quizTabs: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    quizTab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    quizTabActive: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderBottomWidth: 2,
        borderBottomColor: '#8A2BE2',
    },
    quizTabText: {
        fontSize: 14,
        color: '#666',
    },
    quizTabTextActive: {
        fontSize: 14,
        color: '#8A2BE2',
        fontWeight: '600',
    },
    quizInputContainer: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    quizInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#000',
        backgroundColor: '#fff',
        marginBottom: 12,
    },
    quizTextArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    quizOkButton: {
        backgroundColor: '#999',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    quizOkButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    quizEmptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    quizEmptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    quizEmptySubtitle: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    overviewDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    draftButtonBottom: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#8A2BE2',
        borderRadius: 12,
        paddingVertical: 8,
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
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    publishCourseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
