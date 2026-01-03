
import { supabase } from './supabase';

export const logout = async () => {
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.warn('[auth/logout] Handled error during signOut:', error.message);
    }
};
