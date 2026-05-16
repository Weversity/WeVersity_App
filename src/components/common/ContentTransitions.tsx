import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  FadeInLeft, 
  FadeInRight, 
  ZoomIn,
  Layout
} from 'react-native-reanimated';

/**
 * Standard Apple-style Spring Configuration
 * Damping: 20 (Smooth bounce)
 * Stiffness: 120 (Responsive start)
 */
const APPLE_SPRING = {
  damping: 26, // High damping for professional "smoothness" without bounce
  stiffness: 120,
  mass: 0.8,
};

interface TransitionProps {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * AnimatedHeader: Elements fade in and slide UP from +50px.
 * Dramatic entrance for titles.
 */
export const AnimatedHeaderView: React.FC<TransitionProps> = ({ children, delay = 0, style }) => (
  <Animated.View
    entering={FadeInDown.delay(delay).springify().damping(12).stiffness(100).mass(1)}
    style={style}
  >
    {children}
  </Animated.View>
);

/**
 * AnimatedBody: Elements fade in and slide from the LEFT.
 * Best for description text, bullets, and cards.
 */
export const AnimatedBodyView: React.FC<TransitionProps> = ({ children, delay = 0, style }) => (
  <Animated.View
    entering={FadeInLeft.delay(delay).springify().damping(APPLE_SPRING.damping).stiffness(APPLE_SPRING.stiffness).mass(APPLE_SPRING.mass)}
    style={style}
  >
    {children}
  </Animated.View>
);

/**
 * AnimatedCard: Elements fade in and slide from the RIGHT.
 * Good for secondary info or alternate list items.
 */
export const AnimatedCardView: React.FC<TransitionProps> = ({ children, delay = 0, style }) => (
  <Animated.View
    entering={FadeInRight.delay(delay).springify().damping(APPLE_SPRING.damping).stiffness(APPLE_SPRING.stiffness).mass(APPLE_SPRING.mass)}
    style={style}
  >
    {children}
  </Animated.View>
);

/**
 * AnimatedPop: Elements zoom in from center.
 * Best for icons, buttons, or reward highlights.
 */
export const AnimatedPopView: React.FC<TransitionProps> = ({ children, delay = 0, style }) => (
  <Animated.View
    entering={ZoomIn.delay(delay).springify().damping(APPLE_SPRING.damping).stiffness(APPLE_SPRING.stiffness).mass(APPLE_SPRING.mass)}
    style={style}
  >
    {children}
  </Animated.View>
);

/**
 * StaggerContainer: Automatically applies incremental delays to children.
 * Usage: 
 * <StaggerContainer interval={100}>
 *    <AnimatedBodyView>Item 1</AnimatedBodyView>
 *    <AnimatedBodyView>Item 2</AnimatedBodyView>
 * </StaggerContainer>
 */
export const StaggerContainer: React.FC<{ children: React.ReactNode; interval?: number }> = ({ 
  children, 
  interval = 100 
}) => {
  return (
    <>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            delay: ((child.props as any).delay || 0) + index * interval
          } as any);
        }
        return child;
      })}
    </>
  );
};

/**
 * SmoothLayoutView: A view that animates its layout when children change.
 */
export const SmoothLayoutView: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({ 
  children, 
  style 
}) => (
  <Animated.View layout={Layout.springify().damping(20).stiffness(100)} style={style}>
    {children}
  </Animated.View>
);
