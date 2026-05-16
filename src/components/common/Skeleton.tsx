import React from 'react';
import { StyleSheet, ViewStyle, StyleProp, View } from 'react-native';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: StyleProp<ViewStyle>;
    color?: string;
    children?: React.ReactNode;
}

export const Skeleton = ({ width, height, borderRadius = 4, style, color, children }: SkeletonProps) => {
    return (
        <View
            style={[
                styles.skeleton,
                width !== undefined && { width: width as any },
                height !== undefined && { height: height as any },
                { borderRadius },
                color ? { backgroundColor: color } : {},
                style,
            ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
});
