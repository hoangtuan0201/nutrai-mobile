import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { theme } from '../../constants';

export type TypographyVariant =
  | 'displayNumber'
  | 'h1'
  | 'h2'
  | 'body'
  | 'bodySecondary'
  | 'caption';

export interface AppTextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color,
  align,
  style,
  children,
  ...props
}) => {
  const variantStyle = theme.typography[variant];
  const defaultColor =
    variant === 'caption' || variant === 'bodySecondary'
      ? theme.colors.textSecondary
      : theme.colors.textPrimary;

  return (
    <RNText
      style={[
        variantStyle,
        { color: color || defaultColor },
        align && { textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};
