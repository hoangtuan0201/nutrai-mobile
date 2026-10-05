import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet } from 'react-native';

export type LogoVariant = 'full' | 'mark' | 'original';
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

export interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize | number;
  style?: StyleProp<ImageStyle>;
}

// Aspect ratio: width / height
// Full logo: 642 x 360 (~1.78)
// Mark logo: 235 x 170 (~1.38)
// Original: 1254 x 1254 (1.0)
const FULL_DIMENSIONS: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 44, height: 24 },
  md: { width: 62, height: 34 },
  lg: { width: 88, height: 48 },
  xl: { width: 124, height: 68 },
};

const MARK_DIMENSIONS: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 22, height: 16 },
  md: { width: 33, height: 24 },
  lg: { width: 44, height: 32 },
  xl: { width: 66, height: 48 },
};

const ORIGINAL_DIMENSIONS: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 32, height: 32 },
  md: { width: 48, height: 48 },
  lg: { width: 72, height: 72 },
  xl: { width: 100, height: 100 },
};

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  style,
}) => {
  let source;
  let dimensions: { width: number; height: number };

  if (variant === 'mark') {
    source = require('../../../assets/icons/logo-mark.png');
    if (typeof size === 'number') {
      dimensions = { width: size * 1.38, height: size };
    } else {
      dimensions = MARK_DIMENSIONS[size] || MARK_DIMENSIONS.md;
    }
  } else if (variant === 'original') {
    source = require('../../../assets/icons/logo.png');
    if (typeof size === 'number') {
      dimensions = { width: size, height: size };
    } else {
      dimensions = ORIGINAL_DIMENSIONS[size] || ORIGINAL_DIMENSIONS.md;
    }
  } else {
    // Default: 'full' transparent logo
    source = require('../../../assets/icons/logo-transparent.png');
    if (typeof size === 'number') {
      dimensions = { width: size * 1.78, height: size };
    } else {
      dimensions = FULL_DIMENSIONS[size] || FULL_DIMENSIONS.md;
    }
  }

  return (
    <Image
      source={source}
      style={[styles.base, dimensions, style]}
      resizeMode="contain"
      accessibilityLabel="Nutrai Logo"
    />
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'transparent',
  },
});
