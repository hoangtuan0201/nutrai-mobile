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
import { theme } from '../../constants';
import { Button } from './Button';
import {
  useUnitStore,
  EnergyUnit,
  FoodUnit,
  BodyUnit,
} from '../../store/unitStore';

interface UnitsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function UnitsModal({ visible, onClose }: UnitsModalProps) {
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Header */}
              <View style={styles.headerRow}>
                <Text style={styles.sheetTitle}>Units</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  activeOpacity={0.7}
                >
                  <X size={20} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Rows */}
              <View style={styles.contentBody}>
                {/* 1. Energy Value */}
                <View style={styles.unitRow}>
                  <Text style={styles.rowLabel}>Energy Value</Text>
                  <View style={styles.pillGroup}>
                    <TouchableOpacity
                      style={[
                        styles.pillOption,
                        tempEnergy === 'Cal' && styles.pillOptionActive,
                      ]}
                      onPress={() => setTempEnergy('Cal')}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          tempEnergy === 'Cal' && styles.pillTextActive,
                        ]}
                      >
                        Cal
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.pillOption,
                        tempEnergy === 'kcal' && styles.pillOptionActive,
                      ]}
                      onPress={() => setTempEnergy('kcal')}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          tempEnergy === 'kcal' && styles.pillTextActive,
                        ]}
                      >
                        kcal
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 2. Food/Recipe */}
                <View style={styles.unitRow}>
                  <Text style={styles.rowLabel}>Food/Recipe</Text>
                  <View style={styles.pillGroup}>
                    <TouchableOpacity
                      style={[
                        styles.pillOption,
                        tempFood === 'metric' && styles.pillOptionActive,
                      ]}
                      onPress={() => setTempFood('metric')}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          tempFood === 'metric' && styles.pillTextActive,
                        ]}
                      >
                        g/ml
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.pillOption,
                        tempFood === 'imperial' && styles.pillOptionActive,
                      ]}
                      onPress={() => setTempFood('imperial')}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          tempFood === 'imperial' && styles.pillTextActive,
                        ]}
                      >
                        oz/fl oz
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 3. Height/Weight */}
                <View style={styles.unitRow}>
                  <Text style={styles.rowLabel}>Height/Weight</Text>
                  <View style={styles.pillGroup}>
                    <TouchableOpacity
                      style={[
                        styles.pillOption,
                        tempBody === 'metric' && styles.pillOptionActive,
                      ]}
                      onPress={() => setTempBody('metric')}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          tempBody === 'metric' && styles.pillTextActive,
                        ]}
                      >
                        cm/kg
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.pillOption,
                        tempBody === 'imperial' && styles.pillOptionActive,
                      ]}
                      onPress={() => setTempBody('imperial')}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          tempBody === 'imperial' && styles.pillTextActive,
                        ]}
                      >
                        ft/lbs
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Save CTA */}
              <View style={styles.footerRow}>
                <Button
                  title="Save"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={handleSave}
                />
              </View>
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
    backgroundColor: 'rgba(19, 19, 19, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingBottom: 36,
    paddingHorizontal: 24,
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sheetTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    color: theme.colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(19, 19, 19, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBody: {
    gap: 20,
    marginBottom: 28,
  },
  unitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  pillGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(19, 19, 19, 0.06)',
    borderRadius: 14,
    padding: 3,
  },
  pillOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 11,
  },
  pillOptionActive: {
    backgroundColor: theme.colors.saffron,
    shadowColor: theme.colors.saffron,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  pillText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  pillTextActive: {
    fontFamily: theme.fonts.bold,
    color: '#FFFFFF',
  },
  footerRow: {
    marginTop: 8,
  },
});
