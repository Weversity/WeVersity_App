import { supabase } from '@/src/auth/supabase';
import { useAuth } from '@/src/context/AuthContext'; // Assuming AuthContext for logout
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View
} from 'react-native';

const CLOUDINARY_CLOUD_NAME = 'dn93gd6yw';
const CLOUDINARY_UPLOAD_PRESET = 'weversity_unsigned';

const uploadImageToCloudinary = async (uri: string) => {
  try {
    const data = new FormData();
    // @ts-ignore
    data.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'profile_avatar.jpg',
    });
    data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    data.append('cloud_name', CLOUDINARY_CLOUD_NAME);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: data,
      headers: {
        'Accept': 'application/json',
      },
    });

    const result = await res.json();
    if (result.secure_url) {
      return result.secure_url;
    } else {
      throw new Error(result.error?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
};


// Confirmation Dialog Component
const ConfirmationDialog = ({ visible, message, onConfirm, onCancel }: { visible: boolean; message: string; onConfirm: () => void; onCancel: () => void }) => {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={dialogStyles.overlay}>
        <View style={dialogStyles.dialogContainer}>
          <Text style={dialogStyles.dialogMessage}>{message}</Text>
          <View style={dialogStyles.dialogActions}>
            <TouchableOpacity style={dialogStyles.dialogButtonNo} onPress={onCancel}>
              <Text style={dialogStyles.dialogButtonTextNo}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dialogStyles.dialogButtonYes} onPress={onConfirm}>
              <Text style={dialogStyles.dialogButtonTextYes}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const dialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dialogContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dialogMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  dialogButtonNo: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#ccc',
  },
  dialogButtonYes: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#8A2BE2',
  },
  dialogButtonTextNo: {
    color: '#333',
    fontWeight: 'bold',
  },
  dialogButtonTextYes: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

