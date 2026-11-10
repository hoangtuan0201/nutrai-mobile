import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { useSubscriptionStore, PaywallSource } from '../../../store/subscriptionStore';

interface DiscoverProCardProps {
  source?: PaywallSource;
}

export function DiscoverProCard({ source = 'home_banner' }: DiscoverProCardProps) {
  const { isPro, openPaywall } = useSubscriptionStore();

  // Only display for Free users
  if (isPro) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => openPaywall(source)}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel="Go Premium, Unlock All Features"
    >
      {/* ── Background Decorative Illustration (Open Box, Cards & Sparkles) ── */}
      <View style={styles.artContainer} pointerEvents="none">
        <Svg width={140} height={78} viewBox="0 0 140 78" fill="none">
          {/* Sparkle 1 (Far left near text) */}
          <Path
            d="M 12 48 Q 12 53 17 53 Q 12 53 12 58 Q 12 53 7 53 Q 12 53 12 48 Z"
            fill="#FFF1D6"
            opacity={0.85}
          />
          {/* Sparkle 2 (Top center) */}
          <Path
            d="M 68 18 Q 68 22 72 22 Q 68 22 68 26 Q 68 22 64 22 Q 68 22 68 18 Z"
            fill="#FFF8E7"
            opacity={0.9}
          />
          {/* Sparkle 3 (Top right above button) */}
          <Path
            d="M 116 12 Q 116 16 120 16 Q 116 16 116 20 Q 116 16 112 16 Q 116 16 116 12 Z"
            fill="#FFE8C2"
            opacity={0.8}
          />

          {/* Card 1 (Tilted Reddish card in back) */}
          <G transform="translate(68, 8) rotate(14)">
            <Rect x="0" y="0" width="34" height="40" rx="4" fill="#A85434" opacity={0.9} />
            <Path d="M 6 10 L 28 10 M 6 18 L 22 18" stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeLinecap="round" />
          </G>

          {/* Card 2 (Tilted Golden card with Crown silhouette) */}
          <G transform="translate(38, 14) rotate(-8)">
            <Rect x="0" y="0" width="40" height="42" rx="4" fill="#8C633D" opacity={0.95} />
            {/* Crown silhouette */}
            <Path
              d="M 12 28 L 10 18 L 16 21 L 20 16 L 24 21 L 30 18 L 28 28 Z"
              fill="rgba(255, 235, 205, 0.45)"
            />
          </G>

          {/* Open Cardboard Box Base */}
          <Path
            d="M 28 50 L 58 46 L 98 48 L 126 54 L 122 78 L 32 78 Z"
            fill="#6E4624"
          />
          {/* Front Box Panel */}
          <Path
            d="M 32 52 L 76 56 L 122 53 L 120 78 L 32 78 Z"
            fill="#8F5E33"
          />
          {/* Front left flap */}
          <Path
            d="M 32 52 L 48 54 L 46 68 L 32 64 Z"
            fill="#A36E3E"
          />
          {/* Tape stripe down the middle */}
          <Path
            d="M 52 54 L 62 55 L 61 78 L 51 78 Z"
            fill="#C99863"
            opacity={0.7}
          />
          {/* Front right flap */}
          <Path
            d="M 88 55 L 122 53 L 118 64 L 88 66 Z"
            fill="#7C4F28"
          />
        </Svg>
      </View>

      {/* ── Text Info (Left) ── */}
      <View style={styles.textCol}>
        <Text style={styles.title}>Go Premium</Text>
        <Text style={styles.subtitle}>Unlock All Feature</Text>
      </View>

      {/* ── Upgrade Now Pill Button (Right) ── */}
      <View style={styles.upgradeBtn}>
        <Text style={styles.upgradeText}>Upgrade Now</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#352417',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(235, 176, 122, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  artContainer: {
    position: 'absolute',
    right: 8,
    bottom: -2,
    top: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  textCol: {
    flex: 1,
    paddingRight: 10,
    zIndex: 2,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#F4D5B4',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#BA9A7D',
    marginTop: 3,
  },
  upgradeBtn: {
    backgroundColor: '#F5C296',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: '#F5C296',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  upgradeText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#2D1B0E',
    letterSpacing: -0.1,
  },
});
