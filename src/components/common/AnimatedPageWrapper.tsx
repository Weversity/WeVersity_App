import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, { SlideInRight } from 'react-native-reanimated';

interface AnimatedPageWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}

export const AnimatedPageWrapper: React.FC<AnimatedPageWrapperProps> = ({ 
  children, 
  style,
  delay = 0 
}) => {
  return (
    <Animated.View
      entering={SlideInRight.delay(delay).springify().damping(24).stiffness(120).mass(0.8)}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </Animated.View>
  );
};
