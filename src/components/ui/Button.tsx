import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { theme } from '../../constants';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonRadius = 'full' | 'md' | 'sm';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: ButtonRadius;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeOpacity?: number;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  rounded = 'full',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  activeOpacity = 0.8,
}) => {
  const containerStyles: StyleProp<ViewStyle>[] = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    styles[`rounded_${rounded}`],
    fullWidth && styles.fullWidth,
    variant === 'primary' && !disabled && styles.primaryShadow,
    disabled && styles.disabled,
    style,
  ];

  const textStyles: StyleProp<TextStyle>[] = [
    styles.baseText,
    styles[`textSize_${size}`],
    styles[`textVariant_${variant}`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const indicatorColor =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : theme.colors.saffron;

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPress={onPress}
      disabled={disabled || loading}
      style={containerStyles}
    >
      {loading ? (
        <ActivityIndicator size="small" color={indicatorColor} />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          {title ? (
            <Text style={textStyles}>{title}</Text>
          ) : (
            children
          )}
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: theme.spacing.sm,
  },
  rightIcon: {
    marginLeft: theme.spacing.sm,
  },

  // Sizes
  size_sm: {
    height: 38,
    paddingHorizontal: theme.spacing.md,
  },
  size_md: {
    height: 48,
    paddingHorizontal: theme.spacing.xl,
  },
  size_lg: {
    height: 54,
    paddingHorizontal: theme.spacing.xxl,
  },

  // Border Radius
  rounded_full: {
    borderRadius: theme.radius.full,
  },
  rounded_md: {
    borderRadius: theme.radius.md,
  },
  rounded_sm: {
    borderRadius: theme.radius.sm,
  },

  // Variants
  variant_primary: {
    backgroundColor: theme.colors.saffron,
  },
  variant_secondary: {
    backgroundColor: theme.colors.surfaceDark,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(19, 19, 19, 0.15)',
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_danger: {
    backgroundColor: theme.colors.scarlet,
  },

  // Primary Shadow
  primaryShadow: {
    ...theme.shadows.elevation3,
  },

  // Disabled
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Text Base
  baseText: {
    fontFamily: theme.fonts.bold,
    textAlign: 'center',
  },

  // Text Sizes
  textSize_sm: {
    fontSize: 13,
    lineHeight: 18,
  },
  textSize_md: {
    fontSize: 15,
    lineHeight: 20,
  },
  textSize_lg: {
    fontSize: 16,
    lineHeight: 22,
  },

  // Text Variants
  textVariant_primary: {
    color: '#FFFFFF',
  },
  textVariant_secondary: {
    color: '#FFFFFF',
  },
  textVariant_outline: {
    color: theme.colors.textPrimary,
  },
  textVariant_ghost: {
    color: theme.colors.saffron,
  },
  textVariant_danger: {
    color: '#FFFFFF',
  },
  disabledText: {
    color: theme.colors.textMuted,
  },
});
