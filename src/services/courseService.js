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
                .limit(10);

            if (error) {
                console.error('Error in fetchPublishedCourses:', error.message);
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    },

    // Fetch course by ID with retry logic
    async fetchCourseById(id, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const { data, error } = await supabase
                    .from('courses')
                    .select(`
                        id,
                        title,
                        description,
                        course_content,
                        image_url,
                        instructor:profiles(first_name, last_name, avatar_url)
                    `)
                    .eq('id', id)
                    .single();

                if (error) {
                    // Handle PGRST002: Could not query the database for the schema cache
                    if (error.code === 'PGRST002') {
                        console.error(`Error in fetchCourseById (Attempt ${i + 1}/${retries}): Database schema cache error (PGRST002). This often requires a PostgREST schema reload.`);
                        if (i === retries - 1) {
                            throw new Error('Database schema cache error. Please contact support or try reloading the schema.');
                        }
                    } else if (error.code === 'PGRST116') { // "Fetched result contains 0 rows"
                        throw new Error('Course not found');
                    } else {
                        console.error(`Error in fetchCourseById (Attempt ${i + 1}/${retries}):`, error.message);
                    }

                    if (i === retries - 1) throw error; // Throw last error
                    await new Promise(res => setTimeout(res, 1000)); // Wait 1s before retrying
                    continue;
                }

                return data;

            } catch (error) {
                if (i === retries - 1) {
                    console.error("Final attempt failed for fetchCourseById:", error);
                    throw error;
                }
            }
        }
    }
};