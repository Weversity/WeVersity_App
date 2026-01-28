import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PublicSettingsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');
    const [role, setRole] = useState('Instructor');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [newImageUri, setNewImageUri] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id) {
            loadProfile();
        }
    }, [user?.id]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (error) throw error;

            if (data) {
                setFirstName(data.first_name || '');
                setLastName(data.last_name || '');
                setBio(data.biography || ''); // Map to 'biography' field
                setRole(data.occupation || 'Instructor'); // Map to 'occupation' field
                setAvatarUrl(data.avatar_url || '');
            }
        } catch (error: any) {
            console.error('Error loading profile:', error.message);
            Alert.alert('Error', 'Failed to load profile details');
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to change your photo.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setNewImageUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            let finalAvatarUrl = avatarUrl;

            // Upload image to Cloudinary if new image is selected
            if (newImageUri) {
                try {
                    finalAvatarUrl = await uploadImageToCloudinary(newImageUri);
                } catch (uploadError: any) {
                    console.error('Image upload failed:', uploadError);
                    Alert.alert('Upload Error', 'Failed to upload image. Saving other changes...');
                }
            }

            // Update profiles table with correct field mapping
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    occupation: role, // Map 'role' to 'occupation'
                    biography: bio, // Map 'bio' to 'biography'
                    avatar_url: finalAvatarUrl,
                })
                .eq('id', user?.id);

            if (profileError) throw profileError;

            // Sync with auth metadata for real-time updates across the app
            try {
                await supabase.auth.updateUser({
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        avatar_url: finalAvatarUrl,
                    }
                });
            } catch (authError: any) {
                console.error('Auth metadata update failed (non-critical):', authError);
            }

            // Update local state
            setAvatarUrl(finalAvatarUrl);
            setNewImageUri(null);

            Alert.alert('Success', 'Profile updated successfully!');
            router.back();
        } catch (error: any) {
            console.error('Error saving profile:', error.message);
            Alert.alert('Error', 'Failed to save profile changes');
        } finally {
            setSaving(false);
        }
    };

    // Helper dedicated to Image Upload
    const uploadImageToCloudinary = async (fileUri: string) => {
        const cloudName = 'dn93gd6yw';
        const uploadPreset = 'weversity_unsigned';

        const data = new FormData();
        // @ts-ignore
        data.append('file', {
            uri: fileUri,
            type: 'image/jpeg',
            name: 'profile_photo.jpg',
        });
        data.append('upload_preset', uploadPreset);
        data.append('resource_type', 'image');

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: 'POST',
                body: data,
                headers: {
                    'Accept': 'application/json',
                },
            }
        );

        const result = await response.json();
        if (result.secure_url) {
            return result.secure_url;
        } else {
            throw new Error(result.error?.message || 'Image upload failed');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8A2BE2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Photo Section */}
                <View style={styles.photoSection}>
                    <TouchableOpacity onPress={handlePickImage} activeOpacity={0.9}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={{ uri: newImageUri || avatarUrl || 'https://via.placeholder.com/150' }}
                                style={styles.avatar}
                            />
                            <View style={styles.cameraOverlay}>
                                <Ionicons name="camera" size={20} color="#fff" />
                            </View>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handlePickImage} style={styles.changePhotoButton}>
                        <Text style={styles.changePhotoText}>Change Photo</Text>
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>First Name</Text>
                        <TextInput
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="Enter first name"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Enter last name"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Role</Text>
                        <TextInput
                            style={styles.input}
                            value={role}
                            onChangeText={setRole}
                            placeholder="e.g. Instructor"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Tell others about yourself..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={styles.saveButtonWrapper}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <LinearGradient
                        colors={['#8A2BE2', '#FF007F']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveButton}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 10,
        backgroundColor: '#8A2BE2',
        minHeight: 60,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    photoSection: {
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    avatarWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        backgroundColor: '#f9f9f9',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#fff',
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#8A2BE2',
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    changePhotoButton: {
        marginTop: 12,
    },
    changePhotoText: {
        color: '#8A2BE2',
        fontSize: 14,
        fontWeight: '600',
    },
    form: {
        paddingHorizontal: 24,
        marginTop: 10,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 54,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#eee',
    },
    textArea: {
        height: 120,
        paddingTop: 16,
        paddingBottom: 16,
    },
    saveButtonWrapper: {
        marginHorizontal: 24,
        marginTop: 20,
    },
    saveButton: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
