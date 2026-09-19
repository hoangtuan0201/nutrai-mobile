import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { theme } from '../../constants';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  rightAction?: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  borderRadius?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  icon,
  iconBgColor,
  rightAction,
  variant = 'default',
  padding = 'lg',
  borderRadius = theme.radius.md,
  onPress,
  style,
  contentStyle,
}) => {
  const isInteractive = Boolean(onPress);
  const Container = isInteractive ? TouchableOpacity : View;

  const hasHeader = Boolean(title || icon || rightAction);

  return (
    <Container
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.base,
        styles[`variant_${variant}`],
        styles[`padding_${padding}`],
        { borderRadius },
        style,
      ]}
    >
      {hasHeader && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {icon && (
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: iconBgColor || 'rgba(255, 145, 20, 0.12)' },
                ]}
              >
                {icon}
              </View>
            )}
            <View style={styles.titleWrap}>
              {title && <Text style={styles.title}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>
          {rightAction && <View style={styles.headerRight}>{rightAction}</View>}
        </View>
      )}

      {children && <View style={contentStyle}>{children}</View>}
    </Container>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },

  // Variants
  variant_default: {
    backgroundColor: '#FFFFFF',
    ...theme.shadows.elevation1,
  },
  variant_elevated: {
    backgroundColor: '#FFFFFF',
    ...theme.shadows.elevation2,
  },
  variant_outlined: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(19, 19, 19, 0.08)',
  },
  variant_flat: {
    backgroundColor: theme.colors.surfaceCard,
  },

  // Paddings
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: theme.spacing.sm,
  },
  padding_md: {
    padding: theme.spacing.md,
  },
  padding_lg: {
    padding: theme.spacing.lg,
  },
  padding_xl: {
    padding: theme.spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    marginLeft: theme.spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    lineHeight: 22,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
