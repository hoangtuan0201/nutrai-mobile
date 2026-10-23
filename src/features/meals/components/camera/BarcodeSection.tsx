import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, PermissionResponse } from 'expo-camera';
import {
  Zap,
  ZapOff,
  ScanBarcode,
  X,
  CheckCircle2,
  ArrowRight,
  Keyboard as KeyboardIcon,
  Plus,
  Minus,
} from 'lucide-react-native';
import { theme } from '../../../../constants';
import { mealsApi } from '../../api/meals.api';
import { useUnitStore } from '../../../../store/unitStore';
import { FoodSearchResult, MealItem } from '../../types';
import { cameraStyles as styles } from './camera.styles';

interface BarcodeSectionProps {
  permission: PermissionResponse | null;
  flashOn: boolean;
  onToggleFlash: () => void;
}

export const BarcodeSection: React.FC<BarcodeSectionProps> = ({
  permission,
  flashOn,
  onToggleFlash,
}) => {
  const router = useRouter();
  const { energyUnit } = useUnitStore();

  const [isBarcodeLoading, setIsBarcodeLoading] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [barcodeProductModal, setBarcodeProductModal] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [savingBarcodeMeal, setSavingBarcodeMeal] = useState(false);

  // Manual input modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');

  // Success modal
  const [barcodeSuccessModal, setBarcodeSuccessModal] = useState<{
    visible: boolean;
    name: string;
    calories: number;
  } | null>(null);

  const fetchBarcodeProduct = async (code: string) => {
    try {
      setIsBarcodeLoading(true);
      setScannedBarcode(code);

      const product = await mealsApi.getFoodByBarcode(code);
      setBarcodeProductModal(product);
      setQuantity(1);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        `No packaged product found for barcode: ${code}. You can enter it manually or scan food photo.`;
      Alert.alert('Barcode Not Found', msg, [
        {
          text: 'Scan Again',
          onPress: () => {
            setScannedBarcode(null);
          },
        },
        {
          text: 'Enter Manually',
          onPress: () => {
            setManualCodeInput(code);
            setShowManualModal(true);
          },
        },
      ]);
    } finally {
      setIsBarcodeLoading(false);
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isBarcodeLoading || scannedBarcode === data || barcodeProductModal) {
      return;
    }
    await fetchBarcodeProduct(data);
  };

  const handleManualSubmit = async () => {
    const clean = manualCodeInput.trim();
    if (!clean) return;
    setShowManualModal(false);
    setManualCodeInput('');
    await fetchBarcodeProduct(clean);
  };

  const handleSaveBarcodeProduct = async () => {
    if (!barcodeProductModal) return;

    const baseCal = barcodeProductModal.servingCalories ?? barcodeProductModal.caloriesPer100g ?? 0;
    const baseProt = barcodeProductModal.servingProtein ?? barcodeProductModal.proteinPer100g ?? 0;
    const baseCarb = barcodeProductModal.servingCarbs ?? barcodeProductModal.carbsPer100g ?? 0;
    const baseFa = barcodeProductModal.servingFat ?? barcodeProductModal.fatPer100g ?? 0;

    const computedCalories = Math.round(baseCal * quantity);
    const computedProtein = Math.round(baseProt * quantity * 10) / 10;
    const computedCarbs = Math.round(baseCarb * quantity * 10) / 10;
    const computedFat = Math.round(baseFa * quantity * 10) / 10;

    setSavingBarcodeMeal(true);
    try {
      const todayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      const portionDesc = `${quantity} x ${barcodeProductModal.servingSizeDescription || 'serving'}`;

      const mealItems: MealItem[] = [
        {
          foodName: barcodeProductModal.name,
          portionDescription: portionDesc,
          quantity: quantity,
          unit: 'serving',
          calories: computedCalories,
          protein: computedProtein,
          carbs: computedCarbs,
          fat: computedFat,
        },
      ];

      await mealsApi.createMeal({
        mealType: 'LUNCH',
        name: barcodeProductModal.name,
        totalCalories: computedCalories,
        totalProtein: computedProtein,
        totalCarbs: computedCarbs,
        totalFat: computedFat,
        source: 'MANUAL',
        loggedDate: todayStr,
        items: mealItems,
      });

      const savedName = barcodeProductModal.name;
      const savedCal = computedCalories;
      setBarcodeProductModal(null);
      setScannedBarcode(null);
      setBarcodeSuccessModal({
        visible: true,
        name: savedName,
        calories: savedCal,
      });
    } catch (error: any) {
      Alert.alert('Save Failed', error?.message || 'Could not log meal from barcode.');
    } finally {
      setSavingBarcodeMeal(false);
    }
  };

  // Real-time calculated values per serving/package
  const baseCalories = barcodeProductModal
    ? (barcodeProductModal.servingCalories ?? barcodeProductModal.caloriesPer100g ?? 0)
    : 0;
  const baseProtein = barcodeProductModal
    ? (barcodeProductModal.servingProtein ?? barcodeProductModal.proteinPer100g ?? 0)
    : 0;
  const baseCarbs = barcodeProductModal
    ? (barcodeProductModal.servingCarbs ?? barcodeProductModal.carbsPer100g ?? 0)
    : 0;
  const baseFat = barcodeProductModal
    ? (barcodeProductModal.servingFat ?? barcodeProductModal.fatPer100g ?? 0)
    : 0;

  const activeCalories = Math.round(baseCalories * quantity);
  const activeProtein = Math.round(baseProtein * quantity * 10) / 10;
  const activeCarbs = Math.round(baseCarbs * quantity * 10) / 10;
  const activeFat = Math.round(baseFat * quantity * 10) / 10;

  return (
    <View style={{ flex: 1 }}>
      {/* Live Barcode Viewfinder */}
      <View style={styles.viewfinder}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={flashOn}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#888', fontFamily: theme.fonts.medium }}>
              Camera permission required
            </Text>
          </View>
        )}

        {/* Viewfinder Target Frame */}
        <View style={[styles.scanFrame, styles.barcodeScanFrame]}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {!isBarcodeLoading ? (
            <View style={styles.barcodeLaserLine} />
          ) : null}

          {isBarcodeLoading ? (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.saffron} />
              <View style={styles.analyzingRow}>
                <ScanBarcode size={18} color={theme.colors.saffron} />
                <Text style={styles.analyzingText}>Looking up barcode nutrition...</Text>
              </View>
            </View>
          ) : (
            <View style={styles.targetHint}>
              <Text style={styles.targetHintText}>Align barcode inside rectangle frame</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Flash Toggle */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onToggleFlash}
          style={styles.sideBtn}
        >
          {flashOn ? <Zap size={22} color="#FDD922" /> : <ZapOff size={22} color="#FFFFFF" />}
        </TouchableOpacity>

        {/* Center Button: Simulator Demo or Quick Test */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            // Quick test with sample barcode (Mì Hảo Hảo Tôm Chua Cay)
            // fetchBarcodeProduct('8934069094050');
          }}
          disabled={isBarcodeLoading}
          style={[styles.shutterOuter, isBarcodeLoading && styles.btnDisabled]}
        >
          <View style={styles.shutterInner}>
            <ScanBarcode size={26} color="#131313" />
          </View>
        </TouchableOpacity>

        {/* Hidden Gallery Button on Barcode Mode (Keeping center shutter balanced) */}
        <View style={{ width: 46, height: 46 }} />
      </View>

      {/* Scanned Barcode Product Modal (Packaged/Serving Based) */}
      <Modal
        visible={!!barcodeProductModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setBarcodeProductModal(null);
          setScannedBarcode(null);
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalBackdrop}>
            <View style={styles.barcodeModalCard}>
              {/* Header */}
              <View style={styles.barcodeHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.barcodeBrandBadge}>
                    {barcodeProductModal?.brand || 'Packaged Product'}
                  </Text>
                  <Text style={styles.barcodeProductName} numberOfLines={2}>
                    {barcodeProductModal?.name}
                  </Text>
                  <Text style={styles.barcodeNumberText}>
                    Barcode: {barcodeProductModal?.barcode || 'N/A'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setBarcodeProductModal(null);
                    setScannedBarcode(null);
                  }}
                  style={styles.hintCloseBtn}
                  activeOpacity={0.7}
                >
                  <X size={18} color="#777" />
                </TouchableOpacity>
              </View>

              {/* Nutrition Highlights Card */}
              <View style={styles.barcodeNutriBox}>
                <View style={styles.barcodeNutriItem}>
                  <Text style={styles.barcodeNutriVal}>{activeCalories}</Text>
                  <Text style={styles.barcodeNutriLabel}>{energyUnit}</Text>
                </View>
                <View style={styles.barcodeNutriDivider} />
                <View style={styles.barcodeNutriItem}>
                  <Text style={styles.barcodeNutriVal}>{activeProtein}g</Text>
                  <Text style={styles.barcodeNutriLabel}>Protein</Text>
                </View>
                <View style={styles.barcodeNutriDivider} />
                <View style={styles.barcodeNutriItem}>
                  <Text style={styles.barcodeNutriVal}>{activeCarbs}g</Text>
                  <Text style={styles.barcodeNutriLabel}>Carbs</Text>
                </View>
                <View style={styles.barcodeNutriDivider} />
                <View style={styles.barcodeNutriItem}>
                  <Text style={styles.barcodeNutriVal}>{activeFat}g</Text>
                  <Text style={styles.barcodeNutriLabel}>Fat</Text>
                </View>
              </View>

              {/* Serving Size & Quantity Stepper */}
              <View style={styles.portionInputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.portionLabel}>Serving Size:</Text>
                  <Text style={{ fontFamily: theme.fonts.medium, fontSize: 13, color: '#2E7D32', marginTop: 2 }}>
                    {barcodeProductModal?.servingSizeDescription || '1 package'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setQuantity((q) => Math.max(0.5, Math.round((q - 0.5) * 10) / 10))}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: '#F1F5F9',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
                  >
                    <Minus size={16} color="#334155" />
                  </TouchableOpacity>

                  <View style={styles.gramPill}>
                    <Text style={{ fontFamily: theme.fonts.bold, fontSize: 15, color: theme.colors.textPrimary }}>
                      {quantity}
                    </Text>
                    <Text style={styles.gramPillUnit}>serving</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setQuantity((q) => Math.round((q + 0.5) * 10) / 10)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: '#F1F5F9',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color="#334155" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={[styles.barcodeActionButtons, { marginTop: 20 }]}>
                <TouchableOpacity
                  style={styles.scanAgainBtn}
                  onPress={() => {
                    setBarcodeProductModal(null);
                    setScannedBarcode(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scanAgainText}>Scan Another</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmLogBtn, savingBarcodeMeal && styles.btnDisabled]}
                  onPress={handleSaveBarcodeProduct}
                  disabled={savingBarcodeMeal}
                  activeOpacity={0.85}
                >
                  {savingBarcodeMeal ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmLogText}>
                      Log Meal ({activeCalories} {energyUnit})
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Manual Barcode Input Modal */}
      <Modal
        visible={showManualModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowManualModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalBackdropCenter}>
            <View style={[styles.successCard, { padding: 20 }]}>
              <View style={styles.successIconWrap}>
                <KeyboardIcon size={30} color="#2E7D32" />
              </View>
              <Text style={styles.successTitle}>Enter Barcode</Text>
              <Text style={[styles.successSubtitle, { marginBottom: 14 }]}>
                Type the barcode digits printed under the product code
              </Text>

              <TextInput
                style={{
                  width: '100%',
                  backgroundColor: '#F8F9FA',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  fontFamily: theme.fonts.bold,
                  textAlign: 'center',
                  letterSpacing: 2,
                  marginBottom: 16,
                }}
                placeholder="e.g. 8934069094050"
                placeholderTextColor="#999"
                value={manualCodeInput}
                onChangeText={setManualCodeInput}
                keyboardType="numeric"
                autoFocus
              />

              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <TouchableOpacity
                  style={[styles.scanAgainBtn, { flex: 1 }]}
                  onPress={() => setShowManualModal(false)}
                >
                  <Text style={styles.scanAgainText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmLogBtn, { flex: 1.5 }]}
                  onPress={handleManualSubmit}
                >
                  <Text style={styles.confirmLogText}>Search</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={!!barcodeSuccessModal?.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setBarcodeSuccessModal(null)}
      >
        <View style={styles.modalBackdropCenter}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <CheckCircle2 size={36} color="#2E7D32" />
            </View>
            <Text style={styles.successTitle}>Packaged Food Logged!</Text>
            <Text style={styles.successSubtitle}>
              <Text style={{ fontWeight: '700', color: '#1B281B' }}>
                {barcodeSuccessModal?.name}
              </Text>{' '}
              ({barcodeSuccessModal?.calories} {energyUnit}) added to your daily diary.
            </Text>
            <TouchableOpacity
              style={styles.successPrimaryBtn}
              onPress={() => {
                setBarcodeSuccessModal(null);
                router.replace('/(main)/meals');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.successPrimaryText}>View Meal Diary</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
