import React, { useState, useRef } from 'react';
import {
  View,
  Text,
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
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, PermissionResponse } from 'expo-camera';
import {
  Zap,
  ZapOff,
  Image as ImageIcon,
  Camera,
  Sparkles,
  X,
  Send,
} from 'lucide-react-native';
import { theme } from '../../../../constants';
import { mealsApi } from '../../api/meals.api';
import { useAiScanStore } from '../../../../store/aiScanStore';
import { cameraStyles as styles } from './camera.styles';

interface CapturedPhotoData {
  uri: string;
  base64?: string | null;
  mimeType?: string;
}

interface ScanFoodSectionProps {
  permission: PermissionResponse | null;
  flashOn: boolean;
  onToggleFlash: () => void;
}

export const ScanFoodSection: React.FC<ScanFoodSectionProps> = ({
  permission,
  flashOn,
  onToggleFlash,
}) => {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const { setScanData } = useAiScanStore();

  const [isScanning, setIsScanning] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<CapturedPhotoData | null>(null);
  const [foodHint, setFoodHint] = useState('');
  const [showHintModal, setShowHintModal] = useState(false);

  const onPhotoCaptured = (photo: CapturedPhotoData) => {
    setPendingPhoto(photo);
    setPreviewUri(photo.uri);
    setFoodHint('');
    setShowHintModal(true);
  };

  const handleCapture = async () => {
    try {
      if (cameraRef.current && permission?.granted) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
        });

        if (photo && photo.uri) {
          onPhotoCaptured({
            uri: photo.uri,
            base64: photo.base64,
            mimeType: 'image/jpeg',
          });
          return;
        }
      }

      // Fallback if camera ref is unavailable or running on simulator
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
      Alert.alert('Camera Error', error?.message || 'Could not take food photo.');
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

      // Verify that food items were actually detected in the photo
      const noFoodFound =
        !scanResult ||
        !scanResult.items ||
        scanResult.items.length === 0 ||
        scanResult.confidence === 0 ||
        scanResult.mealName?.toLowerCase().includes('unknown') ||
        scanResult.mealName?.toLowerCase().includes('no food') ||
        scanResult.advice?.toLowerCase().includes('no food detected');

      if (noFoodFound) {
        setIsScanning(false);
        setFoodHint('');
        setPendingPhoto(null);
        setPreviewUri(null);

        Alert.alert(
          'No Food Detected',
          scanResult?.advice || 'We could not detect any food in this photo. Please make sure your meal is well-lit and clearly centered, then try again.',
          [
            { text: 'Retake Photo', style: 'default' },
            {
              text: 'Add Manually',
              onPress: () => router.push('/(main)/meals/add'),
            },
          ],
        );
        return;
      }

      setScanData({
        imageUri: photo.uri,
        scanResult,
        mealType: 'LUNCH',
        foodHint: hint?.trim() || undefined,
      });

      setIsScanning(false);
      setFoodHint('');
      setPendingPhoto(null);
      setPreviewUri(null);
      router.push('/(main)/meals/ai-breakdown');
    } catch (err: any) {
      setIsScanning(false);
      setPendingPhoto(null);
      setPreviewUri(null);
      const msg = err?.response?.data?.message || err?.message || 'Failed to scan food with AI. Please try again.';
      Alert.alert('Scan Failed', msg, [
        { text: 'Try Again', style: 'default' },
        {
          text: 'Add Manually',
          onPress: () => router.push('/(main)/meals/add'),
        },
      ]);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Live Camera Viewfinder */}
      <View style={styles.viewfinder}>
        {permission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={flashOn}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#888', fontFamily: theme.fonts.medium }}>
              Camera permission required
            </Text>
          </View>
        )}

        {/* Temporary preview if photo captured and analyzing */}
        {previewUri && isScanning ? (
          <Image source={{ uri: previewUri }} style={styles.cameraBackground} />
        ) : null}

        {/* Target Frame Overlay */}
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

        {/* Shutter Capture Button */}
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
          if (!isScanning) {
            setShowHintModal(false);
            setPreviewUri(null);
          }
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardWrap}
            >
              <View style={styles.hintModalCard}>
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
                    onPress={() => {
                      setShowHintModal(false);
                      setPreviewUri(null);
                    }}
                    style={styles.hintCloseBtn}
                    activeOpacity={0.7}
                  >
                    <X size={18} color="#777" />
                  </TouchableOpacity>
                </View>

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
    </View>
  );
};
