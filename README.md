# NutraAI — Mobile App

> **AI-powered Nutrition & Calorie Tracking** — React Native (Expo) mobile application

[![Expo](https://img.shields.io/badge/Expo-57.0.22-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.86.3-61DAFB?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)](https://www.typescriptlang.org)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation & Running](#installation--running)
- [Environment Variables](#environment-variables)
- [Design System](#design-system)
- [Screens & Features](#screens--features)
- [Architecture](#architecture)

---

## Overview

NutraAI Mobile is an AI-powered nutrition tracking app that enables users to:

- 📸 **Analyze meals** via camera/photo scan or text description
- 🍱 **Track calories & macros** (Carbs, Protein, Fat) daily
- 🤖 **Chat with AI Coach** for personalized nutrition guidance, photo logging, and weight updates
- 📊 **Dashboard & Progress** to monitor weight, BMI, and calorie intake trends
- 🎯 **7-step Onboarding & Goals** — Weight Loss / Maintenance / Muscle Gain with Mifflin-St Jeor BMR/TDEE calculation
- 🔔 **Push & Meal Reminders** via Expo Notifications

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) ~57.0 (SDK 57) |
| Language | TypeScript ~6.0 |
| Navigation | [Expo Router](https://expo.github.io/router) ~57.0 (File-based routing) |
| State & Data Fetching | Zustand v5 + TanStack React Query v5 |
| Forms & Validation | React Hook Form + Zod |
| UI & Styling | React Native StyleSheet + NativeWind / Tailwind CSS |
| Icons | [Lucide React Native](https://lucide.dev) |
| Fonts | Manrope via `@expo-google-fonts/manrope` |
| SVG | `react-native-svg` (`ProgressRing` & charts) |
| HTTP Client | Axios (configured in `src/lib/api.ts`) |
| Storage | `expo-secure-store` (Native) / `AsyncStorage` (Web fallback) (`src/lib/storage.ts`) |
| Auth & Push | Firebase Auth, `@react-native-google-signin/google-signin`, `expo-notifications` |
| Web Support | `react-native-web` + `react-dom` |

---

## Project Structure

```
mobile-nutraai/
│
├── app/                              # Expo Router — File-based routing
│   ├── _layout.tsx                   # Root layout: Auth guard, Push setup, QueryProvider, SubscriptionModalsHost
│   ├── index.tsx                     # Entry point
│   ├── +not-found.tsx                # 404 fallback screen
│   │
│   ├── (auth)/                       # Onboarding & Auth group (no tab bar)
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx               # Hero welcome screen
│   │   ├── goals.tsx                 # Onboarding 1/7: Fitness goal
│   │   ├── gender.tsx                # Onboarding 2/7: Biological sex
│   │   ├── birth-year.tsx            # Onboarding 3/7: Birth year
│   │   ├── height.tsx                # Onboarding 4/7: Height (cm/ft)
│   │   ├── weight.tsx                # Onboarding 5/7: Current weight & BMI
│   │   ├── goal-preferences.tsx      # Onboarding 6/7: Target weight & strategy
│   │   ├── activity-level.tsx        # Onboarding 7/7: Activity level
│   │   ├── plan-preview.tsx          # Calculated BMR/TDEE & macro plan preview
│   │   ├── user-metrics.tsx          # Legacy redirect → /(auth)/gender
│   │   ├── register.tsx              # Sign up (Email / Google) + profile sync
│   │   ├── login.tsx                 # Sign in (Email / Google)
│   │   ├── verify-email.tsx          # 6-digit OTP email verification
│   │   ├── forgot-password.tsx       # Request password reset code
│   │   ├── verify-reset-code.tsx     # Verify reset code
│   │   └── reset-password.tsx        # Set new password
│   │
│   ├── (main)/                       # Main app group (with bottom tab bar)
│   │   ├── _layout.tsx               # Tab navigator
│   │   ├── index.tsx                 # Home Dashboard
│   │   ├── meals/
│   │   │   ├── index.tsx             # Daily meals log
│   │   │   ├── add.tsx               # Add meal (Search / Manual / AI Text)
│   │   │   ├── camera.tsx            # AI food camera scanner
│   │   │   ├── ai-breakdown.tsx      # AI scan nutrition breakdown & confirm
│   │   │   └── [id].tsx              # Meal detail (dynamic route)
│   │   ├── progress/
│   │   │   ├── index.tsx             # Progress overview (BMI, Weight, Streak)
│   │   │   ├── calorie.tsx           # Calorie & macro intake analytics
│   │   │   └── weight.tsx            # Weight history & logging
│   │   ├── ai/
│   │   │   ├── index.tsx             # AI Coach conversations / entry
│   │   │   └── chat.tsx              # AI Coach chat screen (text & photo)
│   │   └── settings.tsx              # Settings tab
│   │
│   ├── notifications/
│   │   ├── _layout.tsx
│   │   └── index.tsx                 # Notification center
│   │
│   └── settings/
│       ├── _layout.tsx
│       ├── index.tsx                 # Account & preferences
│       ├── subscription.tsx          # Free / Pro plans & VietQR checkout
│       ├── notifications.tsx         # Meal reminder settings
│       ├── help.tsx                  # FAQ & Help
│       └── privacy.tsx               # Privacy & security
│
├── src/
│   ├── features/                     # Feature-based modules
│   │   ├── ai/                       # AI chat & food image analysis
│   │   ├── auth/                     # Login, register, Google Sign-In, Zod schemas
│   │   ├── meals/                    # Meal CRUD & camera components
│   │   ├── notifications/            # Push registration & meal reminders
│   │   ├── nutrition/                # Nutrition summary & daily targets
│   │   ├── profile/                  # User profile & EditGoalsModal
│   │   ├── progress/                 # Weight logs, BMI gauge, calorie charts
│   │   ├── settings/                 # Profile editing, FAQ, settings hooks
│   │   └── subscription/             # Free / Pro plans & upgrade modals
│   │
│   ├── components/
│   │   ├── common/                   # Text, WeeklyCalendarStrip
│   │   ├── home/                     # CalorieRemainingCard
│   │   ├── ui/                       # Button, Input, Card, Badge, BottomNav, ProgressRing, etc.
│   │   └── index.ts
│   │
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── theme.ts                  # Design tokens (colors, spacing, typography)
│   │   └── index.ts
│   │
│   ├── lib/
│   │   ├── api.ts                    # Axios instance + Bearer token interceptors
│   │   ├── firebase.ts               # Firebase initialization
│   │   ├── queryClient.tsx           # TanStack Query provider
│   │   └── storage.ts                # SecureStore (native) / AsyncStorage (web) wrapper
│   │
│   ├── config/
│   │   └── env.ts                    # Reads EXPO_PUBLIC_* environment variables
│   │
│   ├── store/                        # Zustand stores
│   │   ├── aiScanStore.ts
│   │   ├── authStore.ts
│   │   ├── onboardingStore.ts
│   │   ├── subscriptionStore.ts
│   │   ├── themeStore.ts
│   │   └── unitStore.ts
│   │
│   ├── hooks/
│   │   ├── useAppTheme.ts
│   │   └── useDebounce.ts
│   │
│   ├── utils/
│   │   ├── format.ts                 # Number and date formatting
│   │   ├── navigationGuard.ts
│   │   ├── nutrition.ts
│   │   ├── nutritionCalculator.ts    # BMR, TDEE, BMI & macro target calculations
│   │   ├── nutritionCalculator.test.ts
│   │   └── validation.ts
│   │
│   └── types/
│       ├── api.ts                    # ApiResponse, PaginatedResponse, ApiError
│       ├── nutrition.ts              # NutritionTarget, DailySummary, MealLog
│       └── index.ts
│
├── assets/                           # Icons, images, fonts
├── scripts/                          # Helper scripts
├── .env                              # Environment variables (do not commit)
├── .env.example                      # Environment variable template
├── app.json                          # Expo configuration
├── eas.json                          # EAS Build profiles
├── google-services.json              # Firebase Android config
├── babel.config.js                   # Babel + module-resolver (path aliases)
├── metro.config.js                   # Metro bundler configuration
├── tsconfig.json                     # TypeScript strict mode + path aliases
└── package.json
```

---

## Requirements

| Tool | Version |
|---|---|
| Node.js | >= 20.x (supports `--experimental-strip-types` for unit tests) |
| npm | >= 10.x |
| Expo CLI | Via `npx expo` (no global install needed) |
| Android Studio / Xcode | Required for `npm run android` / `npm run ios` (dev client) |

---

## Installation & Running

### 1. Install dependencies

```bash
cd mobile-nutraai
npm install
```

### 2. Create `.env` file

```bash
cp .env.example .env
```

Edit `.env`:
```env
# For physical device: use your machine's LAN IP or tunnel URL
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000

# For web / emulator
EXPO_PUBLIC_API_URL=http://localhost:3000
```

> ⚠️ **Important**: When running on a physical device, `localhost` won't reach the backend. Use your machine's LAN IP address instead.

### 3. Start the dev server & tests

```bash
# Start Metro server
npm start
# or clear cache
npx expo start --clear

# Web only
npm run web

# Native dev builds (Android / iOS)
npm run android
npm run ios

# Run nutrition calculator unit tests
npm test
```

---

## Environment Variables

All client-side variables must be prefixed with **`EXPO_PUBLIC_`** — Expo only exposes variables with this prefix in the bundle.

| Variable | Description | Example |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | NutraAI backend base URL | `http://localhost:3000` |

> See: [`src/config/env.ts`](src/config/env.ts)

---

## Design System

The project follows the Design System defined in [`document/designsystem.md`](../document/designsystem.md).
All design tokens are implemented in [`src/constants/theme.ts`](src/constants/theme.ts).

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `saffron` | `#FF9114` | Primary CTA, calorie ring, active states |
| `scarlet` | `#F04B37` | Secondary accent, alerts, streaks |
| `ivory` | `#F4F2E7` | App background (Warm Minimalism) |
| `onyx` | `#131313` | Primary text, bottom nav bar |
| `green` | `#8EDC5E` | Macro — **Carbs** |
| `blue` | `#88A8F7` | Macro — **Protein** |
| `yellow` | `#FDD922` | Macro — **Fat** |

### Typography

- **Manrope** (Google Fonts) — weights 400 → 800
- Loaded via `@expo-google-fonts/manrope`

### Path Aliases

```typescript
// Instead of
import theme from '../../../src/constants/theme';

// Use alias
import theme from '@/constants/theme';
```

| Alias | Resolves to |
|---|---|
| `@/*` | `src/*` |
| `@/components/*` | `src/components/*` |
| `@/features/*` | `src/features/*` |
| `@/lib/*` | `src/lib/*` |
| `@/constants/*` | `src/constants/*` |

---

## Screens & Features

| Route | Screen | Description |
|---|---|---|
| `/(auth)/welcome` | Welcome | Hero landing screen (Get Started / Sign In) |
| `/(auth)/goals` ... `/(auth)/activity-level` | Onboarding (7 steps) | Goal, gender, birth year, height, weight, target weight, activity level |
| `/(auth)/plan-preview` | Plan Preview | Calculated daily calories & macro targets |
| `/(auth)/login` | Login | Email/Password & Google Sign-In |
| `/(auth)/register` | Register | Create account & sync onboarding profile |
| `/(auth)/verify-email` | Verify Email | 6-digit OTP email verification |
| `/(auth)/forgot-password` | Forgot Password | Email-based password reset flow |
| `/(main)` | Home Dashboard | Calorie ring, macro bars, today's meals |
| `/(main)/meals` | Meal List | Daily meal history |
| `/(main)/meals/add` | Add Meal | Log meal via Search / Manual / AI Text |
| `/(main)/meals/camera` | AI Camera | Scan food photo for macro estimation |
| `/(main)/meals/[id]` | Meal Detail | View & edit a meal entry |
| `/(main)/progress` | Progress | Weight, BMI, calorie trends & streak |
| `/(main)/ai` | AI Coach | AI Nutritionist conversations & chat (`/chat`) |
| `/(main)/settings` | Settings Tab | Quick access to profile & preferences |
| `/notifications` | Notifications | Notification center |
| `/settings/subscription` | Subscription | Free / Pro plans & VietQR checkout |

---

## Architecture

### Feature-Based Modules

Each feature under `src/features/` organizes domain code into:
```
features/auth/
├── api/          # Axios API calls
├── services/     # External auth integrations (e.g. Google Sign-In)
├── types.ts      # TypeScript type definitions
└── validation.ts # Validation schemas (Zod)
```

### API Client

`src/lib/api.ts` — Axios instance with:
- **Request interceptor**: Automatically attaches `Authorization: Bearer <token>` from `storage.getToken()`
- **Response interceptor**: Normalizes API responses and handles 401 unauthorized errors

### Navigation Flow

```
app/index.tsx (protected by app/_layout.tsx)
    │
    ├── Not authenticated  →  /(auth)/welcome  →  7-step onboarding  →  /(auth)/register or /(auth)/login
    │
    └── Authenticated      →  /(main)
                                  ├── Home (index)
                                  ├── Meals (meals/)
                                  ├── Progress (progress/)
                                  ├── AI Coach (ai/)
                                  └── Settings (settings)
```

---

## Related

- **Backend API**: [`../be-nutraai`](../be-nutraai) — NestJS + PostgreSQL
- **Design System**: [`../document/designsystem.md`](../document/designsystem.md)
- **Project Overview**: [`../document/projectoverview.md`](../document/projectoverview.md)
