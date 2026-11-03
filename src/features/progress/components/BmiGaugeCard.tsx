import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../../../constants/theme';
import { BMIInfo } from '../types';

interface BmiGaugeCardProps {
  bmi: BMIInfo;
}

export const BmiGaugeCard: React.FC<BmiGaugeCardProps> = ({ bmi }) => {
  // Normalize BMI on a scale from 14 to 40 for gauge pointer positioning
  const clampedBmi = Math.max(14, Math.min(40, bmi.value));
  const pointerPercent = ((clampedBmi - 14) / (40 - 14)) * 100;

  const getCategoryColor = (cat: BMIInfo['category']) => {
    switch (cat) {
      case 'Severe Thinness':
        return '#60A5FA';
      case 'Underweight':
        return '#38BDF8';
      case 'Normal':
        return theme.colors.green;
      case 'Overweight':
        return '#FBBF24';
      case 'Obese':
        return theme.colors.scarlet;
      default:
        return theme.colors.green;
    }
  };

  const badgeColor = getCategoryColor(bmi.category);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.label}>BMI</Text>
          <Text style={styles.value}>{bmi.value}</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: `${badgeColor}18` }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{bmi.category}</Text>
        </View>
      </View>

      {/* Multi-segmented Gradient Track */}
      <View style={styles.gaugeContainer}>
        <View style={styles.track}>
          <View style={[styles.segment, { flex: 2, backgroundColor: '#60A5FA' }]} />
          <View style={[styles.segment, { flex: 2.5, backgroundColor: '#38BDF8' }]} />
          <View style={[styles.segment, { flex: 6.5, backgroundColor: '#8EDC5E' }]} />
          <View style={[styles.segment, { flex: 5, backgroundColor: '#FBBF24' }]} />
          <View style={[styles.segment, { flex: 5, backgroundColor: '#FB923C' }]} />
          <View style={[styles.segment, { flex: 5, backgroundColor: '#F87171' }]} />
        </View>

        {/* Circular Pointer */}
        <View style={[styles.pointerWrap, { left: `${pointerPercent}%` }]}>
          <View style={[styles.pointerOuter, { borderColor: badgeColor }]}>
            <View style={[styles.pointerInner, { backgroundColor: badgeColor }]} />
          </View>
        </View>
      </View>

      {/* Scale Labels */}
      <View style={styles.scaleLabelsRow}>
        <Text style={styles.scaleText}>15</Text>
        <Text style={styles.scaleText}>18.5</Text>
        <Text style={styles.scaleText}>25</Text>
        <Text style={styles.scaleText}>30</Text>
        <Text style={styles.scaleText}>35</Text>
        <Text style={styles.scaleText}>40</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECEAE1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: '#8E9388',
    letterSpacing: 0.5,
  },
  value: {
    fontFamily: theme.fonts.extraBold,
    fontSize: 28,
    color: '#1B281B',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
  },
  gaugeContainer: {
    position: 'relative',
    height: 18,
    justifyContent: 'center',
    marginBottom: 6,
  },
  track: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
  },
  pointerWrap: {
    position: 'absolute',
    marginLeft: -10,
    top: -1,
  },
  pointerOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  pointerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scaleLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  scaleText: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: '#999E94',
  },
});
