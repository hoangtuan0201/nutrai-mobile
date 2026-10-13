import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../../constants';

interface OnboardingHeaderProps {
  step: number;
  totalSteps?: number;
  onBack?: () => void;
}

export function OnboardingHeader({
  step,
  totalSteps = 7,
  onBack,
}: OnboardingHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleBack}
        style={styles.backBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ArrowLeft size={20} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.barContainer}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              i < step && styles.segmentActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenMargin,
    paddingVertical: 14,
    gap: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 19, 19, 0.05)',
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(19, 19, 19, 0.10)',
  },
  segmentActive: {
    backgroundColor: theme.colors.saffron,
  },
});
