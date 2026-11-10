import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle, Clock } from 'lucide-react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface CancelPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmCancel: () => void;
  isPro?: boolean;
  isExpiredNotice?: boolean;
}

export function CancelPaymentModal({
  visible,
  onClose,
  onConfirmCancel,
  isPro = false,
  isExpiredNotice = false,
}: CancelPaymentModalProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E5E7EB',
            },
          ]}
        >
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: isExpiredNotice
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(217, 130, 43, 0.12)',
              },
            ]}
          >
            {isExpiredNotice ? (
              <Clock size={28} color="#EF4444" strokeWidth={2.2} />
            ) : (
              <AlertCircle size={28} color="#D9822B" strokeWidth={2.2} />
            )}
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {isExpiredNotice
              ? 'Payment Session Expired'
              : isPro
                ? 'Cancel Pro Extension?'
                : 'Cancel Payment Session?'}
          </Text>

          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {isExpiredNotice
              ? 'The 15-minute payment session has expired. If you have not transferred yet, please generate a new VietQR code to proceed.'
              : isPro
                ? 'Are you sure you want to cancel extending your Pro subscription? Your current Pro plan remains active.'
                : 'Are you sure you want to cancel this pending payment? You can create a new payment session or select a different plan anytime.'}
          </Text>

          <View style={styles.actionsRow}>
            {isExpiredNotice ? (
              <TouchableOpacity
                style={[
                  styles.btnPrimaryFull,
                  { backgroundColor: colors.textPrimary },
                ]}
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  onConfirmCancel();
                }}
              >
                <Text
                  style={[
                    styles.btnPrimaryFullText,
                    { color: colors.surface },
                  ]}
                >
                  Understood
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.btnSecondary,
                    {
                      backgroundColor: isDark ? colors.surfaceMuted : '#F3F4F6',
                      borderColor: isDark ? colors.border : '#E5E7EB',
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={onClose}
                >
                  <Text
                    style={[
                      styles.btnSecondaryText,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Keep Session
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnDestructive}
                  activeOpacity={0.85}
                  onPress={() => {
                    onClose();
                    onConfirmCancel();
                  }}
                >
                  <Text style={styles.btnDestructiveText}>Cancel Session</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  iconBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  btnDestructive: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDestructiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnPrimaryFull: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryFullText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

