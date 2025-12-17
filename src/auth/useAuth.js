
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (currentSession) => {
        if (!currentSession?.user) {
            setProfile(null);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentSession.user.id)
                .single();

            if (!error && data) {
                setProfile(data);
            } else {
                // Determine role from metadata if profile fetch fails or doesn't exist yet
                // This covers the edge case where the trigger hasn't finished running
                const metaRole = currentSession.user.user_metadata?.role;
                setProfile({
                    id: currentSession.user.id,
                    role: metaRole,
                    email: currentSession.user.email
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                // Check active session on mount
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted) {
                    setUser(session?.user ?? null);
                    if (session) {
                        await fetchProfile(session);
                    }
                }
            } catch (err) {
                console.error("Auth init error:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (mounted) {
                setUser(session?.user ?? null);
                setLoading(true); // Show loading while fetching profile
                await fetchProfile(session);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return { user, profile, loading };
};
