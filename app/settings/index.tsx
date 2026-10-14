import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  User as UserIcon,
  Calendar,
  Sparkles,
  Target,
  Activity,
  Utensils,
  Bell,
  Moon,
  Watch,
  Shield,
  HelpCircle,
  Info,
  LogOut,
  X,
  Check,
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
  Scale,
  Ruler,
  Leaf,
  Sliders,
} from 'lucide-react-native';
import theme from '../../src/constants/theme';
import { Logo, UnitsModal } from '../../src/components';
import { useAuthStore } from '../../src/store/authStore';
import { useProfile } from '../../src/features/profile/hooks/useProfile';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import {
  useUnitStore,
  formatWeight,
  formatHeight,
  formatEnergy,
} from '../../src/store/unitStore';
import {
  calculateClientNutritionPlan,
  FitnessGoalType,
  GenderType,
  ActivityLevelType,
  kgToLb,
  lbToKg,
} from '../../src/utils/nutritionCalculator';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { profile, updateProfile, isUpdating } = useProfile();
  const onboarding = useOnboardingStore();
  const { energyUnit, foodUnit, bodyUnit } = useUnitStore();
  const [isUnitsModalOpen, setIsUnitsModalOpen] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'personal' | 'goals'>('personal');

  // Local form inputs for editing
  const [inputWeight, setInputWeight] = useState(
    String(profile?.weightKg || onboarding.weightKg || 60),
  );
  const [inputHeight, setInputHeight] = useState(
    String(profile?.heightCm || onboarding.heightCm || 174),
  );
  const [inputAge, setInputAge] = useState(
    String(onboarding.age || 21),
  );
  const [inputGender, setInputGender] = useState<GenderType>(
    (profile?.gender || onboarding.gender || 'MALE') as GenderType,
  );
  const [inputGoal, setInputGoal] = useState<'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE'>(
    profile?.fitnessGoal ||
      (onboarding.fitnessGoal === 'LOSE_WEIGHT'
        ? 'WEIGHT_LOSS'
        : onboarding.fitnessGoal === 'BUILD_MUSCLE'
        ? 'MUSCLE_GAIN'
        : 'MAINTENANCE'),
  );
  const [inputActivity, setInputActivity] = useState<ActivityLevelType>(
    (profile?.activityLevel || onboarding.activityLevel || 'MODERATE') as ActivityLevelType,
  );

  // Calculate age helper
  const calculateAge = (dobString?: string): number => {
    if (!dobString) return onboarding.age || 21;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return onboarding.age || 21;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age > 0 ? age : 21;
  };

  const userAge = profile?.dateOfBirth ? calculateAge(profile.dateOfBirth) : (onboarding.age || 21);
  const userHeight = profile?.heightCm || onboarding.heightCm || 174;
  const userWeight = profile?.weightKg || onboarding.weightKg || 60;
  const userGender = (profile?.gender || onboarding.gender || 'MALE') as GenderType;
  const userActivity = (profile?.activityLevel || onboarding.activityLevel || 'MODERATE') as ActivityLevelType;
  const userFitnessGoal = profile?.fitnessGoal ||
    (onboarding.fitnessGoal === 'LOSE_WEIGHT' ? 'WEIGHT_LOSS' : onboarding.fitnessGoal === 'BUILD_MUSCLE' ? 'MUSCLE_GAIN' : 'MAINTENANCE');

  const mappedCalcGoal: FitnessGoalType =
    userFitnessGoal === 'WEIGHT_LOSS'
      ? 'LOSE_WEIGHT'
      : userFitnessGoal === 'MUSCLE_GAIN'
      ? 'BUILD_MUSCLE'
      : 'MAINTAIN_WEIGHT';

  // Scientific calculation engine (Protein = weight * 1.8, Fat = weight * 0.9, Carbs = remainder)
  const computedPlan = calculateClientNutritionPlan({
    gender: userGender,
    weightKg: userWeight,
    heightCm: userHeight,
    age: userAge,
    activityLevel: userActivity,
    fitnessGoal: mappedCalcGoal,
  });

  // Target values: prioritize activeTarget from DB if valid, otherwise use computedPlan
  const dailyCalories = profile?.activeTarget?.dailyCalories || computedPlan.calories;
  const dailyProtein = profile?.activeTarget?.dailyProtein || computedPlan.protein;
  const dailyCarbs = profile?.activeTarget?.dailyCarbs || computedPlan.carbs;
  const dailyFat = profile?.activeTarget?.dailyFat || computedPlan.fat;

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await logout();
        router.replace('/(auth)/login');
      } catch (err) {
        console.error('Logout error:', err);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        await doLogout();
      }
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out of NutraAI?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doLogout },
    ]);
  };

  const handleOpenEdit = (type: 'personal' | 'goals') => {
    setModalType(type);
    if (bodyUnit === 'imperial') {
      setInputWeight(kgToLb(userWeight).toFixed(1));
      setInputHeight(String(Math.round(userHeight / 2.54)));
    } else {
      setInputWeight(String(userWeight));
      setInputHeight(String(userHeight));
    }
    setInputAge(String(userAge));
    setInputGender(userGender);
    setInputGoal(userFitnessGoal);
    setInputActivity(userActivity);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      let parsedWeight = parseFloat(inputWeight) || userWeight;
      let parsedHeight = parseFloat(inputHeight) || userHeight;
      if (bodyUnit === 'imperial') {
        parsedWeight = lbToKg(parsedWeight);
        parsedHeight = Math.round(parsedHeight * 2.54);
      }
      const parsedAge = parseInt(inputAge, 10) || userAge;

      // Calculate approximate birth year from age
      const birthYear = new Date().getFullYear() - parsedAge;
      const approxDob = `${birthYear}-01-01`;

      await updateProfile({
        weightKg: parsedWeight,
        heightCm: parsedHeight,
        gender: inputGender,
        activityLevel: inputActivity,
        fitnessGoal: inputGoal,
        dateOfBirth: approxDob,
      });

      // Also sync to onboarding store
      onboarding.setMetrics({
        weightKg: parsedWeight,
        heightCm: parsedHeight,
        gender: inputGender,
        age: parsedAge,
      });
      onboarding.setActivityLevel(inputActivity);
      onboarding.setGoal(
        inputGoal === 'WEIGHT_LOSS'
          ? 'LOSE_WEIGHT'
          : inputGoal === 'MUSCLE_GAIN'
          ? 'BUILD_MUSCLE'
          : 'MAINTAIN_WEIGHT',
      );

      setIsEditModalOpen(false);
    } catch (e) {
      console.error('Failed to update profile:', e);
      Alert.alert('Error', 'Could not update settings. Please try again.');
    }
  };

  const formatGoalLabel = (goal: string) => {
    switch (goal) {
      case 'WEIGHT_LOSS':
      case 'LOSE_WEIGHT':
        return 'Lose fat';
      case 'MUSCLE_GAIN':
      case 'BUILD_MUSCLE':
        return 'Build muscle';
      case 'MAINTENANCE':
      case 'MAINTAIN_WEIGHT':
        return 'Maintain weight';
      default:
        return 'Healthy lifestyle';
    }
  };

  const formatActivityLabel = (level: string) => {
    switch (level) {
      case 'SEDENTARY':
        return 'Sedentary';
      case 'LIGHT':
        return 'Lightly active';
      case 'MODERATE':
        return 'Moderately active';
      case 'VERY_ACTIVE':
        return 'Very active';
      case 'EXTRA_ACTIVE':
        return 'Extra active';
      default:
        return 'Moderately active';
    }
  };

  const formatActivitySubtitle = (level: string) => {
    switch (level) {
      case 'SEDENTARY':
        return 'Little to no exercise';
      case 'LIGHT':
        return '1-3 days/week';
      case 'MODERATE':
        return '3-5 days/week';
      case 'VERY_ACTIVE':
        return '6-7 days/week';
      case 'EXTRA_ACTIVE':
        return 'Athletic / 2x daily';
      default:
        return '3-5 days/week';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* ── Sticky Top Bar (Logo & Back Button) ─────────── */}
      <View style={styles.topStickyBar}>
        <TouchableOpacity
          onPress={() => router.replace('/(main)')}
          activeOpacity={0.7}
        >
          <Logo variant="full" size="md" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={styles.backBtn}
        >
          <ArrowLeft size={18} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Settings Title Header (scrolls with content) ─────────── */}
        <View style={styles.titleSection}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Manage your profile, goals and preferences.
          </Text>
        </View>

        {/* ── 1. User Profile Card ─────────────────────────────────── */}
        <TouchableOpacity
          style={styles.userCard}
          activeOpacity={0.8}
          onPress={() => handleOpenEdit('personal')}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              }}
              style={styles.avatarImg}
            />
            <View style={styles.cameraBadge}>
              <Camera size={11} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.userInfoCol}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name || 'Tuan Nguyen'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email || 'tuan.nguyen@gmail.com'}
            </Text>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>Free Plan</Text>
            </View>
          </View>

          <ChevronRight size={18} color="#A0A096" />
        </TouchableOpacity>

        {/* ── 2. Personal Information Card ─────────────────────────── */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.cardHeaderRow}
            activeOpacity={0.75}
            onPress={() => handleOpenEdit('personal')}
          >
            <View style={styles.iconCircle}>
              <UserIcon size={18} color="#2B3A2C" />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.cardTitle}>Personal Information</Text>
              <Text style={styles.cardSubtitle}>Age, height, weight and more.</Text>
            </View>
            <ChevronRight size={18} color="#A0A096" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 4 Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCol}>
              <View style={styles.statLabelRow}>
                <Calendar size={13} color="#7E8379" />
                <Text style={styles.statLabel}>Age</Text>
              </View>
              <Text style={styles.statValue}>{userAge} years</Text>
            </View>
            <View style={styles.statCol}>
              <View style={styles.statLabelRow}>
                <UserIcon size={13} color="#7E8379" />
                <Text style={styles.statLabel}>Gender</Text>
              </View>
              <Text style={styles.statValue}>
                {userGender === 'MALE' ? 'Male' : 'Female'}
              </Text>
            </View>
            <View style={styles.statCol}>
              <View style={styles.statLabelRow}>
                <Ruler size={13} color="#7E8379" />
                <Text style={styles.statLabel}>Height</Text>
              </View>
              <Text style={styles.statValue}>{formatHeight(userHeight, bodyUnit).full}</Text>
            </View>
            <View style={styles.statCol}>
              <View style={styles.statLabelRow}>
                <Scale size={13} color="#7E8379" />
                <Text style={styles.statLabel}>Weight</Text>
              </View>
              <Text style={styles.statValue}>{formatWeight(userWeight, bodyUnit).full}</Text>
            </View>
          </View>
        </View>

        {/* ── 3. Goals & Activity Card ─────────────────────────────── */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.cardHeaderRow}
            activeOpacity={0.75}
            onPress={() => handleOpenEdit('goals')}
          >
            <View style={styles.iconCircle}>
              <Target size={18} color="#2B3A2C" />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.cardTitle}>Goals & Activity</Text>
              <Text style={styles.cardSubtitle}>Your fitness goals and activity level.</Text>
            </View>
            <ChevronRight size={18} color="#A0A096" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.twoColRow}>
            <View style={styles.twoColLeft}>
              <View style={styles.itemTitleRow}>
                <Target size={13} color="#7E8379" />
                <Text style={styles.itemTitle}>Goal</Text>
              </View>
              <Text style={styles.itemValue}>{formatGoalLabel(userFitnessGoal)}</Text>
              <Text style={styles.itemSubValue}>
                Target weight: {formatWeight(onboarding.targetWeightKg || userWeight, bodyUnit).full}
              </Text>
            </View>

            <View style={styles.twoColRight}>
              <View style={styles.itemTitleRow}>
                <Activity size={13} color="#7E8379" />
                <Text style={styles.itemTitle}>Activity level</Text>
              </View>
              <Text style={styles.itemValue}>{formatActivityLabel(userActivity)}</Text>
              <Text style={styles.itemSubValue}>
                {formatActivitySubtitle(userActivity)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 4. App Settings Section ──────────────────────────────── */}
        <Text style={styles.groupSectionHeader}>App Settings</Text>
        <View style={styles.sectionCard}>
          {/* Units Setting */}
          <TouchableOpacity
            style={styles.listItemRow}
            activeOpacity={0.7}
            onPress={() => setIsUnitsModalOpen(true)}
          >
            <View style={styles.iconCircle}>
              <Sliders size={17} color="#333" />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.listItemTitle}>Units</Text>
              <Text style={styles.listItemSubtitle}>
                {energyUnit}, {foodUnit === 'metric' ? 'g/ml' : 'oz/fl oz'}, {bodyUnit === 'metric' ? 'cm/kg' : 'ft/lbs'}
              </Text>
            </View>
            <ChevronRight size={17} color="#A0A096" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.listItemRow} activeOpacity={0.7}>
            <View style={styles.iconCircle}>
              <Bell size={17} color="#333" />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.listItemTitle}>Notifications</Text>
              <Text style={styles.listItemSubtitle}>Meal reminders, daily insights</Text>
            </View>
            <ChevronRight size={17} color="#A0A096" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.listItemRow} activeOpacity={0.7}>
            <View style={styles.iconCircle}>
              <Moon size={17} color="#333" />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.listItemTitle}>Appearance</Text>
              <Text style={styles.listItemSubtitle}>Light mode</Text>
            </View>
            <ChevronRight size={17} color="#A0A096" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.listItemRow} activeOpacity={0.7}>
            <View style={styles.iconCircle}>
              <Watch size={17} color="#333" />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.listItemTitle}>Connected Devices</Text>
              <Text style={styles.listItemSubtitle}>Wearables & health apps</Text>
            </View>
            <ChevronRight size={17} color="#A0A096" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.listItemRow} activeOpacity={0.7}>
            <View style={styles.iconCircle}>
              <Shield size={17} color="#333" />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.listItemTitle}>Privacy & Data</Text>
              <Text style={styles.listItemSubtitle}>Manage your data and permissions</Text>
            </View>
            <ChevronRight size={17} color="#A0A096" />
          </TouchableOpacity>
        </View>

        {/* ── 7. Support & Sign Out Section ────────────────────────── */}
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.listItemRow} activeOpacity={0.7}>
            <View style={styles.iconCircle}>
              <HelpCircle size={17} color="#333" />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.listItemTitle}>Help & Support</Text>
              <Text style={styles.listItemSubtitle}>FAQs, contact us</Text>
            </View>
            <ChevronRight size={17} color="#A0A096" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.listItemRow} activeOpacity={0.7}>
            <View style={styles.iconCircle}>
              <Info size={17} color="#333" />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.listItemTitle}>About NutraAI</Text>
              <Text style={styles.listItemSubtitle}>Version 1.0.0</Text>
            </View>
            <ChevronRight size={17} color="#A0A096" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <LogOut size={18} color="#D83B28" />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Edit Modal ────────────────────────────────────────────── */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'personal' ? 'Edit Personal Info' : 'Edit Goals & Activity'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {modalType === 'personal' ? (
                <>
                  <Text style={styles.inputLabel}>
                    Weight ({bodyUnit === 'metric' ? 'kg' : 'lbs'})
                  </Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={inputWeight}
                    onChangeText={setInputWeight}
                    placeholder={bodyUnit === 'metric' ? 'e.g. 60' : 'e.g. 132'}
                  />

                  <Text style={styles.inputLabel}>
                    Height ({bodyUnit === 'metric' ? 'cm' : 'inches'})
                  </Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={inputHeight}
                    onChangeText={setInputHeight}
                    placeholder={bodyUnit === 'metric' ? 'e.g. 174' : 'e.g. 69'}
                  />

                  <Text style={styles.inputLabel}>Age (years)</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={inputAge}
                    onChangeText={setInputAge}
                    placeholder="e.g. 21"
                  />

                  <Text style={styles.inputLabel}>Gender</Text>
                  <View style={styles.radioRow}>
                    <TouchableOpacity
                      style={[
                        styles.radioBtn,
                        inputGender === 'MALE' && styles.radioBtnActive,
                      ]}
                      onPress={() => setInputGender('MALE')}
                    >
                      <Text
                        style={[
                          styles.radioBtnText,
                          inputGender === 'MALE' && styles.radioBtnTextActive,
                        ]}
                      >
                        Male
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.radioBtn,
                        inputGender === 'FEMALE' && styles.radioBtnActive,
                      ]}
                      onPress={() => setInputGender('FEMALE')}
                    >
                      <Text
                        style={[
                          styles.radioBtnText,
                          inputGender === 'FEMALE' && styles.radioBtnTextActive,
                        ]}
                      >
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>Fitness Goal</Text>
                  {(
                    [
                      { id: 'WEIGHT_LOSS', label: 'Lose fat' },
                      { id: 'MUSCLE_GAIN', label: 'Build muscle' },
                      { id: 'MAINTENANCE', label: 'Maintain weight' },
                    ] as const
                  ).map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        styles.selectOption,
                        inputGoal === g.id && styles.selectOptionActive,
                      ]}
                      onPress={() => setInputGoal(g.id)}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          inputGoal === g.id && styles.selectOptionTextActive,
                        ]}
                      >
                        {g.label}
                      </Text>
                      {inputGoal === g.id && <Check size={18} color="#FF9114" />}
                    </TouchableOpacity>
                  ))}

                  <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                    Activity Level
                  </Text>
                  {(
                    [
                      { id: 'SEDENTARY', label: 'Sedentary (Little/no exercise)' },
                      { id: 'LIGHT', label: 'Lightly Active (1-3 days/wk)' },
                      { id: 'MODERATE', label: 'Moderately Active (3-5 days/wk)' },
                      { id: 'VERY_ACTIVE', label: 'Very Active (6-7 days/wk)' },
                    ] as const
                  ).map((lvl) => (
                    <TouchableOpacity
                      key={lvl.id}
                      style={[
                        styles.selectOption,
                        inputActivity === lvl.id && styles.selectOptionActive,
                      ]}
                      onPress={() => setInputActivity(lvl.id)}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          inputActivity === lvl.id && styles.selectOptionTextActive,
                        ]}
                      >
                        {lvl.label}
                      </Text>
                      {inputActivity === lvl.id && <Check size={18} color="#FF9114" />}
                    </TouchableOpacity>
                  ))}
                </>
              )}

              <TouchableOpacity
                style={styles.saveModalBtn}
                activeOpacity={0.8}
                onPress={handleSaveEdit}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveModalBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Units Configuration Modal ────────────────────────────── */}
      <UnitsModal
        visible={isUnitsModalOpen}
        onClose={() => setIsUnitsModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F5EE', // Warm oat ivory matching design
  },
  topStickyBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#F6F5EE',
    zIndex: 10,
  },
  titleSection: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(27, 40, 27, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B281B',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6E7369',
    marginTop: 4,
    fontWeight: '500',
  },
  watermarkWrap: {
    position: 'absolute',
    right: 12,
    top: 40,
    opacity: 0.18,
    pointerEvents: 'none',
  },
  watermarkIcon: {
    fontSize: 72,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  // ── User Card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFECE2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImg: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#E8E6DB',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#263427',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B281B',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#767B71',
    marginBottom: 6,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFEFEA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#556052',
  },
  // ── Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFECE2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F2EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B281B',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#767B71',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F2EFE8',
    marginVertical: 14,
  },
  // ── 4 Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#7E8379',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B281B',
  },
  // ── Two Columns (Goals & Activity)
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  twoColLeft: {
    flex: 1,
    paddingRight: 10,
  },
  twoColRight: {
    flex: 1,
    paddingLeft: 10,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7E8379',
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B281B',
    marginBottom: 2,
  },
  itemSubValue: {
    fontSize: 11,
    color: '#8A8F85',
  },
  // ── Nutrition Blueprint
  editPlanLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF9114',
  },
  macroBlueprintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#FAFAF7',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE2',
  },
  macroIconDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  macroBlueprintName: {
    fontSize: 11,
    color: '#7E8379',
    fontWeight: '600',
  },
  macroBlueprintVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B281B',
    marginTop: 2,
  },
  macroFormulaText: {
    fontSize: 10,
    color: '#9E9E94',
    marginTop: 2,
  },
  // ── Group Section
  groupSectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#656A60',
    marginBottom: 8,
    marginTop: 6,
    marginLeft: 4,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B281B',
  },
  listItemSubtitle: {
    fontSize: 11,
    color: '#767B71',
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FBE2DE',
    gap: 8,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D83B28',
  },
  // ── Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B281B',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F2EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B281B',
    marginBottom: 6,
    marginTop: 12,
  },
  inputField: {
    backgroundColor: '#F6F5EE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1B281B',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#E7E4D8',
  },
  radioRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  radioBtn: {
    flex: 1,
    backgroundColor: '#F6F5EE',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E4D8',
  },
  radioBtnActive: {
    backgroundColor: '#263427',
    borderColor: '#263427',
  },
  radioBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B281B',
  },
  radioBtnTextActive: {
    color: '#FFFFFF',
  },
  selectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F6F5EE',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E7E4D8',
  },
  selectOptionActive: {
    borderColor: '#FF9114',
    backgroundColor: '#FFF9F2',
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B281B',
  },
  selectOptionTextActive: {
    fontWeight: '700',
    color: '#1B281B',
  },
  saveModalBtn: {
    backgroundColor: '#263427',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  saveModalBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
