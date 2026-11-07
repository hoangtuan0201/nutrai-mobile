import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { ArrowLeft } from 'lucide-react-native';
import { cameraStyles as styles } from '../../../src/features/meals/components/camera/camera.styles';
import { ScanFoodSection } from '../../../src/features/meals/components/camera/ScanFoodSection';
import { BarcodeSection } from '../../../src/features/meals/components/camera/BarcodeSection';

type ScanMode = 'SCAN_FOOD' | 'BARCODE';

export default function AICameraScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    from?: string;
    originFrom?: string;
    mode?: string;
    mealType?: string;
    date?: string;
  }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState<ScanMode>(
    params.mode === 'BARCODE' ? 'BARCODE' : 'SCAN_FOOD',
  );
  const [flashOn, setFlashOn] = useState(false);
  // Session key to force complete remount & state reset on tab change or screen focus
  const [sessionKey, setSessionKey] = useState<number>(() => Date.now());

  const handleBack = useCallback(() => {
    if (params.from === 'add') {
      router.replace({
        pathname: '/(main)/meals/add',
        params: {
          from: params.originFrom || 'log',
          mealType: params.mealType,
          date: params.date,
        },
      });
      return;
    }
    if (params.from === 'log') {
      router.replace({
        pathname: '/(main)/meals',
        params: params.date ? { date: params.date } : undefined,
      });
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/meals');
    }
  }, [params, router]);

  // Reset all state whenever user navigates away or returns to this screen & register hardware back handler
  useFocusEffect(
    useCallback(() => {
      setSessionKey(Date.now());
      setFlashOn(false);

      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        setFlashOn(false);
        subscription.remove();
      };
    }, [handleBack])
  );

  const handleSwitchMode = async (mode: ScanMode) => {
    if (mode === 'BARCODE' && !permission?.granted) {
      await requestPermission();
    }
    setFlashOn(false);
    setScanMode(mode);
    setSessionKey(Date.now()); // Completely resets sub-component state
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleBack}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {scanMode === 'SCAN_FOOD' ? 'Scan Food' : 'Scan Barcode'}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Mode Switcher: Scan Food & Barcode */}
      <View style={styles.modeSwitcherWrap}>
        <View style={styles.modeSwitcher}>
          <TouchableOpacity
            style={[styles.modeTab, scanMode === 'SCAN_FOOD' && styles.modeTabActive]}
            onPress={() => handleSwitchMode('SCAN_FOOD')}
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
            onPress={() => handleSwitchMode('BARCODE')}
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
        </View>
      </View>

      {/* Dynamic Sub-Components with complete State Isolation */}
      {scanMode === 'SCAN_FOOD' ? (
        <ScanFoodSection
          key={`scan-food-${sessionKey}`}
          permission={permission}
          flashOn={flashOn}
          onToggleFlash={() => setFlashOn((prev) => !prev)}
        />
      ) : (
        <BarcodeSection
          key={`barcode-${sessionKey}`}
          permission={permission}
          flashOn={flashOn}
          onToggleFlash={() => setFlashOn((prev) => !prev)}
        />
      )}
    </SafeAreaView>
  );
}
