import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, ChevronRight, Ruler, Scale, Target, Activity, User as UserIcon } from 'lucide-react-native';
import { SettingsCard, SettingsDivider } from './SettingsGroup';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { ProfileSummary } from '../hooks/useProfileSummary';
import { formatActivityLabel, formatActivitySubtitle, formatGoalLabel } from '../utils/labels';
import { formatHeight, formatWeight, BodyUnit } from '../../../store/unitStore';

interface Props {
  summary: ProfileSummary;
  bodyUnit: BodyUnit;
  onEditPersonal: () => void;
  onEditGoals: () => void;
}

function CardHeader({
  icon: Icon,
  title,
  subtitle,
  onPress,
}: {
  icon: typeof UserIcon;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity style={styles.header} activeOpacity={0.75} onPress={onPress}>
      <View style={[styles.iconCircle, { backgroundColor: colors.surfaceMuted }]}>
        <Icon size={18} color={colors.textPrimary} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Scale; label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.stat}>
      <View style={styles.statLabelRow}>
        <Icon size={13} color={colors.textSecondary} />
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

export function PersonalInfoCard({ summary, bodyUnit, onEditPersonal, onEditGoals }: Props) {
  return (
    <>
      <SettingsCard>
        <CardHeader
          icon={UserIcon}
          title="Personal Information"
          subtitle="Age, height, weight and more."
          onPress={onEditPersonal}
        />
        <SettingsDivider />
        <View style={styles.statsRow}>
          <Stat icon={Calendar} label="Age" value={`${summary.age} years`} />
          <Stat icon={UserIcon} label="Gender" value={summary.gender === 'MALE' ? 'Male' : 'Female'} />
          <Stat icon={Ruler} label="Height" value={formatHeight(summary.heightCm, bodyUnit).full} />
          <Stat icon={Scale} label="Weight" value={formatWeight(summary.weightKg, bodyUnit).full} />
        </View>
      </SettingsCard>

      <SettingsCard>
        <CardHeader
          icon={Target}
          title="Goals & Activity"
          subtitle="Your fitness goals and activity level."
          onPress={onEditGoals}
        />
        <SettingsDivider />
        <View style={styles.statsRow}>
          <Stat
            icon={Target}
            label="Goal"
            value={`${formatGoalLabel(summary.goal)}\n${formatWeight(summary.targetWeightKg, bodyUnit).full}`}
          />
          <Stat
            icon={Activity}
            label="Activity level"
            value={`${formatActivityLabel(summary.activity)}\n${formatActivitySubtitle(summary.activity)}`}
          />
        </View>
      </SettingsCard>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardTitle: { fontSize: 15, fontFamily: 'Manrope_700Bold' },
  cardSubtitle: { fontSize: 12, marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  stat: { flex: 1 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  statLabel: { fontSize: 11, fontFamily: 'Manrope_600SemiBold' },
  statValue: { fontSize: 13, fontFamily: 'Manrope_700Bold', lineHeight: 18 },
});

