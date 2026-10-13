import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Zap,
  ZapOff,
  Image as ImageIcon,
  Camera,
  Share2,
  Sparkles,
} from 'lucide-react-native';
import { theme } from '../../../src/constants';

type ScanMode = 'SCAN_FOOD' | 'BARCODE' | 'FOOD_LABEL';

export default function AICameraScanScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('SCAN_FOOD');

  const handleCapture = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      router.push('/(main)/meals/ai-breakdown');
    }, 1000);
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

        <Text style={styles.headerTitle}>
          {scanMode === 'SCAN_FOOD'
            ? 'Scan Food'
            : scanMode === 'BARCODE'
            ? 'Scan Barcode'
            : 'Scan Food Label'}
        </Text>

        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
          <Share2 size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Mode Switcher Segmented Pills */}
      <View style={styles.modeSwitcherWrap}>
        <View style={styles.modeSwitcher}>
          <TouchableOpacity
            style={[styles.modeTab, scanMode === 'SCAN_FOOD' && styles.modeTabActive]}
            onPress={() => setScanMode('SCAN_FOOD')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.modeTabText,
                scanMode === 'SCAN_FOOD' && styles.modeTabTextActive,
              ]}
            >
              Scan Food
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, scanMode === 'BARCODE' && styles.modeTabActive]}
            onPress={() => setScanMode('BARCODE')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.modeTabText,
                scanMode === 'BARCODE' && styles.modeTabTextActive,
              ]}
            >
              Barcode
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, scanMode === 'FOOD_LABEL' && styles.modeTabActive]}
            onPress={() => setScanMode('FOOD_LABEL')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.modeTabText,
                scanMode === 'FOOD_LABEL' && styles.modeTabTextActive,
              ]}
            >
              Food Label
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera Viewfinder */}
      <View style={styles.viewfinder}>
        {/* Placeholder food table image preview */}
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&auto=format&fit=crop&q=80',
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
              <Sparkles size={32} color={theme.colors.saffron} />
              <Text style={styles.analyzingText}>AI analyzing food items...</Text>
            </View>
          ) : (
            <View style={styles.targetHint}>
              <Text style={styles.targetHintText}>
                {scanMode === 'SCAN_FOOD'
                  ? 'Center your meal in the frame'
                  : scanMode === 'BARCODE'
                  ? 'Align barcode inside frame'
                  : 'Point at nutrition facts label'}
              </Text>
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
          style={styles.shutterOuter}
        >
          <View style={styles.shutterInner}>
            <Camera size={26} color="#131313" />
          </View>
        </TouchableOpacity>

        {/* Gallery Pick Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: '/(main)/meals/add',
              params: { from: 'log' },
            })
          }
          style={styles.sideBtn}
        >
          <ImageIcon size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
  iconBtn: {
    padding: 6,
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
    paddingHorizontal: 14,
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
    backgroundColor: 'rgba(19, 19, 19, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  analyzingText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
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
});
