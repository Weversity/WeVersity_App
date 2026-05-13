import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useError } from '@/src/context/ErrorContext';
import IntegratedMaintenance from './IntegratedMaintenance';

interface StatefulPageProps {
    children: React.ReactNode;
    onRetry?: () => void;
}

/**
 * StatefulPage: A wrapper component that swaps its children with the
 * IntegratedMaintenance screen when the app is in maintenance mode.
 * This preserves the header and bottom tabs, showing maintenance
 * only in the content area.
 */
const StatefulPage: React.FC<StatefulPageProps> = ({ children, onRetry }) => {
    const { isMaintenance } = useError();

    if (isMaintenance) {
        return (
            <View style={styles.container}>
                <IntegratedMaintenance onRetry={onRetry} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1, // Full height, no background color override
    },
});

export default StatefulPage;
