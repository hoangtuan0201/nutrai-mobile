import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Input, Pill, Logo } from '../../src/components';
import { authApi } from '../../src/features/auth/api/auth.api';
import {
  forgotPasswordSchema,
  ForgotPasswordFormData,
} from '../../src/features/auth/validation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setServerError(null);
    try {
      await authApi.forgotPassword(data.email);
      setIsSubmitted(true);
    } catch {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Success state ─────────────────────────────────
  if (isSubmitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          {/* Back button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.successContent}>
            <View style={styles.successIconContainer}>
              <CheckCircle size={48} color={theme.colors.saffron} />
            </View>

            <Text style={styles.successTitle}>Check your email</Text>
            <Text style={styles.successSubtitle}>
              We've sent a password reset link to{'\n'}
              <Text style={styles.emailHighlight}>{getValues('email')}</Text>
            </Text>

            <View style={styles.successInfo}>
              <Text style={styles.successInfoText}>
                The link will expire in 30 minutes. Check your spam folder if you don't see it.
              </Text>
            </View>

            <Button
              title="Back to Sign In"
              size="lg"
              variant="primary"
              fullWidth
              onPress={() => router.replace('/(auth)/login')}
              style={styles.backToLoginBtn}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setIsSubmitted(false);
                setServerError(null);
              }}
              style={styles.resendRow}
            >
              <Text style={styles.resendText}>Didn't receive the email? </Text>
              <Text style={styles.resendAction}>Resend</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Form state ────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          {/* Back button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.topRow}>
            <Logo variant="full" size="md" />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {serverError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{serverError}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Email Address"
                  placeholder="e.g. alex@nutrai.health"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Mail size={18} color={theme.colors.textSecondary} />}
                  error={errors.email?.message}
                />
              )}
            />

            <Button
              title={isLoading ? 'Sending...' : 'Send Reset Link'}
              size="lg"
              variant="primary"
              fullWidth
              rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={styles.submitBtn}
            />
          </View>

          {/* Back to login link */}
          <View style={styles.switchAuthRow}>
            <Text style={styles.switchAuthPrompt}>Remember your password?</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.switchAuthAction}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBase,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(19, 19, 19, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  topRow: {
    marginBottom: theme.spacing.md,
    alignItems: 'flex-start',
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
  form: {
    gap: 4,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: theme.spacing.lg,
  },
  switchAuthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
    gap: 6,
  },
  switchAuthPrompt: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  switchAuthAction: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.saffron,
    textDecorationLine: 'underline',
  },
  // ─── Success screen ──────────
  successContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.saffron}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  successTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 24,
    color: theme.colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  successSubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emailHighlight: {
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textPrimary,
  },
  successInfo: {
    backgroundColor: 'rgba(19, 19, 19, 0.04)',
    borderRadius: theme.radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: theme.spacing.xl,
    width: '100%',
  },
  successInfoText: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  backToLoginBtn: {
    marginBottom: theme.spacing.md,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  resendAction: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.saffron,
  },
});
