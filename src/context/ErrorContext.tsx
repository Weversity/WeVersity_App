import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface ErrorContextType {
    isMaintenance: boolean;
    errorType: 'network' | 'server' | null;
    triggerError: (error: any) => void;
    clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

let globalTriggerError: (error: any) => void = () => {
    console.warn('ErrorProvider not yet initialized');
};

export const useError = () => {
    const context = useContext(ErrorContext);
    if (!context) throw new Error('useError must be used within ErrorProvider');
    return context;
};

export { globalTriggerError };

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMaintenance, setIsMaintenance] = useState(false); // Default to false (normal mode)
    const [errorType, setErrorType] = useState<'network' | 'server' | null>(null);

    // Real-Time Network Detection via NetInfo
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            console.log('[NetInfo] Connection State Changed:', state.isConnected);

            if (state.isConnected === false) {
                // Device went offline
                setErrorType('network');
                setIsMaintenance(true);
            } else if (state.isConnected === true && errorType === 'network') {
                // Device came back online and we were in network error mode
                setIsMaintenance(false);
                setErrorType(null);
            }
        });

        return () => unsubscribe();
    }, [errorType]);

    const triggerError = (error: any) => {
        console.error('[GlobalError] Triggered:', error);
        
        // Logical detection of error type
        const errorMessage = error?.message?.toLowerCase() || '';
        const isNetworkError = 
            errorMessage.includes('network request failed') || 
            errorMessage.includes('failed to fetch') ||
            errorMessage.includes('no internet');

        if (isNetworkError) {
            setErrorType('network');
        } else {
            setErrorType('server');
        }
        
        setIsMaintenance(true);
    };

    const clearError = () => {
        setIsMaintenance(false);
        setErrorType(null);
    };

    // Assign to global variable for non-component usage
    globalTriggerError = triggerError;

    return (
        <ErrorContext.Provider value={{ isMaintenance, errorType, triggerError, clearError }}>
            {children}
        </ErrorContext.Provider>
    );
};
