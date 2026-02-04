import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PrivacyPolicy() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.lastUpdated}>Last Updated: 15 January 2025</Text>

                <View style={styles.section}>
                    <Text style={styles.heading}>Table of Contents</Text>
                    <Text style={styles.listItem}>• Introduction</Text>
                    <Text style={styles.listItem}>• Information We Collect</Text>
                    <Text style={styles.listItem}>• How We Use Your Data</Text>
                    <Text style={styles.listItem}>• Data Security</Text>
                    <Text style={styles.listItem}>• Cookies Policy</Text>
                    <Text style={styles.listItem}>• Third-Party Services</Text>
                    <Text style={styles.listItem}>• Children's Privacy</Text>
                    <Text style={styles.listItem}>• Contact Us</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Introduction</Text>
                    <Text style={styles.text}>
                        Welcome to WeVersity. We are committed to protecting your personal data and respecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website weversity.org.
                    </Text>
                    <Text style={styles.text}>
                        By using our platform, you agree to the practices described in this policy. We reserve the right to make changes to this policy at any time, and we will notify you of any updates by changing the "Last Updated" date.
                    </Text>
                    <View style={styles.highlightBox}>
                        <Text style={styles.highlightText}>
                            Summary: Your privacy is our priority. We only collect necessary data to provide a high-quality free learning experience.
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Information We Collect</Text>
                    <Text style={styles.text}>We collect information about you in several ways to improve your learning experience:</Text>

                    <Text style={styles.subHeading}>Personal Data</Text>
                    <Text style={styles.text}>
                        This includes your name, email address, phone number, and occupation provided during registration or profile updates.
                    </Text>

                    <Text style={styles.subHeading}>Learning Progress</Text>
                    <Text style={styles.text}>
                        We track course enrollments, lesson completions, and quiz results to provide you with certificates and track your "Learn to Earn" journey.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>How We Use Your Data</Text>
                    <Text style={styles.text}>We use your information to facilitate a smooth educational experience, including:</Text>
                    <Text style={styles.listItem}>• Account management and authentication.</Text>
                    <Text style={styles.listItem}>• Personalized course recommendations.</Text>
                    <Text style={styles.listItem}>• Processing course completions and issuing digital certificates.</Text>
                    <Text style={styles.listItem}>• Sending updates about new courses, live sessions, and announcements.</Text>
                    <Text style={styles.listItem}>• Improving site functionality through usage analytics.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Data Security</Text>
                    <Text style={styles.text}>
                        We implement industry-standard security measures, including SSL encryption and secure database management through Supabase, to protect your data. While no system is 100% secure, we continuously monitor for vulnerabilities to keep your information safe.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Cookies Policy</Text>
                    <Text style={styles.text}>
                        We use cookies to maintain your session and remember your preferences. You can disable cookies in your browser settings, but please note that some features of WeVersity may not function correctly without them.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Third-Party Services</Text>
                    <Text style={styles.text}>We work with trusted third-party providers to enhance our services:</Text>
                    <Text style={styles.listItem}>• <Text style={styles.bold}>Supabase:</Text> For secure authentication and data storage.</Text>
                    <Text style={styles.listItem}>• <Text style={styles.bold}>Cloudinary:</Text> For hosting educational media and course images.</Text>
                    <Text style={styles.listItem}>• <Text style={styles.bold}>Google/Zoom:</Text> For conducting live masterclasses and sessions.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Children's Privacy</Text>
                    <Text style={styles.text}>
                        WeVersity is intended for users aged 13 and older. We do not knowingly collect data from children under 13 without parental consent. If you believe we have inadvertently collected such data, please contact us immediately.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Contact Us</Text>
                    <Text style={styles.text}>If you have questions about this Privacy Policy, please reach out to our team:</Text>
                    <Text style={styles.bold}>WeVersity Support Team</Text>
                    <Text style={styles.text}>Email: info@weversity.org</Text>
                    <Text style={styles.text}>Address: 100 Bomont Place, Totowa, NJ 07512, USA</Text>
                </View>
            </ScrollView>
        </View>
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
        paddingTop: 50, // Added padding for status bar area
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#8A2BE2', // Purple Header
    },
    backButton: {
        padding: 8,
        marginRight: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
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
    subHeading: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4A4A4A',
        marginTop: 12,
        marginBottom: 8,
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
    bold: {
        fontWeight: 'bold',
    },
});
