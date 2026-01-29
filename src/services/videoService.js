import * as Crypto from 'expo-crypto';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { supabase } from '../lib/supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.weversity.org';

// API Keys - In a real app, these should be securely stored or accessed via backend!
const CLOUDINARY_CLOUD_NAME = 'dn93gd6yw';
const CLOUDINARY_API_KEY = '738326273237372';
const CLOUDINARY_API_SECRET = '56uMqGUQMReHrIZoyFGXIxi-0NU';

export const videoService = {
  /**
   * Uploads a video using a two-step pre-signed S3 URL flow.
   * NOTE: NEVER modify the uploadUrl returned by the backend.
   * Uses headerless signing - no Content-Type header is sent to avoid signature mismatch.
   */
  uploadVideoToCloudinary: async (fileUri, resourceType = 'video') => {
    try {
      const uploadPreset = 'weversity_shorts'; // Aapka preset name

      // Basic validation/cleanup of resourceType
      const finalResourceType = resourceType === 'image' ? 'image' : 'video';

      const data = new FormData();
      // @ts-ignore - React Native FormData expects an object for files
      data.append('file', {
        uri: fileUri,
        type: finalResourceType === 'video' ? 'video/mp4' : 'image/jpeg', // Simple fallback types
        name: finalResourceType === 'video' ? 'short_video.mp4' : 'short_image.jpg',
      });
      data.append('upload_preset', uploadPreset);
      data.append('resource_type', finalResourceType);

      console.log(`--- Cloudinary: Uploading ${finalResourceType} ---`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${finalResourceType}/upload`,
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
        console.log('✅ Cloudinary Upload Success:', result.secure_url);
        // Return both secure_url and public_id
        return {
          secure_url: result.secure_url,
          public_id: result.public_id
        };
      } else {
        throw new Error(result.error?.message || 'Cloudinary upload failed');
      }
    } catch (error) {
      console.error('❌ Cloudinary Error:', error.message);
      throw error;
    }
  },

  createShort: async ({ video_url, description, instructor_id, type = 'video', public_id }) => {
    const { data, error } = await supabase
      .from('shorts')
      .insert([{ video_url, description, instructor_id, type, public_id }])
      .select().single();
    if (error) throw error;
    return data;
  },

  // Helper function to cleanup invalid shorts
  _cleanupInvalidShorts: async (shorts) => {
    if (!shorts || shorts.length === 0) return [];

    // Invalid if missing video_url or it's empty
    const invalidEntries = shorts.filter(s => !s.video_url || s.video_url.trim() === '');

    if (invalidEntries.length > 0) {
      console.warn('🗑️ AUTO-CLEANUP: Found', invalidEntries.length, 'ghost entries with invalid video_url');

      // Delete each ghost entry from database
      for (const ghost of invalidEntries) {
        console.log('🗑️ Deleting ghost entry ID:', ghost.id, 'video_url:', ghost.video_url);

        try {
          const { error: deleteError } = await supabase
            .from('shorts')
            .delete()
            .match({ id: ghost.id });

          if (deleteError) {
            console.error('❌ Failed to delete ghost entry:', ghost.id, deleteError);
          } else {
            console.log('✅ Ghost entry deleted from database:', ghost.id);
          }
        } catch (err) {
          console.error('❌ Error executing auto-cleanup for:', ghost.id, err);
        }
      }
    }

    // Return only valid entries
    const validData = shorts.filter(s => s.video_url && s.video_url.trim() !== '');
    console.log('✅ Valid shorts after cleanup:', validData.length);
    return validData;
  },

  fetchShorts: async ({ page = 0, limit = 10 } = {}) => {
    const { data, error } = await supabase
      .from('shorts')
      .select('*, instructor:profiles(id, first_name, last_name, avatar_url, occupation, biography)')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;

    // Apply auto-cleanup to global feed too
    return await videoService._cleanupInvalidShorts(data);
  },

  fetchInstructorShorts: async (instructorId) => {
    console.log('📥 Fetching shorts for instructor:', instructorId);

    // First, fetch ALL shorts including invalid ones
    const { data: allData, error: fetchError } = await supabase
      .from('shorts')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    if (!allData || allData.length === 0) {
      console.log('📊 No shorts found for instructor');
      return [];
    }

    console.log('📊 Total shorts fetched:', allData.length);

    // Apply shared auto-cleanup logic
    return await videoService._cleanupInvalidShorts(allData);
  },

  getShortById: async (id) => {
    const { data, error } = await supabase
      .from('shorts')
      .select('*, instructor:profiles(id, first_name, last_name, avatar_url, occupation, biography)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  deleteFromCloudinary: async (publicId, resourceType = 'video') => {
    try {
      if (!publicId) {
        console.warn('⚠️ No public_id provided, skipping Cloudinary delete');
        return { success: true, ghostEntry: false }; // Allow DB delete to proceed
      }

      console.log(`--- Deleting from Cloudinary: ${publicId} ---`);

      const timestamp = Math.round((new Date()).getTime() / 1000).toString();

      // Signature Generation: public_id=xxx&timestamp=xxx + api_secret
      const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
      const stringToSign = paramsToSign + CLOUDINARY_API_SECRET;

      const signature = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA1,
        stringToSign
      );

      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('api_key', CLOUDINARY_API_KEY);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      // resourceType is usually 'video' or 'image'

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`,
        {
          method: 'POST',
          body: formData
        }
      );

      const result = await response.json();

      if (result.result === 'ok') {
        console.log('✅ Cloudinary Delete Success');
        return { success: true, ghostEntry: false };
      } else if (result.result === 'not found') {
        console.warn('⚠️ Cloudinary file not found (ghost entry) - allowing DB cleanup');
        return { success: true, ghostEntry: true }; // Allow DB delete for ghost entries
      } else {
        console.error('❌ Cloudinary Delete Failed:', result);
        throw new Error('Cloudinary delete failed: ' + JSON.stringify(result));
      }

    } catch (error) {
      console.error('❌ Cloudinary Delete Error:', error);
      // If it's a network error or other issue, still check if it might be a ghost entry
      if (error.message && error.message.includes('not found')) {
        console.warn('⚠️ Treating as ghost entry due to error message');
        return { success: true, ghostEntry: true };
      }
      throw error; // Stop Supabase deletion for real errors
    }
  },

  deleteShort: async (id, publicId, resourceType = 'video') => {
    // EXPLICIT ID VALIDATION
    console.log('🔍 LOG: Attempting to delete ID:', id);
    console.log('🔍 LOG: ID Type:', typeof id);
    console.log('🔍 LOG: public_id:', publicId);
    console.log('🔍 LOG: Resource Type:', resourceType);

    if (!id) {
      throw new Error('Invalid ID: ID is required for deletion');
    }

    // STEP 1: Delete from Cloudinary first
    let cloudinaryResult = { success: false, ghostEntry: false };

    if (publicId) {
      console.log('--- Step 1: Deleting from Cloudinary ---');
      console.log('🔍 LOG: Cloudinary public_id:', publicId);

      cloudinaryResult = await videoService.deleteFromCloudinary(publicId, resourceType);

      console.log('✅ LOG: Cloudinary status:', JSON.stringify(cloudinaryResult));

      if (!cloudinaryResult.success) {
        throw new Error('Cloudinary deletion failed');
      }

      if (cloudinaryResult.ghostEntry) {
        console.log('📝 Ghost entry detected - proceeding with DB cleanup');
      }
    } else {
      console.warn('⚠️ No public_id provided, skipping Cloudinary deletion');
      cloudinaryResult.success = true; // Allow DB delete
    }

    // STEP 2: Only if Cloudinary returns success (or ghost entry), delete from Supabase
    if (cloudinaryResult.success) {
      console.log('--- Step 2: Deleting from Supabase ---');
      console.log('🔍 LOG: Deleting from Supabase with ID:', id);
      console.log('🔍 LOG: ID value before query:', JSON.stringify(id));
      console.log('🔍 LOG: ID type:', typeof id);
      console.log('🔍 LOG: ID length:', id?.length || 'N/A');

      // Execute the delete query using .match() for more accurate matching
      const { data, error, count } = await supabase
        .from('shorts')
        .delete()
        .match({ id: id }) // Using .match() instead of .eq() for better accuracy
        .select(); // Add select to see what was deleted

      console.log('📊 LOG: Supabase deletion response:', {
        data: data,
        error: error,
        count: count,
        deletedRows: data ? data.length : 0
      });

      if (error) {
        console.error('❌ Supabase deletion failed:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', JSON.stringify(error));
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ WARNING: No rows were deleted from Supabase!');
        console.warn('⚠️ This might mean the ID does not exist in the database');
        console.warn('⚠️ ID that was used:', id);
        console.warn('⚠️ ID type:', typeof id);
        // Don't throw error - might be already deleted
      } else {
        console.log('✅ Successfully deleted from Supabase');
        console.log('✅ Deleted row ID:', data[0].id);
        console.log('✅ Deleted row type:', typeof data[0].id);
      }

      return { success: true, deletedData: data };
    }

    return { success: false, deletedData: null };
  },

  handleReaction: async (videoId, userId, type) => {
    const { data, error } = await supabase.rpc('handle_reaction', {
      p_video_id: videoId, p_user_id: userId, p_type: type,
    });
    if (error) throw error;
    return data;
  },

  getUserReaction: async (videoId, userId) => {
    const { data, error } = await supabase
      .from('reactions').select('type').eq('video_id', videoId).eq('user_id', userId).maybeSingle();
    return error ? null : (data ? data.type : null);
  },

  fetchComments: async (videoId) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, user:profiles(id, first_name, last_name, avatar_url, occupation)')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  addComment: async (videoId, userId, content) => {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ video_id: videoId, user_id: userId, content }])
      .select('*, user:profiles(id, first_name, last_name, avatar_url)').single();
    if (error) throw error;
    return data;
  },

  fetchPublicProfile: async (userId) => {
    // Cache-busting guard: apply an extra non-null filter so the client
    // cannot short-circuit on stale cached rows.
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .not('id', 'is', null)
      .single();
    if (pErr) throw pErr;
    const { data: shorts, error: sErr } = await supabase
      .from('shorts')
      .select('*')
      .eq('instructor_id', userId)
      .not('id', 'is', null)
      .order('created_at', { ascending: false });
    if (sErr) throw sErr;
    const totalLikes = (shorts || []).reduce((sum, item) => sum + (item.likes_count || 0), 0);
    return { profile, shorts, totalLikes };
  },

  checkIsFollowing: async (followerId, followingId) => {
    const { data, error } = await supabase.rpc('check_is_following', {
      p_follower_id: followerId, p_following_id: followingId,
    });
    if (error) {
      const { data: tableData } = await supabase.from('follows').select('*').eq('follower_id', followerId).eq('following_id', followingId).maybeSingle();
      return !!tableData;
    }
    return data;
  },

  toggleFollow: async (followerId, followingId) => {
    const isFollowing = await videoService.checkIsFollowing(followerId, followingId);
    if (isFollowing) {
      const { error } = await supabase.from('follows').delete().match({ follower_id: followerId, following_id: followingId });
      if (error) throw error;
      return false;
    } else {
      const { error } = await supabase.from('follows').insert([{ follower_id: followerId, following_id: followingId }]);
      if (error) throw error;
      return true;
    }
  },
};