import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Clock, Plus, Bookmark, Sparkles } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Card, Pill, Input } from '../../src/components';

export default function RecipeDiscoveryScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'High Protein', 'Under 500 kcal', 'Low Carb', 'Quick (<20m)'];

  const recipes = [
    {
      id: 1,
      title: 'Mediterranean Quinoa Salmon Bowl',
      calories: 520,
      protein: 42,
      carbs: 38,
      fat: 18,
      time: '20 min',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      tag: 'High Protein',
    },
    {
      id: 2,
      title: 'Creamy Avocado Poached Egg Toast',
      calories: 380,
      protein: 16,
      carbs: 26,
      fat: 22,
      time: '12 min',
      image: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=400&auto=format&fit=crop&q=80',
      tag: 'Quick',
    },
    {
      id: 3,
      title: 'Asian Glazed Teriyaki Chicken Breast',
      calories: 460,
      protein: 48,
      carbs: 18,
      fat: 14,
      time: '25 min',
      image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&auto=format&fit=crop&q=80',
      tag: 'Low Carb',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe Discovery</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.backBtn}>
          <Bookmark size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <Input
          placeholder="Search healthy recipes, ingredients..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color={theme.colors.textSecondary} />}
          rounded="full"
          containerStyle={styles.searchContainer}
        />

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {filters.map((f) => {
            const isSelected = activeFilter === f;
            return (
              <Pill
                key={f}
                label={f}
                variant={isSelected ? 'saffron' : 'outline'}
                active={isSelected}
                size="md"
                onPress={() => setActiveFilter(f)}
              />
            );
          })}
        </ScrollView>

        {/* AI Recommendations Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Sparkles size={18} color={theme.colors.saffron} />
            <Text style={styles.sectionTitle}>AI Suggested for Your Goal</Text>
          </View>
          <Text style={styles.sectionSub}>Targeted to fit your remaining 560 kcal</Text>
        </View>

        {/* Recipes List */}
        <View style={styles.recipesList}>
          {recipes.map((item) => (
            <Card key={item.id} padding="none" style={styles.recipeCard}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.recipeImg} />
                <View style={styles.calPill}>
                  <Text style={styles.calPillText}>{item.calories} kcal</Text>
                </View>
              </View>

              <View style={styles.recipeBody}>
                <Text style={styles.recipeTitle}>{item.title}</Text>

                {/* Macros and Time */}
                <View style={styles.recipeMetaRow}>
                  <View style={styles.timeTag}>
                    <Clock size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.timeText}>{item.time}</Text>
                  </View>

                  <View style={styles.macroPillsRow}>
                    <Text style={[styles.mDotText, { color: theme.colors.green }]}>
                      C: {item.carbs}g
                    </Text>
                    <Text style={[styles.mDotText, { color: theme.colors.blue }]}>
                      P: {item.protein}g
                    </Text>
                    <Text style={[styles.mDotText, { color: theme.colors.yellow }]}>
                      F: {item.fat}g
                    </Text>
                  </View>
                </View>

                {/* Add to Log Button */}
                <Button
                  title="Add to Today's Meals"
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus size={16} color={theme.colors.saffron} />}
                  onPress={() => router.push('/(main)/meals/add')}
                />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBase,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenMargin,
    paddingVertical: theme.spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(19, 19, 19, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: theme.spacing.xs,
    paddingBottom: 40,
  },
  searchContainer: {
    marginBottom: theme.spacing.sm,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    marginBottom: theme.spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  sectionSub: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  recipesList: {
    gap: 16,
  },
  recipeCard: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  recipeImg: {
    width: '100%',
    height: '100%',
  },
  calPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(19, 19, 19, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  calPillText: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  recipeBody: {
    padding: theme.spacing.md,
  },
  recipeTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  macroPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mDotText: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
  },
});
