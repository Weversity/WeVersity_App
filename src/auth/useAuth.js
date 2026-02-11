
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
                // Race getSession with a timeout
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Session timeout')), 7000)
                );

                const { data, error } = await Promise.race([sessionPromise, timeoutPromise]);
                if (error) throw error;

                if (mounted) {
                    if (data?.session) {
                        setUser(data.session.user);
                        // Also race profile fetch
                        await Promise.race([
                            fetchProfile(data.session),
                            new Promise(resolve => setTimeout(resolve, 5000))
                        ]);
                    } else {
                        setUser(null);
                        setProfile(null);
                    }
                }
            } catch (error) {
                console.warn('[useAuth] Session init error/timeout:', error);
                // Only sign out if it wasn't a timeout (optional, but safer to leave alone if just slow)
                // But if we timed out, likely offline or generic error.
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

            console.log(`[useAuth] Auth state change: ${event}`);

            if (session?.user) {
                setUser(session.user);
                // Race profile fetch so we don't hang loading state
                await Promise.race([
                    fetchProfile(session),
                    new Promise(resolve => setTimeout(resolve, 5000))
                ]);
            } else {
                setUser(null);
                setProfile(null);
            }

            // Ensure loading is false after any auth change
            if (mounted) setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return { user, profile, loading };
};
