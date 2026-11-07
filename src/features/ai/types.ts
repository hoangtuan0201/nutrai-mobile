export interface TodayMealSummaryItem {
  id: string;
  mealType: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: string[];
}

export interface TodayNutritionContext {
  date: string;
  caloriesConsumed: number;
  caloriesTarget: number;
  caloriesRemaining: number;
  proteinConsumed: number;
  proteinTarget: number;
  carbsConsumed: number;
  carbsTarget: number;
  fatConsumed: number;
  fatTarget: number;
  mealsLoggedCount: number;
  meals: TodayMealSummaryItem[];
}

export interface UserProfileContext {
  name: string;
  gender: string | null;
  age: number | null;
  heightCm: number | null;
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  bmi: number | null;
  activityLevel: string | null;
  fitnessGoal: string | null;
}

export interface ChatMessageItem {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
  latencyMs?: number | null;
  tokensUsed?: number | null;
  toolsUsed?: string[];
  localImageUri?: string;
}

export interface AiAssistantContextResponse {
  todayNutrition: TodayNutritionContext;
  profile: UserProfileContext;
  activeConversation: {
    id: string | null;
    title: string | null;
    messages: ChatMessageItem[];
  };
}

export interface SendChatMessagePayload {
  message: string;
  conversationId?: string;
  imageBase64?: string;
  mimeType?: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  isActive: boolean;
  lastMessageAt: string;
}

export interface SendChatResponse {
  conversationId: string;
  userMessage: ChatMessageItem;
  assistantMessage: ChatMessageItem;
  todayNutrition: TodayNutritionContext;
  contextUpdated: boolean;
}

