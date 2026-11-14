/**
 * birth-year.tsx — Onboarding Step 3: "What's your birth year?"
 * Vertical year wheel selector matching image2.png with fixed center selection slot.
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '../../src/constants';
import { Button, OnboardingHeader } from '../../src/components';
import { useOnboardingStore } from '../../src/store/onboardingStore';

const ITEM_HEIGHT = 56;
const VISIBLE_COUNT = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1940;
const MAX_YEAR = CURRENT_YEAR - 12; // At least 12 years old

export default function BirthYearScreen() {
  const router = useRouter();
  const setBirthYear = useOnboardingStore((s) => s.setBirthYear);
  const storedAge = useOnboardingStore((s) => s.age);
  const storedDob = useOnboardingStore((s) => s.dateOfBirth);

  // Generate list of years from MAX_YEAR down to MIN_YEAR
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = MAX_YEAR; y >= MIN_YEAR; y--) {
      list.push(y);
    }
    return list;
  }, []);

  // Determine initial selected year
  const initialYear = useMemo(() => {
    if (storedDob) {
      const parsed = parseInt(storedDob.split('-')[0], 10);
      if (parsed >= MIN_YEAR && parsed <= MAX_YEAR) return parsed;
    }
    if (storedAge) {
      const calculated = CURRENT_YEAR - storedAge;
      if (calculated >= MIN_YEAR && calculated <= MAX_YEAR) return calculated;
    }
    return CURRENT_YEAR - 26; // Default ~26 years old
  }, [storedDob, storedAge]);

  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const flatListRef = useRef<FlatList<number>>(null);

  const initialIndex = useMemo(() => {
    const idx = years.indexOf(initialYear);
    return idx >= 0 ? idx : Math.floor(years.length / 2);
  }, [years, initialYear]);

  // Scroll to initial index on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: initialIndex,
        animated: false,
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [initialIndex]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(years.length - 1, index));
    const year = years[clampedIndex];
    if (year && year !== selectedYear) {
      setSelectedYear(year);
    }
  };

  const handleSelectYear = (year: number, index: number) => {
    setSelectedYear(year);
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
  };

  const calculatedAge = CURRENT_YEAR - selectedYear;

  const handleNext = () => {
    setBirthYear(selectedYear);
    router.push('/(auth)/height' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingHeader step={3} totalSteps={7} />

      <View style={styles.body}>
        <Text style={styles.title}>What's your{'\n'}birth year?</Text>
        <Text style={styles.subtitle}>
          Age is a key factor in calculating your metabolic rate and daily caloric burn.
        </Text>

        {/* Central Wheel Picker Area */}
        <View style={styles.pickerContainer}>
          {/* Static fixed center selection slot behind the text */}
          <View pointerEvents="none" style={styles.centerSlot} />

          <FlatList
            ref={flatListRef}
            data={years}
            keyExtractor={(item) => item.toString()}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.listContent}
            getItemLayout={(_, index) => ({
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index,
              index,
            })}
            renderItem={({ item, index }) => {
              const selectedIdx = years.indexOf(selectedYear);
              const distance = Math.abs(selectedIdx - index);
              const isSelected = distance === 0;

              return (
                <TouchableOpacity
                  style={styles.yearItem}
                  activeOpacity={0.7}
                  onPress={() => handleSelectYear(item, index)}
                >
                  <Text
                    style={[
                      styles.yearText,
                      isSelected && styles.yearTextActive,
                      distance === 1 && styles.yearTextNear,
                      distance >= 2 && styles.yearTextFar,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Calculated Age Pill */}
        <View style={styles.agePill}>
          <Text style={styles.agePillText}>
            Age:{' '}
            <Text style={styles.agePillValue}>{calculatedAge} years old</Text>
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Continue"
          size="lg"
          variant="primary"
          fullWidth
          onPress={handleNext}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBase,
  },
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 30,
    lineHeight: 38,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    marginBottom: 28,
    alignSelf: 'flex-start',
  },
  pickerContainer: {
    height: CONTAINER_HEIGHT,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSlot: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 20,
    right: 20,
    height: ITEM_HEIGHT,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 145, 20, 0.40)',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    zIndex: 0,
  },
  listContent: {
    paddingVertical: ITEM_HEIGHT * 2,
    alignItems: 'center',
    zIndex: 1,
  },
  yearItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: 260,
  },
  yearText: {
    fontFamily: theme.fonts.medium,
    fontSize: 22,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  yearTextActive: {
    fontFamily: theme.fonts.bold,
    fontSize: 32,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  yearTextNear: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 22,
    color: 'rgba(19, 19, 19, 0.38)',
  },
  yearTextFar: {
    fontFamily: theme.fonts.regular,
    fontSize: 18,
    color: 'rgba(19, 19, 19, 0.16)',
  },
  agePill: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(19, 19, 19, 0.08)',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  agePillText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  agePillValue: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary,
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingBottom: 32,
    paddingTop: 12,
  },
});
