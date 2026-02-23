import { useAuth } from '@/src/context/AuthContext';
// @ts-ignore
import { supabase } from '@/src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PublicSettingsScreen() {
    const router = useRouter();
    const { user, updateUser } = useAuth();
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
        // Prevent double submission
        if (saving) return;

        try {
            setSaving(true);

            let finalAvatarUrl = avatarUrl;

            // Upload image to Cloudinary if new image is selected
            if (newImageUri) {
                try {
                    finalAvatarUrl = await uploadImageToCloudinary(newImageUri);
                    console.log('Image uploaded successfully:', finalAvatarUrl);
                } catch (uploadError: any) {
                    console.error('Cloudinary upload failed:', uploadError);
                    // Reset saving state before showing error
                    setSaving(false);
                    Alert.alert('Upload Error', 'Failed to upload image. Saving other changes...');
                    // Continue with profile update even if image upload fails
                    setSaving(true);
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

            if (profileError) {
                console.error('Supabase profile update failed:', profileError);
                throw profileError;
            }

            console.log('Profile updated successfully in database');

            // Update local state immediately
            setAvatarUrl(finalAvatarUrl);
            setNewImageUri(null);

            // CRITICAL: Reset saving state BEFORE showing Alert to prevent white screen
            setSaving(false);

            // Sync with auth metadata (non-blocking, fire-and-forget)
            // This runs in the background and won't block the UI
            supabase.auth.updateUser({
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    avatar_url: finalAvatarUrl,
                }
            }).catch((authError: any) => {
                // Log but don't block on auth metadata errors
                console.error('Auth metadata update failed (non-critical):', authError);
            });

            // Optimistically update local auth user metadata so other screens (Inbox, ViewProfile, etc.)
            // instantly see the latest profile values without waiting for Supabase cache refresh.
            updateUser({
                user_metadata: {
                    ...(user?.user_metadata || {}),
                    first_name: firstName,
                    last_name: lastName,
                    avatar_url: finalAvatarUrl,
                },
            });

            // Show success message and navigate only after user clicks OK
            Alert.alert(
                'Success',
                'Profile updated successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Small delay to ensure Alert closes completely before navigation
                            setTimeout(() => {
                                router.back();
                            }, 300);
                        }
                    }
                ]
            );

        } catch (error: any) {
            console.error('Error saving profile:', error.message);
            // Reset saving state before showing error
            setSaving(false);
            Alert.alert('Error', 'Failed to save profile changes. Please try again.');
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" translucent />
                <Stack.Screen options={{ headerShown: false }} />

                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Settings</Text>
                </View>

                <KeyboardAwareScrollView
                    enableOnAndroid={true}
                    extraScrollHeight={130}
                    keyboardShouldPersistTaps="always"
                    style={{ flex: 1 }}
                    contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
                    showsVerticalScrollIndicator={false}
                >
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

                    {/* Bottom spacer for scroll room */}
                    <View style={{ height: 120 }} />
                </KeyboardAwareScrollView>

                {/* Save Button - Fixed Footer */}
                <View style={[styles.saveButtonWrapper, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.8}
                        style={{ overflow: 'hidden', borderRadius: 28 }}
                    >
                        <View style={styles.saveButton}>
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableWithoutFeedback>
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
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#8A2BE2',
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContent: {
        paddingBottom: 20,
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
        paddingHorizontal: 24,
        paddingTop: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    saveButton: {
        height: 56,
        borderRadius: 28,
        backgroundColor: '#8A2BE2',
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

