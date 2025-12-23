import { supabase } from '../lib/supabase';

// Environment variable safety check
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
    console.warn('courseService: EXPO_PUBLIC_SUPABASE_URL is not defined. Network requests will fail.');
}

export const courseService = {
    // Fetch all published courses
    async fetchPublishedCourses() {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('id, title, image_url, price, categories, instructor:profiles(first_name)')
                .eq('is_published', true)
                .order('created_at', { ascending: false })
                .limit(10); // Limit to 10 courses

            if (error) {
                console.error('Error in fetchPublishedCourses:', error.message);
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    },

    // Fetch course by ID
    async fetchCourseById(id) {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select(`*, instructor:profiles(first_name, last_name, avatar_url)`)
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error in fetchCourseById:', error.message);
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    }
};