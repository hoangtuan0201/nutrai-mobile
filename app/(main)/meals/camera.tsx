import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Zap,
  ZapOff,
  Image as ImageIcon,
  Camera,
  Sparkles,
  HelpCircle,
  X,
  Send,
} from 'lucide-react-native';
import { theme } from '../../../src/constants';
import { mealsApi } from '../../../src/features/meals/api/meals.api';
import { useAiScanStore } from '../../../src/store/aiScanStore';

interface CapturedPhotoData {
  uri: string;
  base64?: string | null;
  mimeType?: string;
}

export default function AICameraScanScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  // Modal prompt for optional food hint
  const [pendingPhoto, setPendingPhoto] = useState<CapturedPhotoData | null>(null);
  const [foodHint, setFoodHint] = useState('');
  const [showHintModal, setShowHintModal] = useState(false);

  const { setScanData } = useAiScanStore();

  const executeAiScan = async (photo: CapturedPhotoData, hint?: string) => {
    try {
      setShowHintModal(false);
      setIsScanning(true);
      setPreviewUri(photo.uri);

      if (!photo.base64) {
        throw new Error('Image data could not be captured. Please try again.');
      }

      const scanResult = await mealsApi.scanFoodWithAi({
        imageBase64: photo.base64,
        mimeType: photo.mimeType || 'image/jpeg',
        mealType: 'LUNCH',
        foodHint: hint?.trim() || undefined,
      });

      setScanData({
        imageUri: photo.uri,
        scanResult,
        mealType: 'LUNCH',
        foodHint: hint?.trim() || undefined,
      });

      setIsScanning(false);
      setFoodHint('');
      setPendingPhoto(null);
      router.push('/(main)/meals/ai-breakdown');
    } catch (err: any) {
      setIsScanning(false);
      const msg = err?.response?.data?.message || err?.message || 'Failed to scan food with AI.';
      Alert.alert('Scan Failed', msg, [
        { text: 'Try Again', style: 'default' },
        {
          text: 'Use Demo Result',
          onPress: () => {
            const demoTitle = hint?.trim() ? hint.trim() : 'Grilled Chicken with Rice';
            setScanData({
              imageUri: photo.uri,
              scanResult: {
                mealName: demoTitle,
                mealType: 'LUNCH',
                estimatedTotalCalories: 458,
                totalProtein: 38,
                totalCarbs: 52,
                totalFat: 9,
                confidence: 0.95,
                advice: 'High-protein dish with balanced carbohydrates.',
                items: [
                  {
                    name: 'White Rice',
                    caloriesPer100g: 130,
                    estimatedGrams: 200,
                    calories: 260,
                    protein: 5.4,
                    carbs: 56.4,
                    fat: 0.6,
                  },
                  {
                    name: 'Grilled Chicken',
                    caloriesPer100g: 165,
                    estimatedGrams: 120,
                    calories: 198,
                    protein: 37.2,
                    carbs: 0,
                    fat: 4.3,
                  },
                ],
              },
              mealType: 'LUNCH',
              foodHint: hint?.trim() || undefined,
            });
            setFoodHint('');
            setPendingPhoto(null);
            router.push('/(main)/meals/ai-breakdown');
          },
        },
      ]);
    }
  };

  const onPhotoCaptured = (photo: CapturedPhotoData) => {
    setPendingPhoto(photo);
    setPreviewUri(photo.uri);
    setFoodHint('');
    setShowHintModal(true);
  };

  const handleCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Camera access is required to take food photos for AI nutrition scanning.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onPhotoCaptured({
          uri: asset.uri,
          base64: asset.base64,
          mimeType: asset.mimeType,
        });
      }
    } catch (error: any) {
      Alert.alert('Camera Error', error?.message || 'Could not launch camera.');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Photo library access is required to select food images.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onPhotoCaptured({
          uri: asset.uri,
          base64: asset.base64,
          mimeType: asset.mimeType,
        });
      }
    } catch (error: any) {
      Alert.alert('Gallery Error', error?.message || 'Could not pick image.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Scan Food</Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Mode Switcher - Barcode commented out, Food Label removed */}
      <View style={styles.modeSwitcherWrap}>
        <View style={styles.modeSwitcher}>
          <TouchableOpacity
            style={[styles.modeTab, styles.modeTabActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeTabText, styles.modeTabTextActive]}>
              Scan Food
            </Text>
          </TouchableOpacity>

          {/* Barcode scanner mode - commented out as requested
          <TouchableOpacity
            style={styles.modeTab}
            activeOpacity={0.8}
          >
            <Text style={styles.modeTabText}>Barcode</Text>
          </TouchableOpacity>
          */}
        </View>
      </View>

      {/* Camera Viewfinder */}
      <View style={styles.viewfinder}>
        <Image
          source={{
            uri:
              previewUri ||
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&auto=format&fit=crop&q=80',
          }}
          style={styles.cameraBackground}
        />

        {/* Viewfinder Target Frame */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {isScanning ? (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.saffron} />
              <View style={styles.analyzingRow}>
                <Sparkles size={18} color={theme.colors.saffron} />
                <Text style={styles.analyzingText}>Gemini AI analyzing food...</Text>
              </View>
              {foodHint ? (
                <Text style={styles.analyzingSubtext} numberOfLines={1}>
                  "{foodHint}"
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.targetHint}>
              <Text style={styles.targetHintText}>Center your meal in the frame</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Controls Bar */}
      <View style={styles.bottomControls}>
        {/* Flash Toggle */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setFlashOn((prev) => !prev)}
          style={styles.sideBtn}
        >
          {flashOn ? <Zap size={22} color="#FDD922" /> : <ZapOff size={22} color="#FFFFFF" />}
        </TouchableOpacity>

        {/* Main Shutter Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleCapture}
          disabled={isScanning}
          style={[styles.shutterOuter, isScanning && styles.btnDisabled]}
        >
          <View style={styles.shutterInner}>
            <Camera size={26} color="#131313" />
          </View>
        </TouchableOpacity>

        {/* Gallery Pick Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePickFromGallery}
          disabled={isScanning}
          style={styles.sideBtn}
        >
          <ImageIcon size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Optional Food Info / Hint Modal */}
      <Modal
        visible={showHintModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isScanning) setShowHintModal(false);
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardWrap}
            >
              <View style={styles.hintModalCard}>
                {/* Modal Header */}
                <View style={styles.hintModalHeader}>
                  <View style={styles.hintTitleRow}>
                    <View style={styles.sparkleIconWrap}>
                      <Sparkles size={18} color="#2E7D32" />
                    </View>
                    <View>
                      <Text style={styles.hintModalTitle}>Food Details (Optional)</Text>
                      <Text style={styles.hintModalSubtitle}>
                        Add extra details to boost AI recognition accuracy
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowHintModal(false)}
                    style={styles.hintCloseBtn}
                    activeOpacity={0.7}
                  >
                    <X size={18} color="#777" />
                  </TouchableOpacity>
                </View>

                {/* Photo Preview Thumbnail & Hint Input */}
                <View style={styles.hintBodyRow}>
                  {pendingPhoto?.uri ? (
                    <Image
                      source={{ uri: pendingPhoto.uri }}
                      style={styles.hintPhotoPreview}
                    />
                  ) : null}

                  <View style={styles.hintInputWrap}>
                    <TextInput
                      style={styles.hintTextInput}
                      placeholder="e.g. Pho bo tai nam, Extra egg, Less oil..."
                      placeholderTextColor="#999"
                      value={foodHint}
                      onChangeText={setFoodHint}
                      autoFocus
                      returnKeyType="done"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                {/* Helpful Examples / Chips */}
                <View style={styles.chipsWrap}>
                  {['Beef Pho (Tai Nam)', 'Broken Rice with Pork', 'Chicken Salad'].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => setFoodHint(preset)}
                      style={styles.presetChip}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.presetChipText}>+ {preset}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Actions: Skip vs Analyze */}
                <View style={styles.hintActionsRow}>
                  <TouchableOpacity
                    style={styles.skipBtn}
                    onPress={() => {
                      if (pendingPhoto) executeAiScan(pendingPhoto, '');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.skipBtnText}>Skip (Image Only)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.analyzeBtn}
                    onPress={() => {
                      if (pendingPhoto) executeAiScan(pendingPhoto, foodHint);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.analyzeBtnText}>Analyze with AI</Text>
                    <Send size={15} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 60,
  },
  backText: {
    fontFamily: theme.fonts.medium,
    fontSize: 15,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  headerSpacer: {
    minWidth: 60,
  },
  modeSwitcherWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    padding: 3,
  },
  modeTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
  },
  modeTabText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  modeTabTextActive: {
    fontFamily: theme.fonts.bold,
    color: '#131313',
  },
  viewfinder: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  cameraBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'cover',
  },
  scanFrame: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    width: '80%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  analyzingOverlay: {
    backgroundColor: 'rgba(19, 19, 19, 0.85)',
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  analyzingText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  analyzingSubtext: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.saffron,
    maxWidth: 220,
    textAlign: 'center',
  },
  targetHint: {
    backgroundColor: 'rgba(19, 19, 19, 0.55)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  targetHintText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#FFFFFF',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 30,
    backgroundColor: '#000000',
  },
  sideBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  // Modal styles for optional food hint
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardWrap: {
    width: '100%',
  },
  hintModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  hintModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  hintTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sparkleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintModalTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  hintModalSubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  hintCloseBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
  },
  hintBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  hintPhotoPreview: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#EAEAEA',
  },
  hintInputWrap: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 72,
    justifyContent: 'center',
  },
  hintTextInput: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.textPrimary,
    textAlignVertical: 'top',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 18,
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipText: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: '#475569',
  },
  hintActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    color: '#475569',
  },
  analyzeBtn: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  analyzeBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
