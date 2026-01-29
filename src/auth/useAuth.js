
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
                const { data, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (mounted) {
                    if (data?.session) {
                        setUser(data.session.user);
                        await fetchProfile(data.session);
                    } else {
                        setUser(null);
                        setProfile(null);
                    }
                }
            } catch (error) {
                console.warn('[useAuth] Session init error:', error);
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

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            // Ignore USER_UPDATED events to prevent global reloads on profile changes
            if (event === 'USER_UPDATED') {
                return;
            }

            if (session?.user) {
                setUser(session.user);
                await fetchProfile(session);
            } else {
                setUser(null);
                setProfile(null);
            }

            // Ensure loading is false after any auth change
            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return { user, profile, loading };
};