// Edit Profile Modal Component
const EditProfileModal = ({ visible, onClose, initialData, onRefresh }: { visible: boolean; onClose: () => void; initialData: any; onRefresh: () => Promise<void> | void }) => {
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [occupation, setOccupation] = useState(initialData?.occupation || '');
  const [profileImage, setProfileImage] = useState(initialData?.avatarUrl || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // Image upload state
  const { updateUser } = useAuth();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setFirstName(initialData?.firstName || '');
      setLastName(initialData?.lastName || '');
      setOccupation(initialData?.occupation || '');
      setProfileImage(initialData?.avatarUrl || '');
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, initialData]);

  const handleImagePick = () => {
    Alert.alert(
      'Profile Photo Size: 200x200 pixels',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => pickImage('camera') },
        { text: 'Choose from Gallery', onPress: () => pickImage('gallery') },
      ]
    );
  };

  const pickImage = async (mode: 'camera' | 'gallery') => {
    try {
      let result;
      if (mode === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permission needed', 'Gallery permission is required.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
      }

      if (!result.canceled && result.assets[0].uri) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image Picker Error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    setIsUploading(true);
    try {
      const secureUrl = await uploadImageToCloudinary(uri);
      setProfileImage(secureUrl);
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Could not upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    // 1. State Lock - Prevent double clicks
    if (isUpdating) return;

    setIsUpdating(true);
    console.log('Starting profile update...');

    try {
      // Data Validation
      const fName = firstName?.trim() || '';
      const lName = lastName?.trim() || '';
      const occ = occupation?.trim() || '';
      const pImg = profileImage || '';

      console.log('Fetching user...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // 2. Update Profiles Table (Priority)
      console.log('Updating profiles table...');
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: fName,
          last_name: lName,
          occupation: occ,
          avatar_url: pImg,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Update Auth Metadata (Non-Blocking / Independent)
      console.log('Syncing auth metadata...');
      try {
        await supabase.auth.updateUser({
          data: {
            first_name: fName,
            last_name: lName,
            avatar_url: pImg
          }
        });
      } catch (authErr) {
        // Log but do NOT fail the main process
        console.warn('Auth metadata update failed (non-critical):', authErr);
      }

      // 3b. Optimistically sync local auth context so all screens immediately reflect new metadata.
      updateUser({
        user_metadata: {
          ...(user?.user_metadata || {}),
          first_name: fName,
          last_name: lName,
          avatar_url: pImg,
        },
      });

      console.log('Update Success');

      // 4. Critical Execution Order
      console.log('Executing refresh...');
      await onRefresh(); // Trigger parent sync

      console.log('Stopping spinner and closing...');
      setIsUpdating(false);
      onClose();

      // 5. Success Feedback
      if (Platform.OS === 'android') {
        ToastAndroid.show('Your profile is successfully updated', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Your profile is successfully updated');
      }

    } catch (error: any) {
      setIsUpdating(false); // Emergency spinner stop
      console.log('Update Error', error);
      console.error('Update profile error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      // 5. Unset Loading State - Safety check
      if (isUpdating) setIsUpdating(false);
    }
  };

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={editProfileStyles.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[editProfileStyles.modalContent, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity style={editProfileStyles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle-outline" size={28} color="#999" />
          </TouchableOpacity>
          <Text style={editProfileStyles.modalTitle}>Edit Profile</Text>

          <TouchableOpacity
            style={editProfileStyles.profileImageContainer}
            onPress={handleImagePick}
            disabled={isUploading || isUpdating}
          >
            {isUploading ? (
              <ActivityIndicator color="#8A2BE2" />
            ) : (
              <Image
                source={(profileImage && profileImage.trim() !== '' && profileImage.startsWith('http'))
                  ? { uri: profileImage }
                  : { uri: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=8A2BE2&color=fff` }}
                style={[editProfileStyles.profileImage, { backgroundColor: '#f0f0f0' }]}
              />
            )}
            <View style={editProfileStyles.cameraIcon}>
              <Ionicons name="camera-outline" size={24} color="#fff" />
            </View>
          </TouchableOpacity>

          <TextInput
            style={[editProfileStyles.input, isUpdating && { opacity: 0.6 }]}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholderTextColor="#666"
            editable={!isUpdating}
          />

          <TextInput
            style={[editProfileStyles.input, isUpdating && { opacity: 0.6 }]}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholderTextColor="#666"
            editable={!isUpdating}
          />
          <TextInput
            style={[editProfileStyles.input, isUpdating && { opacity: 0.6 }]}
            placeholder="Occupation"
            value={occupation}
            onChangeText={setOccupation}
            placeholderTextColor="#666"
            editable={!isUpdating}
          />

          <TouchableOpacity
            style={[editProfileStyles.updateButton, isUpdating && { opacity: 0.7 }]}
            onPress={handleUpdateProfile}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={editProfileStyles.updateButtonText}>Update Profile</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity >
    </Modal >
  );
};

const editProfileStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8A2BE2',
    borderRadius: 18,
    padding: 8,
  },
  input: {
    width: '100%',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  updateButton: {
    width: '100%',
    backgroundColor: '#8A2BE2',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Change Password Modal Component (Refactored to Reset Link)
const ChangePasswordModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const userEmail = user?.email || '';

  const handleSendResetLink = async () => {
    if (!userEmail) {
      Alert.alert('Error', 'No email found for this user.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: 'https://weversity.org/reset-password',
      });

      if (error) throw error;

      Alert.alert('Success', `Password reset link sent to ${userEmail}`);
      onClose();
    } catch (error: any) {
      console.error('Reset Password Error:', error);
      Alert.alert('Error', error.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={changePasswordStyles.overlay}>
        <View style={changePasswordStyles.modalContent}>
          <TouchableOpacity style={changePasswordStyles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle-outline" size={28} color="#999" />
          </TouchableOpacity>
          <Text style={changePasswordStyles.modalTitle}>Reset Password</Text>

          <Text style={changePasswordStyles.description}>
            We will send a password reset link to your registered email address. Please follow the link to update your password on our website.
          </Text>

          <View style={changePasswordStyles.inputGroup}>
            <Ionicons name="mail-outline" size={20} color="#666" style={{ marginRight: 10 }} />
            <TextInput
              style={[changePasswordStyles.input, { color: '#666' }]}
              value={userEmail}
              editable={false}
              placeholder="Email Address"
            />
          </View>

          <TouchableOpacity
            style={changePasswordStyles.updateButton}
            onPress={handleSendResetLink}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={changePasswordStyles.updateButtonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const changePasswordStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  updateButton: {
    width: '100%',
    backgroundColor: '#8A2BE2',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { logout, user, profile, updateUser } = useAuth(); // Get logout function and optimistic updater from AuthContext

  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, [editProfileModalVisible]); // Refetch when modal closes to update UI

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfileData(data);
      }
    } catch (e) {
      console.error('Fetch profile error:', e);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Use profileData if available, fallback to user_metadata or context
  const firstName = profileData?.first_name || user?.user_metadata?.first_name;
  const lastName = profileData?.last_name || user?.user_metadata?.last_name;
  const fullName = firstName ? `${firstName} ${lastName || ''}`.trim() : (profile?.email?.split('@')[0] || 'User');
  const userEmail = user?.email || '';
  const avatarUrl = profileData?.avatar_url || user?.user_metadata?.avatar_url;

  // Calculate initials
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || (userEmail?.[0]?.toUpperCase() || 'U');


  const handleLogout = () => {
    setLogoutDialogVisible(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutDialogVisible(false);
    try {
      // Perform actual logout
      await logout();
      router.replace('/'); // Redirect to login/home after logout
    } catch (error) {
      console.error('[ProfileSettings] Logout Error:', error);
      // Even if it fails, try to redirect
      router.replace('/');
    }
  };




  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Main User Card */}
        <View style={styles.card}>
          <View style={styles.userInfoRow}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <Image
                source={(avatarUrl && avatarUrl.trim() !== '' && avatarUrl.startsWith('http'))
                  ? { uri: avatarUrl }
                  : { uri: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=8A2BE2&color=fff` }}
                style={styles.profilePic}
              />
            </View>
            <View style={styles.userInfoText}>
              <Text style={styles.userName}>{fullName}</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.actionButtonsRow}>
            {/* Removed My Contacts Button */}
            <TouchableOpacity style={styles.actionButton} onPress={() => setEditProfileModalVisible(true)}>
              <Ionicons name="create-outline" size={18} color="#fff" style={styles.btnIcon} />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Card */}
        <View style={styles.card}>
          <View style={styles.accountHeaderRow}>
            <View style={styles.accountLabelContainer}>
              <Ionicons name="settings-outline" size={20} color="#8A2BE2" style={{ marginRight: 8 }} />
              <Text style={styles.cardSectionTitle}>Account</Text>
            </View>
            <TouchableOpacity style={styles.changePasswordBtn} onPress={() => setChangePasswordModalVisible(true)}>
              <Text style={styles.changePasswordText}>Change Password</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.separator} />

          <View style={styles.accountActionsRow}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#8A2BE2" style={styles.btnIcon} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        visible={logoutDialogVisible}
        message="Are you sure you want to logout?"
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutDialogVisible(false)}
      />


      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editProfileModalVisible}
        onClose={() => setEditProfileModalVisible(false)}
        onRefresh={fetchProfile}
        initialData={{
          firstName: firstName,
          lastName: lastName,
          avatarUrl: avatarUrl,
          occupation: profileData?.occupation
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={changePasswordModalVisible}
        onClose={() => setChangePasswordModalVisible(false)}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 5 : 45,
    paddingBottom: 12,
    backgroundColor: '#8A2BE2',
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: 'transparent',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    marginRight: 15,
  },
  profilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  initialsAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3E5F5', // Light purple background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8A2BE2',
  },
  initialsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8A2BE2',
  },
  userInfoText: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#8A2BE2',
    paddingVertical: 10,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIcon: {
    marginRight: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  accountHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  changePasswordBtn: {
    borderWidth: 1,
    borderColor: '#8A2BE2',
    backgroundColor: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  changePasswordText: {
    fontSize: 12,
    color: '#8A2BE2',
    fontWeight: 'bold',
  },
  accountActionsRow: {
    flexDirection: 'row',
  },
  logoutBtn: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#8A2BE2',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#8A2BE2',
    fontWeight: 'bold',
    fontSize: 14,
  },

});