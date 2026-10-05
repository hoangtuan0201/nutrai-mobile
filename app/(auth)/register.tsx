import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, ArrowRight, ShieldCheck, Check } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Input, Pill, Logo } from '../../src/components';
import { useAuthStore } from '../../src/store/authStore';
import { registerSchema, RegisterFormData } from '../../src/features/auth/validation';
import { performGoogleAuth } from '../../src/features/auth/services/googleAuth';

export default function RegisterScreen() {
  const router = useRouter();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const [agreeTerms, setAgreeTerms] = React.useState(true);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const onSubmit = async (data: RegisterFormData) => {
    if (!agreeTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service and Privacy Policy.');
      return;
    }
    clearError();
    try {
      await registerUser(data);
      // Auth guard in _layout.tsx will auto-redirect to (main)
    } catch {
      // Error is set in store
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    clearError();
    try {
      const result = await performGoogleAuth();
      if (!result.success && result.error) {
        if (Platform.OS === 'web') {
          window.alert(result.error);
        } else {
          Alert.alert('Google Sign-Up', result.error);
        }
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          removeClippedSubviews={false}
        >
          {/* Top Brand Logo */}
          <View style={styles.topRow}>
            <Logo variant="full" size="md" />
          </View>

          {/* Title Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Set up your profile to track macros, food photos & achieve your fitness goals.
            </Text>
          </View>

          {/* Form Inputs */}
          <View style={styles.form}>
            {/* Server error */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Full Name"
                  placeholder="e.g. Alex Johnson"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                  leftIcon={<User size={18} color={theme.colors.textSecondary} />}
                  error={errors.name?.message}
                />
              )}
            />

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

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Password"
                  placeholder="At least 8 characters"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  isPassword
                  secureTextEntry
                  helperText="Must be at least 8 characters with a mix of letters and numbers"
                  error={errors.password?.message}
                />
              )}
            />

            {/* Terms Checkbox */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setAgreeTerms(!agreeTerms)}
              style={styles.termsRow}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
                {agreeTerms && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text style={styles.termsText}>
                I agree to NutraAI's{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Create Account CTA */}
            <Button
              title={isLoading ? 'Creating account...' : 'Create Account'}
              size="lg"
              variant="primary"
              fullWidth
              rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={styles.registerBtn}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Authentication Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleGoogleSignUp}
              disabled={isLoading || googleLoading}
              style={styles.googleBtn}
            >
              <Image
                source={require('../../assets/icons/googleicon.png')}
                style={styles.googleIcon}
                resizeMode="contain"
              />
              <Text style={styles.googleBtnText}>
                {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            {/* Switch to Sign In */}
            <View style={styles.switchAuthRow}>
              <Text style={styles.switchAuthPrompt}>Already have an account?</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.switchAuthAction}>Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Security Footnote */}
            <View style={styles.securityFootnote}>
              <ShieldCheck size={16} color={theme.colors.textSecondary} />
              <Text style={styles.securityText}>
                Your health data is private and encrypted
              </Text>
            </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 40,
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    marginBottom: theme.spacing.md,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(19, 19, 19, 0.2)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: theme.colors.saffron,
    borderColor: theme.colors.saffron,
  },
  termsText: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  termsLink: {
    color: theme.colors.saffron,
    fontFamily: theme.fonts.semiBold,
  },
  registerBtn: {
    marginTop: theme.spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(19, 19, 19, 0.08)',
  },
  dividerText: {
    fontFamily: theme.fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    color: theme.colors.textSecondary,
  },
  switchAuthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
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
  securityFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 19, 19, 0.04)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: theme.spacing.sm,
  },
  securityText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: theme.radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(19, 19, 19, 0.1)',
    paddingHorizontal: theme.spacing.lg,
    width: '100%',
    ...theme.shadows.elevation1,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
});
