import { supabase } from '../lib/supabase';

// Environment variable safety check
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
    console.warn('liveSessionService: EXPO_PUBLIC_SUPABASE_URL is not defined. Network requests will fail.');
}

export const liveSessionService = {
    // Fetch upcoming classes
    async fetchUpcomingClasses() {
        try {
            const { data, error } = await supabase
                .from('live_sessions')
                .select(`
                  *,
                  course:courses(
                    id,
                    title,
                    image_url,
                    categories,
                    instructor:profiles(first_name, last_name, avatar_url)
                  )
                `)
                .gte('scheduled_at', new Date().toISOString())
                .order('scheduled_at', { ascending: true });

            if (error) throw error;

            console.log('--- Live Session Service ---');
            console.log('Fetched Upcoming Classes Count:', data ? data.length : 0);
            console.log('Fetched Data:', JSON.stringify(data, null, 2));

            return data;
        } catch (error) {
            console.error('Error in fetchUpcomingClasses:', error.message);
            throw error;
        }
    },

    // Fetch active or recently started live sessions
    async fetchActiveLiveSessions() {
        try {
            const { data, error } = await supabase
                .from('live_sessions')
                .select(`
                  id,
                  status,
                  scheduled_at,
                  google_meet_url,
                  course_id,
                  course:courses(
                    id,
                    title,
                    image_url,
                    categories,
                    instructor:profiles(
                      id,
                      first_name,
                      last_name,
                      avatar_url
                    )
                  )
                `)
                .in('status', ['live', 'upcoming']);

            if (error) {
                console.error('Error in fetchActiveLiveSessions:', error.message);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Error in fetchActiveLiveSessions caught:', error.message);
            throw error;
        }
    }
};
