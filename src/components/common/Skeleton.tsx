import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    withSequence,
    Easing
} from 'react-native-reanimated';

interface SkeletonProps {
    width: number | string;
    height: number | string;
    borderRadius?: number;
    style?: StyleProp<ViewStyle>;
}

export const Skeleton = ({ width, height, borderRadius = 4, style }: SkeletonProps) => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
            ),
            -1, // Infinite repeat
            true // Reverse
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width: width as any,
                    height: height as any,
                    borderRadius,
                },
                animatedStyle,
                style,
            ]}
        />
    );
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#E1E9EE',
    },
});
