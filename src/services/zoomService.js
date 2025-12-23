import { supabase } from '../lib/supabase';

export const zoomService = {
    /**
     * Initiate Zoom OAuth flow via Edge Function
     */
    initiateAuth: async () => {
        const { data, error } = await supabase.functions.invoke('zoom-auth-initiate');

        if (error) {
            console.error('Error initiating Zoom auth:', error);
            throw error;
        }
        return data;
    },

    /**
     * Create a new Zoom meeting via Edge Function
     */
    createMeeting: async (title, scheduledAt, courseId) => {
        const { data, error } = await supabase.functions.invoke('create-zoom-meeting', {
            body: {
                title,
                scheduledAt,
                courseId
            }
        });

        if (error) {
            console.error('Error creating Zoom meeting:', error);
            throw error;
        }
        return data;
    }
};
