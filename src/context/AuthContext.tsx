import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Role = 'Student' | 'Instructor' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  role: Role;
  isLoading: boolean;
  login: (userRole: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('userRole') as Role;
        if (storedRole) {
          setRole(storedRole);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('Failed to load role from storage', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadRole();
  }, []);

  const login = async (userRole: Role) => {
    if (userRole) {
      try {
        await AsyncStorage.setItem('userRole', userRole);
        setRole(userRole);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Failed to save role to storage', e);
      }
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userRole');
      setRole(null);
      setIsAuthenticated(false);
    } catch (e) {
      console.error('Failed to clear role from storage', e);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, isLoading, login, logout }}>
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
