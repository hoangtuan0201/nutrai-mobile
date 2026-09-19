import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { theme } from '../../constants';

export type BadgeVariant =
  | 'onyx'
  | 'saffron'
  | 'green'
  | 'blue'
  | 'yellow'
  | 'scarlet'
  | 'ivory'
  | 'outline';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  indicatorColor?: string;
  active?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'onyx',
  size = 'md',
  icon,
  indicatorColor,
  active,
  onPress,
  style,
  textStyle,
}) => {
  const isInteractive = Boolean(onPress);
  const ContainerComponent = isInteractive ? TouchableOpacity : View;

  return (
    <ContainerComponent
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        active && styles.activeOverride,
        style,
      ]}
    >
      {indicatorColor && (
        <View style={[styles.indicatorDot, { backgroundColor: indicatorColor }]} />
      )}
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text
        style={[
          styles.baseText,
          styles[`textSize_${size}`],
          styles[`textVariant_${variant}`],
          active && styles.activeTextOverride,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </ContainerComponent>
  );
};

// Re-export as Pill alias for convenience
export const Pill = Badge;

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },
  iconWrap: {
    marginRight: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  // Sizes
  size_sm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    minHeight: 22,
  },
  size_md: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 28,
  },
  size_lg: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },

  // Variants
  variant_onyx: {
    backgroundColor: theme.colors.surfaceDark,
    ...theme.shadows.elevation2,
  },
  variant_saffron: {
    backgroundColor: 'rgba(255, 145, 20, 0.15)',
  },
  variant_green: {
    backgroundColor: 'rgba(142, 220, 94, 0.18)',
  },
  variant_blue: {
    backgroundColor: 'rgba(136, 168, 247, 0.20)',
  },
  variant_yellow: {
    backgroundColor: 'rgba(253, 217, 34, 0.22)',
  },
  variant_scarlet: {
    backgroundColor: 'rgba(240, 75, 55, 0.15)',
  },
  variant_ivory: {
    backgroundColor: 'rgba(200, 194, 155, 0.25)',
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(19, 19, 19, 0.12)',
  },

  activeOverride: {
    backgroundColor: theme.colors.saffron,
    borderColor: theme.colors.saffron,
  },

  // Base Text
  baseText: {
    fontFamily: theme.fonts.bold,
  },

  // Text Sizes
  textSize_sm: {
    fontSize: 11,
    lineHeight: 14,
  },
  textSize_md: {
    fontSize: 12,
    lineHeight: 16,
  },
  textSize_lg: {
    fontSize: 14,
    lineHeight: 18,
  },

  // Text Variants
  textVariant_onyx: {
    color: '#FFFFFF',
  },
  textVariant_saffron: {
    color: theme.colors.saffron,
  },
  textVariant_green: {
    color: '#34781A',
  },
  textVariant_blue: {
    color: '#284EAB',
  },
  textVariant_yellow: {
    color: '#8A7000',
  },
  textVariant_scarlet: {
    color: theme.colors.scarlet,
  },
  textVariant_ivory: {
    color: theme.colors.textPrimary,
  },
  textVariant_outline: {
    color: theme.colors.textPrimary,
  },
  activeTextOverride: {
    color: '#FFFFFF',
  },
});
