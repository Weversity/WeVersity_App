
import { supabase } from './supabase';

export const logout = async () => {
    try {
        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            // 2. Clear push token in DB (Logout Session Check)
            console.log('[auth/logout] Clearing push token for user:', user.id);
            await supabase
                .from('profiles')
                .update({ push_token: null })
                .eq('id', user.id);
        }

        // 3. Sign out
        await supabase.auth.signOut();
    } catch (error) {
        console.warn('[auth/logout] Handled error during signOut:', error.message);
    }
};
