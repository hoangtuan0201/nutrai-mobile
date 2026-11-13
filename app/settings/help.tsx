import React from 'react';
import { ScrollView, Linking } from 'react-native';
import { Mail } from 'lucide-react-native';
import { SettingsScreen } from '../../src/features/settings/components/SettingsTopBar';
import { SectionLabel, SettingsCard, SettingsDivider, SettingsRow } from '../../src/features/settings/components/SettingsGroup';
import { FaqItem, FaqEntry } from '../../src/features/settings/components/FaqItem';

const SUPPORT_EMAIL = 'support@nutrai.app';

// ── 1. Nutrition Science & Mathematical Formulas ──
const NUTRITION_FORMULA_FAQS: FaqEntry[] = [
  {
    q: 'How is my BMR (Basal Metabolic Rate) calculated?',
    a: 'NutrAI uses the clinically validated Mifflin-St Jeor Equation to calculate your baseline metabolic burn rate at rest:\n\n• For Men:\n  BMR = 10 × weight (kg) + 6.25 × height (cm) - 5 × age + 5\n\n• For Women:\n  BMR = 10 × weight (kg) + 6.25 × height (cm) - 5 × age - 161\n\nThis represents the minimum energy your vital organs require to function at complete rest.',
  },
  {
    q: 'How is TDEE (Total Daily Energy Expenditure) determined?',
    a: 'TDEE is your total calories burned per day, calculated as BMR × Activity Multiplier:\n\n• Sedentary (office job, little/no exercise): BMR × 1.20\n• Lightly Active (1–3 exercise days/week): BMR × 1.375\n• Moderately Active (3–5 exercise days/week): BMR × 1.55\n• Very Active (6–7 hard exercise days/week): BMR × 1.725\n• Extra Active (intense training twice daily): BMR × 1.90\n\nEating at your exact TDEE maintains your current body weight.',
  },
  {
    q: 'How does NutrAI calculate my Calorie Target for weight loss or muscle gain?',
    a: 'Your target calories are adjusted from your TDEE according to your chosen fitness goal and weekly pace:\n\n• Weight Loss (Fat Loss):\n  1 kg of body fat equates to ~7,700 kcal. Daily deficit = (weekly pace in kg × 7,700) ÷ 7.\n  Medical safety safeguard: Men cannot be set below 1,500 kcal/day, Women below 1,200 kcal/day, and maximum deficit is capped at 30% of TDEE to protect metabolic health.\n\n• Muscle Building (Hypertrophy):\n  A controlled lean surplus of +200 to +350 kcal/day above TDEE to fuel muscle synthesis while minimizing fat gain.\n\n• Weight Maintenance:\n  Calorie target is set equal to your exact TDEE.',
  },
  {
    q: 'How are Macronutrients (Protein, Carbs, Fat) calculated?',
    a: 'NutrAI calculates your daily macro split based on your body mass and fitness objective:\n\n• Protein (4 kcal/g):\n  1.8–2.2 g per kg of body weight for muscle growth and retaining lean tissue during fat loss.\n\n• Dietary Fat (9 kcal/g):\n  25%–30% of total daily calories (minimum 0.8 g/kg) to support hormonal balance, brain function, and joint health.\n\n• Carbohydrates (4 kcal/g):\n  Remaining calories after protein and fat are allocated to carbohydrates, supplying workout glycogen and cognitive energy.',
  },
  {
    q: 'How is daily Water Target calculated?',
    a: 'Your baseline daily hydration goal is calculated as:\n\nWater (ml) = Body Weight (kg) × 35 ml\n\nFor example, an individual weighing 70 kg has a baseline hydration goal of 70 × 35 = 2,450 ml (~2.5 liters). On days with intense workouts, add 350–500 ml to compensate for sweat loss.',
  },
  {
    q: 'How is BMI (Body Mass Index) evaluated?',
    a: 'BMI measures body fat based on height and weight:\n\nBMI = Weight (kg) ÷ [Height (m)]²\n\n• Underweight: < 18.5\n• Healthy Weight: 18.5 – 24.9\n• Overweight: 25.0 – 29.9\n• Obese: ≥ 30.0\n\nNutrAI tracks your BMI alongside body weight logs in Progress Analytics.',
  },
];

// ── 2. General, Plans & Data Privacy ──
const GENERAL_FAQS: FaqEntry[] = [
  {
    q: 'What are the Free vs NutrAI Pro quotas?',
    a: '• Free Plan:\n  Includes 5 AI food scans per day and 5 AI Coach chat messages per day, along with full manual meal tracking and standard charts.\n\n• NutrAI Pro:\n  Unlocks 20 AI food scans per day, 50 AI Coach messages per day, complete 30-day nutrition analytics, and priority Gemini AI processing.',
  },
  {
    q: 'Can I change measurement units and app appearance?',
    a: 'Yes! Go to Settings → Units to switch between Metric (cm, kg, g) and Imperial (ft/in, lbs, oz), or kcal and kJ. Go to Settings → Appearance to choose Light, Dark, or System theme.',
  },
  {
    q: 'How do I delete or export my data?',
    a: 'All health metrics, profile data, and photos are encrypted in transit via SSL/TLS and stored securely. We do not sell your personal data.\n\nYou can export your complete history or permanently delete your account and all associated records anytime in Settings → Privacy & Data.',
  },
];

export default function HelpScreen() {
  return (
    <SettingsScreen title="Help & Support">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* Section 1: Scientific Nutrition Formulas */}
        <SectionLabel>Nutrition Science & Formulas</SectionLabel>
        <SettingsCard>
          {NUTRITION_FORMULA_FAQS.map((f, i) => (
            <React.Fragment key={f.q}>
              {i > 0 && <SettingsDivider />}
              <FaqItem {...f} />
            </React.Fragment>
          ))}
        </SettingsCard>

        {/* Section 2: General & Account Privacy */}
        <SectionLabel>Plans & Data Privacy</SectionLabel>
        <SettingsCard>
          {GENERAL_FAQS.map((f, i) => (
            <React.Fragment key={f.q}>
              {i > 0 && <SettingsDivider />}
              <FaqItem {...f} />
            </React.Fragment>
          ))}
        </SettingsCard>

        {/* Section 3: Contact */}
        <SectionLabel>Contact Support</SectionLabel>
        <SettingsCard>
          <SettingsRow
            icon={Mail}
            title="Email support"
            subtitle={SUPPORT_EMAIL}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=NutrAI%20Support`)}
          />
        </SettingsCard>
      </ScrollView>
    </SettingsScreen>
  );
}
