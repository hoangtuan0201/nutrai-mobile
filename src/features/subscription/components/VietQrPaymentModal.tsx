import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import { CheckCircle2, Clock, Copy, Download, QrCode, ShieldCheck, X } from 'lucide-react-native';
import { useSubscriptionStore } from '../../../store/subscriptionStore';
import { subscriptionApi } from '../api/subscription.api';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { CancelPaymentModal } from './CancelPaymentModal';

export function VietQrPaymentModal() {
  const { colors, isDark } = useAppTheme();
  const {
    isPro,
    isQrModalVisible,
    activeCheckout,
    closeQrModal,
    cancelCheckout,
    handlePaymentCompleted,
  } = useSubscriptionStore();

  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [isQrLoading, setIsQrLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isExpiredNotice, setIsExpiredNotice] = useState(false);

  const sepay = activeCheckout?.sepay;
  const paymentId = activeCheckout?.paymentId;

  // Reset QR loading state whenever new QR url arrives
  useEffect(() => {
    setIsQrLoading(true);
  }, [sepay?.qrUrl]);

  // Reset countdown timer when modal opens with a new checkout; auto-close when expired
  useEffect(() => {
    if (!isQrModalVisible || !activeCheckout) return;

    const expiryTime = activeCheckout.expiresAt
      ? new Date(activeCheckout.expiresAt).getTime()
      : Date.now() + 15 * 60 * 1000;

    let timerId: ReturnType<typeof setInterval>;

    const updateTimer = () => {
      const diff = Math.floor((expiryTime - Date.now()) / 1000);
      if (diff <= 0) {
        clearInterval(timerId);
        setSecondsLeft(0);
        setIsExpiredNotice(true);
        setShowConfirmModal(true);
        return;
      }
      setSecondsLeft(diff);
    };

    updateTimer();
    timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [isQrModalVisible, activeCheckout]);

  // Auto-poll payment status every 3.5 seconds while modal is open
  useEffect(() => {
    if (!isQrModalVisible || !paymentId) return;

    let isMounted = true;
    const pollStatus = async () => {
      try {
        const res = await subscriptionApi.getPaymentStatus(paymentId);
        if (isMounted && res.status === 'COMPLETED') {
          await handlePaymentCompleted();
        }
      } catch {
        // Ignore transient network errors during background polling
      }
    };

    const intervalId = setInterval(pollStatus, 3500);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [isQrModalVisible, paymentId, handlePaymentCompleted]);

  const handleSaveQrImage = async () => {
    if (!sepay?.qrUrl || isSavingImage) return;
    setIsSavingImage(true);
    try {
      if (Platform.OS === 'web') {
        const res = await fetch(sepay.qrUrl);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VietQR_${sepay.transferContent}.png`;
        a.click();
        window.URL.revokeObjectURL(url);
        Alert.alert('Success', 'QR code image downloaded successfully.');
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please grant Photos permission in Settings to save the VietQR code.',
          );
          return;
        }

        const filename = `vietqr_${sepay.transferContent}.png`;
        const localUri = `${FileSystem.cacheDirectory}${filename}`;
        const downloadRes = await FileSystem.downloadAsync(sepay.qrUrl, localUri);
        await MediaLibrary.saveToLibraryAsync(downloadRes.uri);
        Alert.alert(
          'Saved to Photos',
          'VietQR image saved to your photo album. Open your banking app to scan it directly from Photos.',
        );
      }
    } catch (err: any) {
      console.warn('Failed to save QR image:', err);
      Alert.alert(
        'Could Not Save',
        'Unable to save image directly. You can take a screenshot of this QR code to scan in your banking app.',
      );
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleCopy = async (label: string, value: string) => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(value);
      } else {
        await Share.share({ message: value, title: label });
      }
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Ignore cancel
    }
  };

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!activeCheckout || !sepay) return null;

  return (
    <Modal
      visible={isQrModalVisible}
      animationType="slide"
      transparent
      onRequestClose={closeQrModal}
    >
      <View style={styles.overlay}>
        <SafeAreaView
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E5E7EB',
            },
          ]}
          edges={['top', 'bottom']}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <QrCode size={20} color="#D9822B" />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                VietQR Bank Transfer
              </Text>
            </View>
            <TouchableOpacity onPress={closeQrModal} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Countdown Pill */}
            <View style={styles.timerRow}>
              <View style={styles.timerPill}>
                <Clock size={14} color="#9A4A17" />
                <Text style={styles.timerText}>
                  Expires in {formatCountdown(secondsLeft)}
                </Text>
              </View>
            </View>

            {/* VietQR Image Box */}
            <View style={styles.qrContainer}>
              <View style={styles.qrImageWrapper}>
                {isQrLoading && (
                  <View style={styles.qrLoadingBox}>
                    <ActivityIndicator size="large" color="#D9822B" />
                    <Text style={styles.qrLoadingText}>Loading VietQR...</Text>
                  </View>
                )}
                <Image
                  source={{ uri: sepay.qrUrl }}
                  style={[styles.qrImage, isQrLoading && styles.qrImageHidden]}
                  resizeMode="contain"
                  onLoadStart={() => setIsQrLoading(true)}
                  onLoadEnd={() => setIsQrLoading(false)}
                />
              </View>
              <Text style={styles.qrHint}>
                Open any Banking App and scan this VietQR code
              </Text>

              {/* Save QR Image Button */}
              <TouchableOpacity
                style={[
                  styles.saveQrBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 145, 20, 0.12)' : '#FFF3E0',
                    borderColor: isDark ? 'rgba(255, 145, 20, 0.3)' : '#FFE0B2',
                  },
                ]}
                activeOpacity={0.8}
                onPress={handleSaveQrImage}
                disabled={isSavingImage}
              >
                {isSavingImage ? (
                  <ActivityIndicator size="small" color="#D9822B" />
                ) : (
                  <>
                    <Download size={15} color="#D9822B" strokeWidth={2.4} />
                    <Text style={styles.saveQrBtnText}>Save QR Code to Photos</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Bank Details Table */}
            <View
              style={[
                styles.detailsCard,
                {
                  backgroundColor: isDark ? colors.background : '#F9FAFB',
                  borderColor: isDark ? colors.border : '#E5E7EB',
                },
              ]}
            >
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Bank</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {sepay.bankName}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.detailRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Account Number
                  </Text>
                  <Text
                    selectable
                    style={[styles.detailValue, { color: colors.textPrimary }]}
                  >
                    {sepay.accountNumber}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => handleCopy('Account Number', sepay.accountNumber)}
                >
                  {copiedField === 'Account Number' ? (
                    <CheckCircle2 size={14} color="#16A34A" />
                  ) : (
                    <Copy size={14} color="#D9822B" />
                  )}
                  <Text style={styles.copyBtnText}>
                    {copiedField === 'Account Number' ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Account Holder
                </Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {sepay.accountHolder}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.detailRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Amount</Text>
                  <Text
                    selectable
                    style={[styles.detailValueBold, { color: colors.textPrimary }]}
                  >
                    {sepay.amount.toLocaleString('vi-VN')}đ
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => handleCopy('Amount', String(sepay.amount))}
                >
                  <Copy size={14} color="#D9822B" />
                  <Text style={styles.copyBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.detailRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Transfer Content (Required)
                  </Text>
                  <Text selectable style={styles.transferCodeText}>
                    {sepay.transferContent}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => handleCopy('Transfer Content', sepay.transferContent)}
                >
                  <Copy size={14} color="#D9822B" />
                  <Text style={styles.copyBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Live Polling Indicator */}
            <View style={styles.pollingRow}>
              <ActivityIndicator size="small" color="#D9822B" />
              <Text style={[styles.pollingText, { color: colors.textSecondary }]}>
                Waiting for bank confirmation... Pro activates automatically.
              </Text>
            </View>

            <View style={styles.secureNoteRow}>
              <ShieldCheck size={14} color="#65B741" />
              <Text style={[styles.secureNoteText, { color: colors.textSecondary }]}>
                Secured by SePay VietQR · Instant automatic activation
              </Text>
            </View>

            {/* In-Modal Direct Cancel Button */}
            <TouchableOpacity
              style={styles.cancelLink}
              activeOpacity={0.7}
              onPress={() => {
                setIsExpiredNotice(false);
                setShowConfirmModal(true);
              }}
            >
              <Text style={[styles.cancelLinkText, { color: colors.textSecondary }]}>
                {isPro ? 'Cancel Pro Extension' : 'Cancel this payment session'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* NutraAI Custom Confirmation Modal */}
      <CancelPaymentModal
        visible={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setIsExpiredNotice(false);
        }}
        onConfirmCancel={() => {
          setShowConfirmModal(false);
          setIsExpiredNotice(false);
          void cancelCheckout();
        }}
        isPro={isPro}
        isExpiredNotice={isExpiredNotice}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  card: {
    flex: 1,
    maxHeight: '95%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Manrope_800ExtraBold',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  timerRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FCE7D6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  timerText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: '#9A4A17',
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  qrImageWrapper: {
    width: 210,
    height: 210,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrLoadingBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    gap: 8,
  },
  qrLoadingText: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: '#6B7280',
  },
  qrImage: {
    width: 210,
    height: 210,
  },
  qrImageHidden: {
    opacity: 0,
    position: 'absolute',
  },
  qrHint: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Manrope_500Medium',
    marginTop: 8,
    textAlign: 'center',
  },
  saveQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  saveQrBtnText: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: '#D9822B',
  },
  detailsCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
  },
  detailValueBold: {
    fontSize: 16,
    fontFamily: 'Manrope_800ExtraBold',
  },
  transferCodeText: {
    fontSize: 16,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#D9822B',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  copyBtnText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: '#9A4A17',
  },
  pollingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  pollingText: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
  },
  secureNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secureNoteText: {
    fontSize: 11,
    fontFamily: 'Manrope_500Medium',
  },
  cancelLink: {
    marginTop: 18,
    marginBottom: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLinkText: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    textDecorationLine: 'underline',
  },
});

