import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { theme } from '../../constants';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  rounded?: 'full' | 'md' | 'sm';
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  isPassword = false,
  rounded = 'md',
  containerStyle,
  inputStyle,
  secureTextEntry,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const isSecure = isPassword && !showPassword;

  return (
    <View style={[styles.wrapper, containerStyle]} collapsable={false}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        collapsable={false}
        style={[
          styles.inputContainer,
          styles[`rounded_${rounded}`],
          isFocused && styles.focusedBorder,
          Boolean(error) && styles.errorBorder,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          ref={ref}
          style={[styles.input, inputStyle]}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={isPassword ? isSecure : secureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          underlineColorAndroid="transparent"
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            {showPassword ? (
              <EyeOff size={20} color={theme.colors.textSecondary} />
            ) : (
              <Eye size={20} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>
        ) : (
          rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(19, 19, 19, 0.08)',
    paddingHorizontal: theme.spacing.lg,
    height: 52,
  },
  rounded_full: {
    borderRadius: theme.radius.full,
  },
  rounded_md: {
    borderRadius: theme.radius.md,
  },
  rounded_sm: {
    borderRadius: theme.radius.sm,
  },
  focusedBorder: {
    borderColor: theme.colors.saffron,
  },
  errorBorder: {
    borderColor: theme.colors.scarlet,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: theme.fonts.medium,
    color: theme.colors.textPrimary,
    paddingVertical: 0,
    textAlignVertical: 'center',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  leftIcon: {
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIcon: {
    marginLeft: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    padding: 6,
    marginLeft: theme.spacing.xs,
  },
  errorText: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: theme.colors.scarlet,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
});
