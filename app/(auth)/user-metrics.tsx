import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Calendar, Ruler, Weight } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Input, Logo } from '../../src/components';

export default function UserMetricsScreen() {
  const router = useRouter();

  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<string>('26');
  const [height, setHeight] = useState<string>('172');
  const [weight, setWeight] = useState<string>('68');

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header with Back + Brand + Segmented Progress Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <Logo variant="full" size="sm" />

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '50%' }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Friendly AI Coach Speech Bubble */}
        <View style={styles.speechBubbleWrapper}>
          <View style={styles.speechBubble}>
            <Text style={styles.speechBubbleText}>About you 👤</Text>
          </View>
        </View>

        {/* Biological Sex Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Biological Sex</Text>
          <View style={styles.genderRow}>
            {[
              { id: 'male' as const, label: 'Male' },
              { id: 'female' as const, label: 'Female' },
            ].map((g) => {
              const isSelected = gender === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  activeOpacity={0.8}
                  onPress={() => setGender(g.id)}
                  style={[
                    styles.genderCard,
                    isSelected && styles.genderCardActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.genderText,
                      isSelected && styles.genderTextActive,
                    ]}
                  >
                    {g.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Age Input */}
        <Input
          label="Age (Years)"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          placeholder="e.g. 26"
          leftIcon={<Calendar size={18} color={theme.colors.textSecondary} />}
          helperText="Used to adjust metabolic expenditure curves with age"
        />

        {/* Height Input */}
        <Input
          label="Height (cm)"
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
          placeholder="e.g. 172"
          leftIcon={<Ruler size={18} color={theme.colors.textSecondary} />}
        />

        {/* Current Weight Input */}
        <Input
          label="Current Weight (kg)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          placeholder="e.g. 68"
          leftIcon={<Weight size={18} color={theme.colors.textSecondary} />}
          helperText="Determines baseline caloric needs and minimum protein requirements"
        />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <Button
          title="Continue"
          size="lg"
          variant="primary"
          fullWidth
          rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
          onPress={() => router.push('/(auth)/activity-level' as any)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBase,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenMargin,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 19, 19, 0.04)',
  },
  brandTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(19, 19, 19, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginLeft: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.saffron,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: 16,
    paddingBottom: 40,
  },
  speechBubbleWrapper: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(19, 19, 19, 0.06)',
    ...theme.shadows.elevation1,
  },
  speechBubbleText: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderCard: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(19, 19, 19, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.elevation1,
  },
  genderCardActive: {
    borderColor: theme.colors.saffron,
    backgroundColor: 'rgba(255, 145, 20, 0.06)',
  },
  genderText: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  genderTextActive: {
    color: theme.colors.saffron,
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: theme.colors.surfaceBase,
  },
});
