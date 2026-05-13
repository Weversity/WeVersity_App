import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useError } from '@/src/context/ErrorContext';

interface IntegratedMaintenanceProps {
    onRetry?: () => void;
}

const IntegratedMaintenance: React.FC<IntegratedMaintenanceProps> = ({ onRetry }) => {
    const { errorType, clearError } = useError();
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start();
    }, []);

    const isNetwork = errorType === 'network';

    const handleRetry = () => {
        if (onRetry) {
            onRetry();
        } else {
            clearError();
        }
    };

    return (
        <Animated.View style={[styles.outerContainer, { opacity: fadeAnim }]}>
            <View style={styles.container}>
                {/* Illustration */}
                <View style={styles.illustrationContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons
                            name={isNetwork ? 'cloud-offline-outline' : 'construct-outline'}
                            size={52}
                            color="#8A2BE2"
                        />
                    </View>
                </View>

                {/* Text Content */}
                <Text style={styles.title}>
                    {isNetwork ? 'No Internet Connection' : 'Server Under Maintenance'}
                </Text>
                <Text style={styles.subtitle}>
                    {isNetwork
                        ? 'Please check your connection and try again.'
                        : 'We are improving your experience. Please check back shortly.'}
                </Text>

                {/* Retry Button */}
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
                    <Text style={styles.retryButtonText}>
                        {isNetwork ? 'Try Again' : 'Refresh'}
                    </Text>
                </TouchableOpacity>

                {/* Footer */}
                <Text style={styles.footerText}>WeVersity • Learning Platform</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    illustrationContainer: {
        marginBottom: 32,
    },
    iconCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#F3E5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E1BEE7',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1A1A2E',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 36,
        maxWidth: 280,
    },
    retryButton: {
        backgroundColor: '#8A2BE2',
        paddingVertical: 14,
        paddingHorizontal: 48,
        borderRadius: 30,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
        marginBottom: 40,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    footerText: {
        fontSize: 11,
        color: '#BDBDBD',
        letterSpacing: 0.5,
        position: 'absolute',
        bottom: 30,
    },
});

export default IntegratedMaintenance;
