import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TermsOfService() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms of Service</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.lastUpdated}>Effective Date: 15 January 2025</Text>

                <View style={styles.section}>
                    <Text style={styles.heading}>Agreement Guide</Text>
                    <Text style={styles.listItem}>• Acceptance of Terms</Text>
                    <Text style={styles.listItem}>• User Accounts</Text>
                    <Text style={styles.listItem}>• Educational Content</Text>
                    <Text style={styles.listItem}>• Code of Conduct</Text>
                    <Text style={styles.listItem}>• Intellectual Property</Text>
                    <Text style={styles.listItem}>• Limitation of Liability</Text>
                    <Text style={styles.listItem}>• Termination</Text>
                    <Text style={styles.listItem}>• Governing Law</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Acceptance of Terms</Text>
                    <Text style={styles.text}>
                        By accessing or using the WeVersity platform (the "Site"), you agree to be bound by these Terms of Service and our Privacy Policy. These terms govern your use of the educational materials, communication tools, and certificates provided by WeVersity.org.
                    </Text>
                    <Text style={styles.text}>
                        If you do not agree to these terms, please discontinue use of the platform immediately.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>User Accounts</Text>
                    <Text style={styles.text}>Registration is required to access our full course library. You are responsible for:</Text>
                    <Text style={styles.listItem}>• Providing accurate information during sign-up.</Text>
                    <Text style={styles.listItem}>• Maintaining the confidentiality of your account credentials.</Text>
                    <Text style={styles.listItem}>• All activities that occur under your account.</Text>
                    <Text style={styles.listItem}>• Notifying us immediately of any unauthorized use.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Educational Content</Text>
                    <Text style={styles.text}>
                        All courses on WeVersity are provided for educational purposes. We strive to maintain high quality, but we do not guarantee employment or specific income levels as a result of taking our courses.
                    </Text>
                    <View style={styles.highlightBox}>
                        <Text style={styles.highlightText}>
                            Free Access: Our core courses are 100% free. Any monetized features (like optional instructor tips) are clearly marked and not required for completion.
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Code of Conduct</Text>
                    <Text style={styles.text}>To maintain a safe learning environment, you agree NOT to:</Text>
                    <Text style={styles.listItem}>• Post offensive, hateful, or discriminatory content in communities or Q&A.</Text>
                    <Text style={styles.listItem}>• Spam other users or instructors.</Text>
                    <Text style={styles.listItem}>• Attempt to scrape, hack, or disrupt the platform's infrastructure.</Text>
                    <Text style={styles.listItem}>• Misrepresent your identity or achievements.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Intellectual Property</Text>
                    <Text style={styles.text}>
                        The WeVersity name, logo, and original platform code are property of WeVersity.org. Course materials remain the property of their respective instructors; however, by uploading content, instructors grant WeVersity a perpetual, worldwide license to host and distribute the content for free to students.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Limitation of Liability</Text>
                    <Text style={styles.text}>
                        WeVersity provides the platform on an "as-is" basis. We are not liable for any indirect, consequential, or incidental damages arising from your use of the site or the information provided in courses.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Termination</Text>
                    <Text style={styles.text}>
                        We reserve the right to suspend or terminate any user account that violates these terms or engages in behavior that is detrimental to the WeVersity community.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Governing Law</Text>
                    <Text style={styles.text}>
                        These terms shall be governed by the laws of the State of New Jersey, USA, without regard to its conflict of law principles. Any legal actions must be brought within that jurisdiction.
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
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
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    lastUpdated: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    section: {
        marginBottom: 24,
    },
    heading: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#8A2BE2', // Purple accent
        marginBottom: 12,
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        marginBottom: 8,
    },
    listItem: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        marginLeft: 8,
        marginBottom: 4,
    },
    highlightBox: {
        backgroundColor: '#F3E5F5',
        padding: 12,
        borderRadius: 8,
        marginVertical: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#8A2BE2',
    },
    highlightText: {
        fontSize: 15,
        color: '#4A148C',
        fontWeight: '500',
    },
});
