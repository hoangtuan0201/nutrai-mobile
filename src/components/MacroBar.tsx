import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants';
import { MacroType } from '../types';

interface MacroBarProps {
  type: MacroType;
  label: string;
  consumed: number;
  target: number;
  unit?: string;
}

export const MacroBar: React.FC<MacroBarProps> = ({
  type,
  label,
  consumed,
  target,
  unit = 'g',
}) => {
  const color = theme.macros[type];
  const percent = Math.min(Math.round((consumed / target) * 100), 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.value}>
          {consumed} / {target}{unit}
        </Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${percent}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.full,
    marginRight: 6,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  value: {
    ...theme.typography.bodySecondary,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  track: {
    height: 6,
    backgroundColor: 'rgba(19, 19, 19, 0.06)',
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
});
