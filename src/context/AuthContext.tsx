
import React, { createContext, useContext } from 'react';
import { logout as authLogout } from '../auth/logout';
import { useAuth as useSupabaseAuth } from '../auth/useAuth';
import { supabase } from '../auth/supabase';
import { registerForPushNotificationsAsync, savePushTokenToBackend } from '../services/pushNotifications';
import { coinService } from '../services/coinService';


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
  /**
   * Optimistically update the current auth user object (especially user_metadata)
   * without waiting for Supabase to emit a new auth event. This prevents
   * other screens from thinking a different user logged in and resetting UI.
   */
  updateUser: (patch: { user_metadata?: Record<string, any> } & Record<string, any>) => void;
  globalCoins: number;
  setGlobalCoins: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user: baseUser,
    profile,
    loading,
  } = useSupabaseAuth() as { user: any; profile: any; loading: boolean };

  /**
   * Local, optimistically synced copy of the auth user.
   * - Follows Supabase auth `user` when it changes id (real login/logout).
   * - Allows local metadata patches via `updateUser` without waiting on network.
   */
  const [localUser, setLocalUser] = React.useState<any | null>(baseUser ?? null);

  // Keep localUser in sync with Supabase auth user while preserving optimistic metadata when id is unchanged.
  React.useEffect(() => {
    setLocalUser((prev: any) => {
      if (!baseUser) return null;
      if (!prev || prev.id !== baseUser.id) {
        // New or different user session – trust Supabase completely.
        return baseUser;
      }
      // Same user id: merge metadata so optimistic updates are not blown away by slower network updates.
      return {
        ...baseUser,
        user_metadata: {
          ...(baseUser as any)?.user_metadata,
          ...(prev as any)?.user_metadata,
        },
      };
    });
  }, [baseUser]);

  // Register push token when localUser is updated and authenticates
  React.useEffect(() => {
    if (localUser?.id) {
      const handlePushTokenRegistration = async () => {
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await savePushTokenToBackend(localUser.id, token);
          }
        } catch (error) {
          console.error('[AuthContext] Push Token registration failed:', error);
        }
      };

      handlePushTokenRegistration();
    }
  }, [localUser?.id]);

  const user = localUser ?? baseUser;

  // Derived state
  const isAuthenticated = !!user;

  // Normalize role from profile or metadata
  // Supabase stores as 'student'/'instructor' (lowercase) usually, but app expects check
  const rawRole = profile?.role || user?.user_metadata?.role;
  const role: Role = rawRole ? (rawRole.charAt(0).toUpperCase() + rawRole.slice(1)) as Role : null;

  const [unreadCount, setUnreadCount] = React.useState(0);
  const [globalCoins, setGlobalCoins] = React.useState(0);

  // 0. Fetch initial coins balance & Setup Realtime 
  React.useEffect(() => {
    if (!user?.id) {
      setGlobalCoins(0);
      return;
    }

    // Initial Fetch
    coinService.getBalance(user.id).then(setGlobalCoins);

    // Setup Supabase Realtime Listener for true background updates (like web actions)
    const unsubscribe = coinService.subscribeToBalanceChanges(user.id, (newBalance) => {
      setGlobalCoins(newBalance);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  // 1. Fetch initial unread count
  React.useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchInitialCount = async () => {
      try {
        console.log('[AuthContext] Fetching unread count for user:', user.id);
        const { count, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact' }) // Minimal select
          .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
          .eq('read', false);

        if (error) {
           console.error('[AuthContext] Error fetching count:', JSON.stringify(error, null, 2));
           return;
        }

        if (count !== null) {
          console.log('[AuthContext] New Unread Count:', count);
          setUnreadCount(count);
        }
      } catch (err) {
        console.error('[AuthContext] Exception in fetchInitialCount:', err);
      }
    };

    fetchInitialCount();

    // 2. Real-time subscription
    let subscription: any;
    const setupRealtime = async () => {
      let retryCount = 0;
      try {
        console.log('[AuthContext] Setting up real-time listener for user:', user.id);
        
        subscription = supabase
          .channel(`notifications-global-${user.id}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'notifications',
              // Note: Supabase realtime filters don't support complex OR filters easily here.
              // We'll listen to all changes on the table and filter in the callback for recipient_id matches.
            },
            (payload: any) => {
              const record = payload.new || payload.old;
              if (record && (record.recipient_id === user.id || record.recipient_id === null)) {
                console.log('[AuthContext] Relevant notification change detected');
                fetchInitialCount();
              }
            }
          )
          .subscribe((status) => {
            console.log('[AuthContext] Notification subscription status:', status);
            if (status === 'SUBSCRIBED') {
              retryCount = 0; // reset
            } else if (status === 'TIMED_OUT') {
               const delay = Math.min(Math.pow(2, retryCount) * 1000, 30000);
               console.warn(`[AuthContext] Notification subscription TIMED_OUT. Retrying in ${delay/1000}s...`);
               setTimeout(() => {
                 retryCount++;
                 subscription.subscribe();
               }, delay);
            }
          });
      } catch (err) {
        console.error('[AuthContext] Error setting up realtime:', err);
      }
    };

    setupRealtime();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
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
    // Clear local optimistic copy; state updates automatically via listener in useAuth
    setLocalUser(null);
  };

  const updateUser = (patch: { user_metadata?: Record<string, any> } & Record<string, any>) => {
    setLocalUser((prev: any) => {
      if (!prev) return prev;

      const { user_metadata, ...restPatch } = patch;

      return {
        ...prev,
        ...restPatch,
        user_metadata: {
          ...(prev as any).user_metadata,
          ...(user_metadata || {}),
        },
      };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        isLoading: loading,
        user,
        profile,
        login,
        logout,
        unreadCount,
        setUnreadCount,
        updateUser,
        globalCoins,
        setGlobalCoins,
      }}
    >
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
