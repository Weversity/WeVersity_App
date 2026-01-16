
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
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    console.warn('[useAuth] Session init error:', error.message);
                    throw error;
                }

                const session = data?.session;

                if (mounted) {
                    if (session) {
                        setUser(session.user);
                        await fetchProfile(session);
                    } else {
                        // No session, ensure we are clean
                        setUser(null);
                        setProfile(null);
                    }
                }
            } catch (err) {
                console.warn('[useAuth] Session check failed. Clearing stale data to fix PGRST301/Loops.', err);

                // CRITICAL FIX: Force sign out to clear Async Storage and reset 'supabase-js' state
                await supabase.auth.signOut().catch(() => { });

                if (mounted) {
                    setUser(null);
                    setProfile(null);
                }
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
