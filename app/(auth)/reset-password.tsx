import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, CheckCircle, Lock } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Input, Logo } from '../../src/components';
import { authApi } from '../../src/features/auth/api/auth.api';
import { strongPasswordSchema } from '../../src/features/auth/validation';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; code?: string }>();

  const email = (params.email || '').trim().toLowerCase();
  const code = (params.code || '').replace(/\D/g, '').slice(0, 6);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleReset = async () => {
    if (!email || code.length !== 6) {
      setErrorMessage('Verification session is missing. Please restart the reset flow.');
      return;
    }
    const pwdCheck = strongPasswordSchema.safeParse(newPassword);
    if (!pwdCheck.success) {
      setErrorMessage(pwdCheck.error.issues[0]?.message || 'Password is not strong enough.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await authApi.resetPassword({
        email,
        code,
        newPassword,
      });
      setIsCompleted(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      setErrorMessage(
        Array.isArray(msg)
          ? msg[0]
          : typeof msg === 'string'
            ? msg
            : 'Invalid or expired reset code. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <CheckCircle size={44} color={theme.colors.saffron} />
          </View>
          <Text style={styles.successTitle}>Password Updated</Text>
          <Text style={styles.successSubtitle}>
            Your password has been reset successfully. Sign in with your new password to continue.
          </Text>
          <Button
            title="Sign In Now"
            size="lg"
            variant="primary"
            fullWidth
            rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={styles.backBtn}
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Logo variant="full" size="md" />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Create new password</Text>
            <Text style={styles.subtitle}>
              Code verified for <Text style={styles.emailStrong}>{email || 'your account'}</Text>.
              Choose a strong new password below.
            </Text>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Input
              label="New Password"
              placeholder="8+ chars, upper, lower, number & symbol"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              leftIcon={<Lock size={18} color={theme.colors.textSecondary} />}
            />

            <Input
              label="Confirm New Password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              leftIcon={<Lock size={18} color={theme.colors.textSecondary} />}
            />

            <Button
              title={isSubmitting ? 'Updating Password...' : 'Update Password'}
              size="lg"
              variant="primary"
              fullWidth
              rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
              onPress={handleReset}
              disabled={isSubmitting}
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBase,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 36,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(19, 19, 19, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: theme.spacing.lg,
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
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },
  emailStrong: {
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textPrimary,
  },
  errorBox: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.25)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
  form: {
    gap: 4,
  },
  submitBtn: {
    marginTop: theme.spacing.lg,
  },
  successContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.screenMargin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.saffron}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  successTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 26,
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  successSubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
});
