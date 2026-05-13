import React from 'react';
import { TextProps, TextStyle, StyleProp } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface AnimatedHeaderProps extends TextProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  delay?: number;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({ 
  children, 
  style, 
  delay = 100,
  ...props 
}) => {
  return (
    <Animated.Text
      entering={FadeInUp.delay(delay).duration(500).springify().damping(20).stiffness(100)}
      style={style}
      {...props}
    >
      {children}
    </Animated.Text>
  );
};
