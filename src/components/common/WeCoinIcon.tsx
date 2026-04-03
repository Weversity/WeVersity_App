import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface WeCoinIconProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * Reusable WeCoinIcon component that uses the branded WeCoins asset.
 * Following best practices for consistent branding across the app.
 */
const WeCoinIcon: React.FC<WeCoinIconProps> = ({ size = 20, style }) => {
  return (
    <Image
      source={require('@/assets/images/wecoins.png')}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
      resizeMode="contain"
    />
  );
};

export default WeCoinIcon;
