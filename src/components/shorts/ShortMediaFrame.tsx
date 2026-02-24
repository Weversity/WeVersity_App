import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ShortMediaFrameProps {
    children: React.ReactNode;
    containerWidth: number;
    containerHeight: number;
}

/**
 * ShortMediaFrame 
 * Maintains a strict 9:16 aspect ratio container centered within its parent.
 * Ensures media never crops or stretches by using a "contain" behavior for the frame itself.
 */
export default function ShortMediaFrame({
    children,
    containerWidth,
    containerHeight,
}: ShortMediaFrameProps) {
    // Standard Shorts/TikTok aspect ratio
    const targetRatio = 9 / 16;
    const containerRatio = containerWidth / containerHeight;

    let frameWidth, frameHeight;

    // Logic: Scale to MAX possible size without cropping or stretching
    if (containerRatio > targetRatio) {
        // Container is wider than 9:16 (e.g. iPad, landscape phone)
        // Height is the limiting factor
        frameHeight = containerHeight;
        frameWidth = containerHeight * targetRatio;
    } else {
        // Container is taller than 9:16 (e.g. modern tall Android/iPhone)
        // Width is the limiting factor
        frameWidth = containerWidth;
        frameHeight = containerWidth / targetRatio;
    }

    return (
        <View style={[styles.outerContainer, { width: containerWidth, height: containerHeight }]}>
            {/* 9:16 Frame Container */}
            <View style={[styles.innerFrame, { width: frameWidth, height: frameHeight }]}>
                {children}
            </View>

            {/* Cinematic Top Overlay (Safe Area Header Space) */}
            <LinearGradient
                colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'transparent']}
                style={styles.topOverlay}
                pointerEvents="none"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    innerFrame: {
        backgroundColor: 'black',
        overflow: 'hidden',
        position: 'relative',
    },
    topOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 140, // Height for safe area + some extra space for better UI visibility
        zIndex: 5,
    },
});
