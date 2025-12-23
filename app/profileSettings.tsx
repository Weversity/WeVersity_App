import { supabase } from '@/src/auth/supabase';
import { useAuth } from '@/src/context/AuthContext'; // Assuming AuthContext for logout
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


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
const EditProfileModal = ({ visible, onClose, initialData }: { visible: boolean; onClose: () => void; initialData: any }) => {
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [profileImage, setProfileImage] = useState(initialData?.profilePic || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setFirstName(initialData?.firstName || '');
      setLastName(initialData?.lastName || '');
      // setProfileImage(initialData?.profilePic); // Optional if dynamic
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

  const handleUpdateProfile = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }
      });

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
      onClose();
    } catch (error: any) {
      console.error('Update profile error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
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

          <TouchableOpacity style={editProfileStyles.profileImageContainer}>
            <Image source={{ uri: profileImage }} style={editProfileStyles.profileImage} />
            <View style={editProfileStyles.cameraIcon}>
              <Ionicons name="camera-outline" size={24} color="#fff" />
            </View>
          </TouchableOpacity>

          <TextInput
            style={editProfileStyles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholderTextColor="#666"
            editable={!isUpdating}
          />
          <TextInput
            style={editProfileStyles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
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
      </TouchableOpacity>
    </Modal>
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

// Change Password Modal Component
const ChangePasswordModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('New password and confirm password do not match.');
      return;
    }
    // In a real app, send data to backend
    console.log('Change Password:', { oldPassword, newPassword });
    onClose();
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={changePasswordStyles.overlay}>
        <View style={changePasswordStyles.modalContent}>
          <TouchableOpacity style={changePasswordStyles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle-outline" size={28} color="#999" />
          </TouchableOpacity>
          <Text style={changePasswordStyles.modalTitle}>Change Password</Text>

          <View style={changePasswordStyles.inputGroup}>
            <TextInput
              style={changePasswordStyles.input}
              placeholder="Old Password"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry={!showOldPassword}
              placeholderTextColor="#666"
            />
            <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} style={changePasswordStyles.toggleIcon}>
              <Ionicons name={showOldPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={changePasswordStyles.inputGroup}>
            <TextInput
              style={changePasswordStyles.input}
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              placeholderTextColor="#666"
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={changePasswordStyles.toggleIcon}>
              <Ionicons name={showNewPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={changePasswordStyles.inputGroup}>
            <TextInput
              style={changePasswordStyles.input}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholderTextColor="#666"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={changePasswordStyles.toggleIcon}>
              <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#999" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={changePasswordStyles.updateButton} onPress={handleChangePassword}>
            <Text style={changePasswordStyles.updateButtonText}>Update Password</Text>
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
    marginBottom: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  toggleIcon: {
    padding: 10,
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


export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { logout, user, profile } = useAuth(); // Get logout function from AuthContext

  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);

  const firstName = user?.user_metadata?.first_name;
  const lastName = user?.user_metadata?.last_name;
  const fullName = firstName ? `${firstName} ${lastName || ''}`.trim() : (profile?.email?.split('@')[0] || 'User');
  const userEmail = user?.email || '';

  // Calculate initials
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || (userEmail?.[0]?.toUpperCase() || 'U');


  const handleLogout = () => {
    setLogoutDialogVisible(true);
  };

  const handleConfirmLogout = () => {
    setLogoutDialogVisible(false);
    // Perform actual logout
    logout();
    router.replace('/'); // Redirect to login/home after logout
  };

  const handleDeleteAccount = () => {
    setDeleteDialogVisible(true);
  };

  const handleConfirmDeleteAccount = () => {
    setDeleteDialogVisible(false);
    // Perform actual account deletion
    console.log('Account Deleted');
    logout(); // Log out after deleting account
    router.replace('/'); // Redirect to login/home
  };


  return (
    <SafeAreaView style={styles.container}>
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
              <View style={styles.initialsAvatar}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
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
            <View style={{ width: 15 }} />
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
              <Ionicons name="trash-outline" size={18} color="#fff" style={styles.btnIcon} />
              <Text style={styles.deleteText}>Delete</Text>
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
      <ConfirmationDialog
        visible={deleteDialogVisible}
        message="Are you sure you want to delete your account?"
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setDeleteDialogVisible(false)}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editProfileModalVisible}
        onClose={() => setEditProfileModalVisible(false)}
        initialData={{ firstName, lastName, profilePic: null }} // Passing null for pic as we don't have it yet
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={changePasswordModalVisible}
        onClose={() => setChangePasswordModalVisible(false)}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 5 : 45,
    paddingBottom: 5,
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
    fontSize: 18,
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
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E74C3C',
    paddingVertical: 10,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});