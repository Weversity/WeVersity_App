import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAPTICS_STORAGE_KEY = '@weversity_haptics_enabled';

// Global state for haptics, initialized to true
let isEnabled = true;

// Load initial state from storage
AsyncStorage.getItem(HAPTICS_STORAGE_KEY).then(val => {
  if (val !== null) {
    isEnabled = val === 'true';
  }
});

/**
 * HapticsService - Premium tactile feedback system.
 *
 * Haptic Design Philosophy:
 *   light()       → Subtle: search toggles, clear buttons
 *   medium()      → Solid: TAB SWITCHING, primary buttons — Strong iPhone-style click
 *   heavy()       → Strong: destructive actions, long-press
 *   refreshPull() → Heavy: pull-to-refresh trigger
 *   success()     → Double-tap feel: Shorts Like, enrollment, saves
 *   error()       → Triple buzz: Login failure, network errors
 *   warning()     → Single alert buzz: Validation warnings
 */
export const HapticsService = {
  /**
   * Update haptic preference and persist it
   */
  setHapticsEnabled: async (value: boolean) => {
    isEnabled = value;
    await AsyncStorage.setItem(HAPTICS_STORAGE_KEY, String(value));
  },

  /**
   * Check if haptics are currently enabled
   */
  getHapticsEnabled: () => isEnabled,

  /**
   * Light Impact: Best for tab switching, selection changes, or subtle UI interactions.
   */
  light: async () => {
    if (!isEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      // Silently fail on unsupported devices
    }
  },

  /**
   * Medium Impact: Best for button clicks (Enroll, Submit) or toggling switches.
   */
  medium: async () => {
    if (!isEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch (error) {
      // Silently fail
    }
  },

  /**
   * Heavy Impact: Best for destructive actions or long-press feedback.
   */
  heavy: async () => {
    if (!isEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch (_) {}
  },

  /**
   * Refresh Pull: Medium impact for pull-to-refresh. Tells the user "Got it, refreshing."
   */
  refreshPull: async () => {
    if (!isEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch (_) {}
  },

  /**
   * Success Notification: Best for payment confirmation, enrollment, or successful uploads.
   */
  success: async () => {
    if (!isEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      // Silently fail
    }
  },

  /**
   * Warning Notification: Best for validation alerts or cautionary messages.
   */
  warning: async () => {
    if (!isEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (error) {
      // Silently fail
    }
  },

  /**
   * Error Notification: Best for login failure, network errors, or failed transactions.
   */
  error: async () => {
    if (!isEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      // Silently fail
    }
  },

  /**
   * Selection Change: Best for scrolling through a picker or slider.
   */
  selection: async () => {
    if (!isEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      // Silently fail
    }
  }
};
