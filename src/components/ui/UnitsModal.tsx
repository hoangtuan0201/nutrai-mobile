import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { X } from 'lucide-react-native';
import {
  useUnitStore,
  EnergyUnit,
  FoodUnit,
  BodyUnit,
} from '../../store/unitStore';
import { useAppTheme } from '../../hooks/useAppTheme';

interface UnitsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function UnitsModal({ visible, onClose }: UnitsModalProps) {
  const { colors } = useAppTheme();
  const { energyUnit, foodUnit, bodyUnit, setUnits } = useUnitStore();

  const [tempEnergy, setTempEnergy] = useState<EnergyUnit>(energyUnit);
  const [tempFood, setTempFood] = useState<FoodUnit>(foodUnit);
  const [tempBody, setTempBody] = useState<BodyUnit>(bodyUnit);

  useEffect(() => {
    if (visible) {
      setTempEnergy(energyUnit);
      setTempFood(foodUnit);
      setTempBody(bodyUnit);
    }
  }, [visible, energyUnit, foodUnit, bodyUnit]);

  const handleSave = () => {
    setUnits({
      energyUnit: tempEnergy,
      foodUnit: tempFood,
      bodyUnit: tempBody,
    });
    onClose();
  };

  const renderOptionRow = (
    label: string,
    options: { value: string; label: string; active: boolean; onSelect: () => void }[],
  ) => (
    <View style={styles.unitRow}>
      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
      <View style={styles.radioRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.pillOption,
              { backgroundColor: colors.inputBg, borderColor: colors.border },
              opt.active && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={opt.onSelect}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.pillText,
                { color: opt.active ? colors.onPrimary : colors.textPrimary },
                opt.active && styles.pillTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheetContainer,
                { backgroundColor: colors.surface },
              ]}
            >
              {/* Header */}
              <View style={styles.headerRow}>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Units</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeBtn, { backgroundColor: colors.surfaceMuted }]}
                  activeOpacity={0.7}
                  accessibilityLabel="Close units modal"
                >
                  <X size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Rows matching Personal Information / Goal & Activity layout */}
              <View style={styles.contentBody}>
                {renderOptionRow('Energy Value', [
                  {
                    value: 'Cal',
                    label: 'Cal',
                    active: tempEnergy === 'Cal',
                    onSelect: () => setTempEnergy('Cal'),
                  },
                  {
                    value: 'kcal',
                    label: 'kcal',
                    active: tempEnergy === 'kcal',
                    onSelect: () => setTempEnergy('kcal'),
                  },
                ])}

                {renderOptionRow('Food / Recipe', [
                  {
                    value: 'metric',
                    label: 'g / ml',
                    active: tempFood === 'metric',
                    onSelect: () => setTempFood('metric'),
                  },
                  {
                    value: 'imperial',
                    label: 'oz / fl oz',
                    active: tempFood === 'imperial',
                    onSelect: () => setTempFood('imperial'),
                  },
                ])}

                {renderOptionRow('Height / Weight', [
                  {
                    value: 'metric',
                    label: 'cm / kg',
                    active: tempBody === 'metric',
                    onSelect: () => setTempBody('metric'),
                  },
                  {
                    value: 'imperial',
                    label: 'ft / lbs',
                    active: tempBody === 'imperial',
                    onSelect: () => setTempBody('imperial'),
                  },
                ])}
              </View>

              {/* Save CTA - identical to EditProfileModal saveBtn */}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={handleSave}
              >
                <Text style={[styles.saveBtnText, { color: colors.onPrimary }]}>
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBody: {
    gap: 16,
    marginBottom: 24,
  },
  unitRow: {
    gap: 8,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  radioRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pillOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    fontWeight: '700',
  },
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
