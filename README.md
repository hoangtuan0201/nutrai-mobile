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

- 📸 **Analyze meals** via photo or text description
- 🍱 **Track calories & macros** (Carbs, Protein, Fat) daily
- 🤖 **Chat with AI Nutritionist** for personalized advice
- 📊 **Dashboard & Progress** to monitor weekly/monthly trends
- 🎯 **Set fitness goals** — Muscle Gain / Weight Loss / Maintenance

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) ~57.0 (SDK 57) |
| Language | TypeScript ~6.0 |
| Navigation | [Expo Router](https://expo.github.io/router) ~57.0 (File-based routing) |
| UI | React Native + Vanilla StyleSheet |
| Icons | [Lucide React Native](https://lucide.dev) |
| Fonts | Manrope via `@expo-google-fonts/manrope` |
| SVG | `react-native-svg` (Calorie Ring component) |
| HTTP Client | Axios (configured in `src/lib/api.ts`) |
| Storage | AsyncStorage (`src/lib/storage.ts`) |
| Web Support | `react-native-web` + `react-dom` |

---

## Project Structure

```
mobile-nutraai/
│
├── app/                          # Expo Router — File-based routing
│   ├── _layout.tsx               # Root layout: SafeAreaProvider
│   ├── index.tsx                 # Entry point → redirects to /(main)
│   │
│   ├── (auth)/                   # Auth group (no tab bar)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   └── verify-email.tsx
│   │
│   ├── (main)/                   # Main app group (with tab bar)
│   │   ├── _layout.tsx           # Tab navigator — Onyx bar + Saffron FAB
│   │   ├── index.tsx             # Home Dashboard
│   │   ├── meals/
│   │   │   ├── index.tsx         # Meal list
│   │   │   ├── add.tsx           # Add new meal
│   │   │   └── [id].tsx          # Meal detail (dynamic route)
│   │   ├── nutrition.tsx         # Macro breakdown
│   │   ├── progress.tsx          # Progress charts
│   │   └── profile.tsx           # Profile & goals
│   │
│   ├── ai/                       # AI Chat
│   │   ├── index.tsx             # Conversation list
│   │   └── [conversationId].tsx  # Chat screen (dynamic route)
│   │
│   └── settings/
│       ├── index.tsx
│       └── subscription.tsx      # Pro plan
│
├── src/
│   ├── features/                 # Feature-based modules
│   │   ├── auth/                 # Login, register, JWT
│   │   │   ├── api/auth.api.ts
│   │   │   └── types.ts
│   │   ├── meals/                # Meal CRUD
│   │   │   ├── api/meals.api.ts
│   │   │   └── types.ts
│   │   ├── nutrition/            # Calorie & macro calculations
│   │   │   ├── api/nutrition.api.ts
│   │   │   └── types.ts
│   │   ├── ai/                   # AI chat & image analysis
│   │   ├── profile/              # User profile
│   │   ├── progress/             # History & analytics
│   │   └── subscription/         # Free / Pro plans
│   │
│   ├── components/
│   │   ├── ui/                   # Reusable UI: Button, Input, Loading
│   │   ├── common/
│   │   │   └── Text.tsx          # AppText with typography variants
│   │   └── nutrition/
│   │       └── CalorieRing.tsx   # SVG circular calorie progress ring
│   │
│   ├── constants/
│   │   └── theme.ts              # Design tokens (colors, spacing, typography)
│   │
│   ├── lib/
│   │   ├── api.ts                # Axios instance + JWT interceptors
│   │   └── storage.ts            # AsyncStorage wrapper
│   │
│   ├── config/
│   │   └── env.ts                # Reads EXPO_PUBLIC_* environment variables
│   │
│   ├── store/
│   │   └── authStore.ts          # Auth state (Zustand)
│   │
│   ├── hooks/
│   │   └── useDebounce.ts
│   │
│   ├── utils/
│   │   ├── format.ts             # Number and date formatting
│   │   ├── validation.ts         # Validation schemas
│   │   └── nutrition.ts          # BMR, TDEE, macro target calculations
│   │
│   └── types/
│       ├── api.ts                # ApiResponse, PaginatedResponse, ApiError
│       └── nutrition.ts          # NutritionTarget, DailySummary, MealLog
│
├── assets/
│   ├── images/                   # App icon, splash screen, adaptive icon
│   └── fonts/
│
├── .env                          # Environment variables (do not commit)
├── .env.example                  # Environment variable template
├── app.json                      # Expo configuration
├── babel.config.js               # Babel + module-resolver (path aliases)
├── metro.config.js               # Metro bundler configuration
├── tsconfig.json                 # TypeScript strict mode + path aliases
└── package.json
```

---

## Requirements

| Tool | Version |
|---|---|
| Node.js | >= 18.x |
| npm | >= 10.x |
| Expo CLI | Via `npx expo` (no global install needed) |
| Expo Go | [iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) |

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
# For physical device (Expo Go): use your machine's LAN IP
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000

# For web / emulator
EXPO_PUBLIC_API_URL=http://localhost:3000
```

> ⚠️ **Important**: When using Expo Go on a physical device, `localhost` won't reach the backend. Use your machine's LAN IP address instead.

### 3. Start the dev server

```bash
# Start Metro server (all platforms)
npm start
# or
npx expo start --clear

# Web only
npm run web

# Android (requires connected device or AVD)
npm run android

# iOS (macOS only)
npm run ios
```

### 4. Preview the app

- **Physical device**: Install **Expo Go**, then scan the QR code shown in the terminal
- **Web browser**: Press `w` in the terminal after Metro starts

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
| `/(auth)/login` | Login | JWT-based login |
| `/(auth)/register` | Register | Create new account |
| `/(auth)/forgot-password` | Forgot Password | Email-based password reset |
| `/(auth)/verify-email` | Verify Email | OTP email verification |
| `/(main)` | Home Dashboard | Calorie ring, macro bars, today's meals |
| `/(main)/meals` | Meal List | Meal history by date |
| `/(main)/meals/add` | Add Meal | Log meal via Manual / AI Text / AI Image |
| `/(main)/meals/[id]` | Meal Detail | View & edit a meal entry |
| `/(main)/nutrition` | Nutrition | Detailed macro analysis |
| `/(main)/progress` | Progress | Weekly / monthly trend charts |
| `/(main)/profile` | Profile | BMR/TDEE, fitness goal, settings |
| `/ai` | AI Conversations | List of AI chat sessions |
| `/ai/[id]` | AI Chat | Chat with AI Nutritionist |
| `/settings` | Settings | App preferences |
| `/settings/subscription` | Subscription | Upgrade to Pro |

---

## Architecture

### Feature-Based Modules

Each feature under `src/features/` contains:
```
features/auth/
├── api/          # Axios API calls
├── components/   # Feature-specific UI components
├── hooks/        # Custom hooks (useLogin, useRegister, ...)
├── types.ts      # TypeScript type definitions
└── schemas.ts    # Validation schemas (Zod)
```

### API Client

`src/lib/api.ts` — Axios instance with:
- **Request interceptor**: Automatically attaches `Authorization: Bearer <token>`
- **Response interceptor**: Handles 401 errors and refreshes tokens automatically

### Navigation Flow

```
app/index.tsx
    │
    ├── Not authenticated  →  /(auth)/login
    │
    └── Authenticated      →  /(main)
                                  │
                                  ├── Tab: Home
                                  ├── Tab: Nutrition
                                  ├── FAB: + Log Meal  →  /(main)/meals/add
                                  ├── Tab: Progress
                                  └── Tab: Profile
```

---

## Related

- **Backend API**: [`../be-nutraai`](../be-nutraai) — NestJS + PostgreSQL
- **Design System**: [`../document/designsystem.md`](../document/designsystem.md)
- **Project Overview**: [`../document/projectoverview.md`](../document/projectoverview.md)
