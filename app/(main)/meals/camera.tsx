import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Flashlight, Image as ImageIcon, Camera, Sparkles } from 'lucide-react-native';
import { theme } from '../../../src/constants';
import { Button, Pill } from '../../../src/components';

export default function AICameraScanScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);

  const handleCapture = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      router.push('/(main)/meals/ai-breakdown');
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.iconBtn}
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Pill label="AI Vision" variant="onyx" size="sm" />
        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
          <Flashlight size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Viewfinder View */}
      <View style={styles.viewfinder}>
        {/* Placeholder food plate background */}
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
          }}
          style={styles.cameraBackground}
        />

        {/* Scan Frame */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {isScanning ? (
            <View style={styles.analyzingOverlay}>
              <Sparkles size={32} color={theme.colors.saffron} />
              <Text style={styles.analyzingText}>Analyzing food ingredients...</Text>
            </View>
          ) : (
            <View style={styles.targetHint}>
              <Text style={styles.targetHintText}>Point camera directly at your plate</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity activeOpacity={0.7} style={styles.sideControlBtn}>
          <ImageIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Shutter Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleCapture}
          style={styles.shutterOuter}
        >
          <View style={styles.shutterInner}>
            <Camera size={26} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <View style={styles.sideControlSpacer} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenMargin,
    paddingVertical: theme.spacing.md,
    zIndex: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: theme.spacing.screenMargin,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cameraBackground: {
    ...StyleSheet.absoluteFill,
    opacity: 0.85,
  },
  scanFrame: {
    width: '85%',
    height: '70%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: theme.colors.saffron,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 10,
  },
  targetHint: {
    backgroundColor: 'rgba(19, 19, 19, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  targetHintText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: '#FFFFFF',
  },
  analyzingOverlay: {
    backgroundColor: 'rgba(19, 19, 19, 0.85)',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    gap: 10,
  },
  analyzingText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 28,
  },
  sideControlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideControlSpacer: {
    width: 48,
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: theme.colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  shutterInner: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: theme.colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
