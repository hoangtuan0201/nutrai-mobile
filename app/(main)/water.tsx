import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Droplets, Plus, Minus, Bell, Sparkles } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Card, Pill } from '../../src/components';

export default function WaterTrackerScreen() {
  const router = useRouter();

  const [currentMl, setCurrentMl] = useState<number>(1750);
  const targetMl = 2500;

  const percentage = Math.min(Math.round((currentMl / targetMl) * 100), 100);

  const handleAdd = (amount: number) => {
    setCurrentMl((prev) => Math.min(prev + amount, targetMl + 1000));
  };

  const handleMinus = (amount: number) => {
    setCurrentMl((prev) => Math.max(prev - amount, 0));
  };

  const logs = [
    { time: '8:30 AM', amount: 250, label: 'Morning Glass' },
    { time: '11:15 AM', amount: 500, label: 'Pre-workout Bottle' },
    { time: '1:30 PM', amount: 500, label: 'Lunch Rehydration' },
    { time: '4:00 PM', amount: 500, label: 'Afternoon Refresh' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hydration Tracker</Text>
        <Pill label={`${percentage}%`} variant="blue" size="sm" />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Water Progress Hero Card */}
        <Card style={styles.heroCard} padding="lg">
          <View style={styles.waterCircleWrap}>
            <View style={styles.waterIconCircle}>
              <Droplets size={44} color={theme.colors.blue} />
            </View>
            <Text style={styles.waterDisplayNumber}>
              {(currentMl / 1000).toFixed(2)}
              <Text style={styles.waterDisplayUnit}> L</Text>
            </Text>
            <Text style={styles.waterTargetText}>
              Goal: {(targetMl / 1000).toFixed(2)} L ({targetMl - currentMl > 0 ? `${targetMl - currentMl} ml left` : 'Goal Reached!'})
            </Text>
          </View>

          {/* Quick Increment Buttons */}
          <View style={styles.quickAddRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleAdd(250)}
              style={styles.quickBtn}
            >
              <Plus size={16} color={theme.colors.blue} />
              <Text style={styles.quickBtnText}>+250 ml</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleAdd(500)}
              style={[styles.quickBtn, styles.quickBtnActive]}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={[styles.quickBtnText, styles.quickBtnTextActive]}>
                +500 ml
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleAdd(750)}
              style={styles.quickBtn}
            >
              <Plus size={16} color={theme.colors.blue} />
              <Text style={styles.quickBtnText}>+750 ml</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Smart Tip Banner */}
        <Card variant="flat" padding="md" style={styles.tipCard}>
          <View style={styles.tipRow}>
            <Sparkles size={20} color={theme.colors.blue} />
            <Text style={styles.tipText}>
              Drinking a glass of water 30 minutes before meals improves digestion and satiety.
            </Text>
          </View>
        </Card>

        {/* Today's Log History */}
        <Text style={styles.sectionTitle}>Today's Water Intake</Text>
        <View style={styles.logsList}>
          {logs.map((log, index) => (
            <Card key={index} variant="outlined" padding="md" style={styles.logCard}>
              <View style={styles.logLeft}>
                <View style={styles.logIcon}>
                  <Droplets size={18} color={theme.colors.blue} />
                </View>
                <View>
                  <Text style={styles.logTitle}>{log.label}</Text>
                  <Text style={styles.logTime}>{log.time}</Text>
                </View>
              </View>
              <Text style={styles.logAmount}>+{log.amount} ml</Text>
            </Card>
          ))}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenMargin,
    paddingVertical: theme.spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(19, 19, 19, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: theme.spacing.sm,
    paddingBottom: 40,
  },
  heroCard: {
    alignItems: 'center',
    borderRadius: 24,
    marginBottom: theme.spacing.lg,
  },
  waterCircleWrap: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  waterIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(136, 168, 247, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  waterDisplayNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: 38,
    color: theme.colors.textPrimary,
  },
  waterDisplayUnit: {
    fontSize: 22,
    color: theme.colors.textSecondary,
  },
  waterTargetText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    paddingTop: theme.spacing.md,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(136, 168, 247, 0.15)',
    gap: 4,
  },
  quickBtnActive: {
    backgroundColor: theme.colors.blue,
  },
  quickBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.blue,
  },
  quickBtnTextActive: {
    color: '#FFFFFF',
  },
  tipCard: {
    backgroundColor: 'rgba(136, 168, 247, 0.12)',
    borderRadius: 18,
    marginBottom: theme.spacing.xl,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  logsList: {
    gap: 10,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(136, 168, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  logTime: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  logAmount: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.blue,
  },
});
