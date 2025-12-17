
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

  const login = (userRole: Role) => {
    // This is now largely a no-op for state, as the session change triggers updates
    // But we can keep it if components expect to call it manually, 
    // though AuthForm calls native supabase login which triggers the listener.
  };

  const logout = async () => {
    await authLogout();
    // State updates automatically via listener in useAuth
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, isLoading: loading, user, profile, login, logout }}>
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
