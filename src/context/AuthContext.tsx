
import React, { createContext, useContext } from 'react';
import { logout as authLogout } from '../auth/logout';
import { useAuth as useSupabaseAuth } from '../auth/useAuth';


// Redefine Role locally if needed or keep using string
export type Role = 'Student' | 'Instructor' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  role: Role;
  isLoading: boolean;
  user: any;
  profile: any;
  login: (userRole: Role) => void; // Kept for compatibility but should rely on session
  logout: () => void;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useSupabaseAuth() as { user: any; profile: any; loading: boolean };

  // Derived state
  const isAuthenticated = !!user;

  // Normalize role from profile or metadata
  // Supabase stores as 'student'/'instructor' (lowercase) usually, but app expects check
  const rawRole = profile?.role || user?.user_metadata?.role;
  const role: Role = rawRole ? (rawRole.charAt(0).toUpperCase() + rawRole.slice(1)) as Role : null;

  const [unreadCount, setUnreadCount] = React.useState(0);

  // 1. Fetch initial unread count
  React.useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchInitialCount = async () => {
      try {
        const { supabase } = await import('../auth/supabase');
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false); // FIXED: Only count unread

        if (!error && count !== null) {
          setUnreadCount(count);
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchInitialCount();

    // 2. Real-time subscription
    let subscription: any;
    const setupRealtime = async () => {
      const { supabase } = await import('../auth/supabase');
      subscription = supabase
        .channel(`unread-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT', // Listen only to INSERT
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setUnreadCount((prev) => prev + 1);
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (subscription) {
        import('../auth/supabase').then(({ supabase }) => {
          supabase.removeChannel(subscription);
        });
      }
    };
  }, [user]);

  const login = (userRole: Role) => {
    // This is now largely a no-op for state, as the session change triggers updates
    // But we can keep it if components expect to call it manually, 
    // though AuthForm calls native supabase login which triggers the listener.
  };

  const logout = async () => {
    await authLogout();
    setUnreadCount(0);
    // State updates automatically via listener in useAuth
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, isLoading: loading, user, profile, login, logout, unreadCount, setUnreadCount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
