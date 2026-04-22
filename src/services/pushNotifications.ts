import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../auth/supabase'; // Assuming Supabase is used for backend based on auth context

/**
 * Ensures that notifications display while the app is in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Helper to handle errors during push token registration
 */
function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

/**
 * Requests permissions and generates the Expo Push Token for the device.
 * It also sets up the Android Notification Channel.
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8A2BE2',
    });
  }

  if (!Device.isDevice) {
    console.log('Must use physical device for push notifications');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    handleRegistrationError('Permission not granted to get push token for push notification!');
    return;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

  if (!projectId) {
    handleRegistrationError('Project ID not found');
    return;
  }

  try {
    console.log(`[PushService] Getting Expo Push Token for projectId: ${projectId}`);
    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    console.log('[PushService] Genereated Push Token:', pushTokenString);
    console.log(`Expo Push Token: ${pushTokenString}`);
    return pushTokenString;
  } catch (e: unknown) {
    handleRegistrationError(`${e}`);
  }
}

/**
 * Saves the token to the backend for the given user.
 * Weversity uses Supabase; we'll assume a `profiles` or similar table update.
 * Adjust the table/column name as necessary if it differs.
 */
export async function savePushTokenToBackend(userId: string, token: string) {
  try {
    console.log(`[PushService] Saving push token for user ${userId} to backend...`);
    
    // Example: Updating the profiles table with the push token
    // You might need to adjust 'profiles' or 'push_token' based on your actual database schema
    const { error, data } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('[PushService] Error saving push token to DB:', error);
      return false;
    }
    
    if (data && data.length === 0) {
       console.error(`[PushService] Failed: User with ID ${userId} not found in profiles table.`);
       return false;
    }

    console.log(`[PushService] Successfully saved push token for user ${userId}. DB Confirmed.`);
    return true;
  } catch (err) {
    console.error('[PushService] Exception in savePushTokenToBackend:', err);
    return false;
  }
}
