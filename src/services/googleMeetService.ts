import { supabase } from '../lib/supabase';

const WEVERSITY_LOGIC_API = 'https://weversity-logic.vercel.app/api/google/create-meet';

export const googleMeetService = {
    /**
     * Fetches the user's Google Calendar authorization status.
     * Prioritizes the backend API to check if refresh_token exists in DB.
     */
    async checkAuthorization() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return false;

            // 1. Check Backend API (Priority)
            const response = await fetch('https://weversity-logic.vercel.app/api/user/auth-status', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (response.ok) {
                const result = await response.json();
                if (result.isAuthorized) return true;
            }

            // 2. Fallback to Supabase Metadata (if API fails or returns false)
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            return !!user?.user_metadata?.google_calendar_token;
        } catch (error) {
            console.error('Error checking Google authorization:', error);
            return false;
        }
    },

    /**
     * Fetches live sessions from the live_sessions table for the current instructor.
     */
    async fetchSessions(instructorId: string) {
        try {
            const { data, error } = await supabase
                .from('live_sessions')
                .select('*')
                .eq('instructor_id', instructorId)
                .order('scheduled_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching live sessions:', error);
            throw error;
        }
    },

    /**
     * Schedules a new meeting via the external logic API.
     */
    async scheduleMeeting(title: string, scheduledAt: string, courseId: string | null) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session found');

            const response = await fetch(WEVERSITY_LOGIC_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    title,
                    scheduledAt,
                    courseId,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || result.message || 'Failed to create meeting');
            }

            return result;
        } catch (error) {
            console.error('Error scheduling meeting:', error);
            throw error;
        }
    },
    /**
     * Deletes a meeting session from the live_sessions table.
     */
    async deleteSession(sessionId: string) {
        try {
            const { error } = await supabase
                .from('live_sessions')
                .delete()
                .eq('id', sessionId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting live session:', error);
            throw error;
        }
    }
};
