import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { supabase } from '../lib/supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.weversity.org';

export const videoService = {
  /**
   * Uploads a video using a two-step pre-signed S3 URL flow.
   * NOTE: NEVER modify the uploadUrl returned by the backend.
   * Uses headerless signing - no Content-Type header is sent to avoid signature mismatch.
   */
  uploadVideoToCloudinary: async (fileUri) => {
    try {
      const cloudName = 'dn93gd6yw'; // Aapka cloud name
      const uploadPreset = 'weversity_shorts'; // Aapka preset name

      const data = new FormData();
      // @ts-ignore - React Native FormData expects an object for files
      data.append('file', {
        uri: fileUri,
        type: 'video/mp4',
        name: 'short_video.mp4',
      });
      data.append('upload_preset', uploadPreset);
      data.append('resource_type', 'video');

      console.log('--- Cloudinary: Uploading Video ---');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
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
        return result.secure_url; // Ye URL hum Supabase mein save karenge
      } else {
        throw new Error(result.error?.message || 'Cloudinary upload failed');
      }
    } catch (error) {
      console.error('❌ Cloudinary Error:', error.message);
      throw error;
    }
  },

  createShort: async ({ video_url, description, instructor_id }) => {
    const { data, error } = await supabase
      .from('shorts')
      .insert([{ video_url, description, instructor_id }])
      .select().single();
    if (error) throw error;
    return data;
  },

  fetchShorts: async ({ page = 0, limit = 10 } = {}) => {
    const { data, error } = await supabase
      .from('shorts')
      .select('*, instructor:profiles(id, first_name, last_name, avatar_url)')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    if (error) throw error;
    return data;
  },

  fetchInstructorShorts: async (instructorId) => {
    const { data, error } = await supabase
      .from('shorts')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  deleteShort: async (id) => {
    const { error } = await supabase.from('shorts').delete().eq('id', id);
    if (error) throw error;
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
      .select('*, user:profiles(id, first_name, last_name, avatar_url, role)')
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
    const { data: profile, error: pErr } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (pErr) throw pErr;
    const { data: shorts, error: sErr } = await supabase.from('shorts').select('*').eq('instructor_id', userId).order('created_at', { ascending: false });
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
      await supabase.from('follows').delete().match({ follower_id: followerId, following_id: followingId });
      return false;
    } else {
      await supabase.from('follows').insert([{ follower_id: followerId, following_id: followingId }]);
      return true;
    }
  },
};