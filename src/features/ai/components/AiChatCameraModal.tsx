import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {
  X,
  Zap,
  ZapOff,
  Image as ImageIcon,
  Camera,
  Sparkles,
} from 'lucide-react-native';
import { FONTS, PALETTE, RADIUS } from '../../../constants/theme';

export interface CapturedChatImage {
  uri: string;
  base64: string;
  mimeType: string;
}

interface AiChatCameraModalProps {
  visible: boolean;
  subtitle?: string;
  onClose: () => void;
  onImageCaptured: (image: CapturedChatImage) => void;
}

export function AiChatCameraModal({
  visible,
  subtitle = 'Snap a meal or nutrition label to ask AI Coach',
  onClose,
  onImageCaptured,
}: AiChatCameraModalProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      if (cameraRef.current && permission?.granted) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.65,
          base64: true,
        });
        if (photo?.uri && photo?.base64) {
          onImageCaptured({
            uri: photo.uri,
            base64: photo.base64,
            mimeType: 'image/jpeg',
          });
          return;
        }
      }

      // Fallback to native camera picker
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Permission', 'Please allow camera access to take a photo for AI Coach.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.65,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]?.base64) {
        const asset = result.assets[0];
        onImageCaptured({
          uri: asset.uri,
          base64: asset.base64!,
          mimeType: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err?.message || 'Could not capture photo.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickGallery = async () => {
    if (isCapturing) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Gallery Permission', 'Please allow photo library access to attach a photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.65,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]?.base64) {
        const asset = result.assets[0];
        onImageCaptured({
          uri: asset.uri,
          base64: asset.base64!,
          mimeType: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err?.message || 'Could not select image.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>

          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            activeOpacity={0.75}
            onPress={onClose}
            accessibilityLabel="Close camera"
          >
            <X size={22} color="#FFFFFF" strokeWidth={2.3} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitleText}>{subtitle}</Text>

        {/* Camera Viewfinder */}
        <View style={styles.viewfinderWrap}>
          {permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
              enableTorch={flashOn}
            />
          ) : (
            <View style={styles.permissionBox}>
              <Camera size={40} color={PALETTE.saffron} strokeWidth={2} />
              <Text style={styles.permissionTitle}>Camera access for AI Coach</Text>
              <Text style={styles.permissionSub}>
                Allow camera access to snap meals directly inside your AI Coach chat, or pick a photo from your gallery below.
              </Text>
              <TouchableOpacity
                style={styles.permissionBtn}
                activeOpacity={0.85}
                onPress={requestPermission}
              >
                <Text style={styles.permissionBtnText}>Enable Camera</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Frame Corners */}
          <View style={[styles.corner, styles.cornerTL]} pointerEvents="none" />
          <View style={[styles.corner, styles.cornerTR]} pointerEvents="none" />
          <View style={[styles.corner, styles.cornerBL]} pointerEvents="none" />
          <View style={[styles.corner, styles.cornerBR]} pointerEvents="none" />
        </View>

        {/* Bottom Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.sideControlBtn}
            activeOpacity={0.75}
            onPress={() => setFlashOn((prev) => !prev)}
          >
            {flashOn ? (
              <Zap size={22} color={PALETTE.saffron} />
            ) : (
              <ZapOff size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shutterOuter}
            activeOpacity={0.85}
            onPress={handleCapture}
            disabled={isCapturing}
          >
            <View style={styles.shutterInner}>
              {isCapturing ? (
                <ActivityIndicator size="small" color={PALETTE.onyx} />
              ) : (
                <Camera size={26} color={PALETTE.onyx} strokeWidth={2.3} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideControlBtn}
            activeOpacity={0.75}
            onPress={handlePickGallery}
          >
            <ImageIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111210',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  viewfinderWrap: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#1C1E1B',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  permissionBox: {
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 10,
  },
  permissionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 6,
  },
  permissionSub: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  permissionBtn: {
    marginTop: 10,
    backgroundColor: PALETTE.saffron,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  permissionBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: PALETTE.saffron,
  },
  cornerTL: {
    top: 24,
    left: 24,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 14,
  },
  cornerTR: {
    top: 24,
    right: 24,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 14,
  },
  cornerBL: {
    bottom: 24,
    left: 24,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 14,
  },
  cornerBR: {
    bottom: 24,
    right: 24,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 14,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
    paddingVertical: 26,
  },
  sideControlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3.5,
    borderColor: PALETTE.saffron,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  shutterInner: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AiChatCameraModal;
