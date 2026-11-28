import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, CheckCircle, MailCheck } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Logo } from '../../src/components';
import { authApi } from '../../src/features/auth/api/auth.api';
import { useAuthStore } from '../../src/store/authStore';

const CODE_LENGTH = 6;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const clearNeedsEmailVerification = useAuthStore((s) => s.clearNeedsEmailVerification);

  const email = (params.email || currentUser?.email || '').trim().toLowerCase();

  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCodeChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (errorMessage) setErrorMessage(null);
  };

  const handleVerify = async () => {
    if (!email) {
      setErrorMessage('Missing email address. Please sign in again.');
      return;
    }
    if (code.length !== CODE_LENGTH) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);
    try {
      await authApi.verifyEmail({ email, code });
      updateUser({ emailVerified: true });
      clearNeedsEmailVerification();
      setIsVerified(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      setErrorMessage(
        Array.isArray(msg) ? msg[0] : typeof msg === 'string' ? msg : 'Invalid or expired code.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    try {
      await authApi.resendVerification(email);
      setInfoMessage('A fresh 6-digit code has been sent to your inbox.');
      setCooldown(60);
    } catch {
      setErrorMessage('Unable to resend code right now. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <CheckCircle size={44} color={theme.colors.saffron} />
          </View>
          <Text style={styles.successTitle}>Email Verified</Text>
          <Text style={styles.successSubtitle}>
            Your account <Text style={styles.emailStrong}>{email}</Text> is now verified and ready
            to track your daily nutrition.
          </Text>
          <Button
            title="Continue to NutrAI"
            size="lg"
            variant="primary"
            fullWidth
            rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
            onPress={() => {
              if (useAuthStore.getState().isNewUser) {
                router.replace('/(auth)/goals' as any);
              } else {
                router.replace('/(main)');
              }
            }}
            style={styles.primaryAction}
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
              onPress={() => {
                clearNeedsEmailVerification();
                if (useAuthStore.getState().isNewUser) {
                  router.replace('/(auth)/goals' as any);
                } else {
                  router.replace('/(main)');
                }
              }}
              style={styles.backBtn}
              accessibilityLabel="Back"
            >
              <ArrowLeft size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Logo variant="full" size="md" />
          </View>

          <View style={styles.header}>
            <View style={styles.badgeIcon}>
              <MailCheck size={24} color={theme.colors.saffron} />
            </View>
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit verification code we sent to{' '}
              <Text style={styles.emailStrong}>{email || 'your email'}</Text>.
            </Text>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {infoMessage && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{infoMessage}</Text>
            </View>
          )}

          {/* 6-Digit Visual OTP Cells */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
            style={styles.otpContainer}
          >
            {Array.from({ length: CODE_LENGTH }).map((_, index) => {
              const char = code[index] || '';
              const isFocused = code.length === index || (code.length === CODE_LENGTH && index === CODE_LENGTH - 1);
              return (
                <View
                  key={index}
                  style={[
                    styles.otpCell,
                    char ? styles.otpCellFilled : null,
                    isFocused ? styles.otpCellActive : null,
                  ]}
                >
                  <Text style={styles.otpDigit}>{char}</Text>
                </View>
              );
            })}
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              autoFocus
              style={styles.hiddenInput}
              caretHidden
            />
          </TouchableOpacity>

          <Text style={styles.expiryHint}>Code expires in 15 minutes. Check spam if needed.</Text>

          <Button
            title={isSubmitting ? 'Verifying...' : 'Verify Email'}
            size="lg"
            variant="primary"
            fullWidth
            rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
            onPress={handleVerify}
            disabled={isSubmitting || code.length !== CODE_LENGTH}
            style={styles.primaryAction}
          />

          <View style={styles.resendRow}>
            <Text style={styles.resendPrompt}>Didn't receive the code? </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleResend}
              disabled={cooldown > 0 || isResending}
            >
              <Text
                style={[
                  styles.resendAction,
                  (cooldown > 0 || isResending) && styles.resendDisabled,
                ]}
              >
                {isResending
                  ? 'Sending...'
                  : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : 'Resend code'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              clearNeedsEmailVerification();
              router.replace('/(main)');
            }}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>Verify later</Text>
          </TouchableOpacity>
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
    paddingBottom: 32,
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
    marginBottom: theme.spacing.xl,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${theme.colors.saffron}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
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
  infoBox: {
    backgroundColor: 'rgba(59, 122, 35, 0.08)',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(59, 122, 35, 0.25)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: theme.spacing.md,
  },
  infoText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: '#2E621B',
    lineHeight: 18,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
    position: 'relative',
  },
  otpCell: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E2D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCellFilled: {
    borderColor: '#151914',
    backgroundColor: '#FAF8F1',
  },
  otpCellActive: {
    borderWidth: 2,
    borderColor: theme.colors.saffron,
  },
  otpDigit: {
    fontFamily: theme.fonts.extraBold,
    fontSize: 24,
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  expiryHint: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  primaryAction: {
    marginTop: 4,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  resendPrompt: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  resendAction: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.saffron,
  },
  resendDisabled: {
    color: theme.colors.textSecondary,
  },
  skipBtn: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
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

