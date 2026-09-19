import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, ArrowRight, ShieldCheck, Check } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Input, Pill } from '../../src/components';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('alex@nutrai.health');
  const [password, setPassword] = useState('supersecret123');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSignIn = () => {
    // UI demo: navigate straight to (main)
    router.replace('/(main)');
  };

  const handleGoogleSignIn = () => {
    // UI demo: simulate Google sign-in
    router.replace('/(main)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Pill */}
          <View style={styles.topRow}>
            <Pill label="NutraAI" variant="saffron" size="sm" />
          </View>

          {/* Title Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to track calories, log meals & chat with your AI nutritionist coach.
            </Text>
          </View>

          {/* Form Inputs */}
          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="e.g. alex@nutrai.health"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={18} color={theme.colors.textSecondary} />}
            />

            <View style={styles.passwordWrapper}>
              <View style={styles.passwordHeader}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push('/(auth)/forgot-password')}
                >
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <Input
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                isPassword
                secureTextEntry
              />
            </View>

            {/* Remember Device Checkbox */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.rememberRow}
            >
              <View style={styles.rememberLeft}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={styles.rememberText}>Remember this device</Text>
              </View>
              <Text style={styles.durationBadge}>30 days</Text>
            </TouchableOpacity>

            {/* Sign In CTA */}
            <Button
              title="Sign In"
              size="lg"
              variant="primary"
              fullWidth
              rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
              onPress={handleSignIn}
              style={styles.signInBtn}
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
              onPress={handleGoogleSignIn}
              style={styles.googleBtn}
            >
              <Image
                source={require('../../assets/icons/googleicon.png')}
                style={styles.googleIcon}
                resizeMode="contain"
              />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Sign Up Navigation */}
            <View style={styles.switchAuthRow}>
              <Text style={styles.switchAuthPrompt}>Don't have an account?</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/(auth)/register')}
              >
                <Text style={styles.switchAuthAction}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Security Footnote */}
            <View style={styles.securityFootnote}>
              <ShieldCheck size={16} color={theme.colors.textSecondary} />
              <Text style={styles.securityText}>
                Biometric & 256-bit encrypted credentials
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
  passwordWrapper: {
    marginBottom: theme.spacing.xs,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textPrimary,
  },
  forgotPasswordText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    color: theme.colors.saffron,
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: theme.spacing.md,
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  checkboxActive: {
    backgroundColor: theme.colors.saffron,
    borderColor: theme.colors.saffron,
  },
  rememberText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  durationBadge: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  signInBtn: {
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
