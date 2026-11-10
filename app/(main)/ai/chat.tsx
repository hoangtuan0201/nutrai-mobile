import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  useWindowDimensions,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Sparkles,
  ArrowUp,
  Camera,
  X,
  AlignLeft,
  CheckCircle2,
} from 'lucide-react-native';
import { aiApi } from '../../../src/features/ai/api/ai.api';
import { ChatHistoryDrawer } from '../../../src/features/ai/components/ChatHistoryDrawer';
import {
  AiChatCameraModal,
  CapturedChatImage,
} from '../../../src/features/ai/components/AiChatCameraModal';
import {
  ChatMessageItem,
  ConversationSummary,
  TodayNutritionContext,
} from '../../../src/features/ai/types';
import { FONTS, PALETTE, RADIUS, SHADOWS } from '../../../src/constants/theme';
import { useAppTheme } from '../../../src/hooks/useAppTheme';

// ── Prompt cards (Meals) ─────────────────────────────────────────────
type PromptAction = 'ask' | 'prefill' | 'scan';

interface PromptCardConfig {
  id: string;
  tag: string;
  prompt: string;
  displayText: string;
  action: PromptAction;
  imageUri: string;
}

const PROMPT_CARDS: PromptCardConfig[] = [
  {
    id: 'meal-eval',
    tag: 'Meal Eval',
    prompt: 'How was my latest meal today?',
    displayText: '"How was my latest meal today?"',
    action: 'ask',
    imageUri:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=70',
  },
  {
    id: 'food-log-text',
    tag: 'Food Log',
    prompt: 'I had a sandwich and a latte for breakfast',
    displayText: '"I had a sandwich and a latte for breakfast"',
    action: 'prefill',
    imageUri:
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=70',
  },
  {
    id: 'food-log-scan',
    tag: 'Food Log',
    prompt: 'Please analyze this meal photo and log it to my daily tracker.',
    displayText: 'Scan or describe your food to log',
    action: 'scan',
    imageUri:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=70',
  },
  {
    id: 'what-to-eat',
    tag: 'What to Eat',
    prompt: 'What should I eat for dinner?',
    displayText: '"What should I eat for dinner?"',
    action: 'ask',
    imageUri:
      'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=70',
  },
  {
    id: 'meal-check',
    tag: 'Meal Check',
    prompt: 'Can I eat this based on my remaining calories and macros today?',
    displayText: '"Can I eat this?"',
    action: 'scan',
    imageUri:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=70',
  },
  {
    id: 'calorie-insights',
    tag: 'Calorie Insights',
    prompt: 'How are my calories this week?',
    displayText: '"How are my calories this week?"',
    action: 'ask',
    imageUri:
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=70',
  },
];

function formatToolBadgeLabel(tools?: string[]): string | null {
  if (!tools || tools.length === 0) return null;
  if (tools.includes('quick_log_meal')) return 'Logged meal to your daily tracker';
  if (tools.includes('log_body_weight')) return 'Updated your body weight & targets';
  if (tools.includes('search_food_database')) return 'Checked verified food database';
  if (tools.includes('get_nutrition_by_date_range')) return 'Analyzed historical nutrition logs';
  return 'Synced with your nutrition data';
}

function formatMessageTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    if (isToday) return timeStr;

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return `Yesterday ${timeStr}`;

    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
  } catch {
    return '';
  }
}

/**
 * Renders markdown-lite text (**bold** and bullet lines) cleanly in React Native,
 * with support for typewriter streaming cursor.
 */
function FormattedAssistantText({
  content,
  isStreaming = false,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  const { colors } = useAppTheme();
  const lines = content.split('\n');

  const renderInlineBold = (lineText: string, keyPrefix: string, isLastLine: boolean) => {
    const tokens: Array<{ text: string; isBold: boolean }> = [];
    const parts = lineText.split(/(\*\*[^*]*\*\*?)/g);

    for (let idx = 0; idx < parts.length; idx++) {
      const part = parts[idx];
      if (!part) continue;
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        tokens.push({ text: part.slice(2, -2), isBold: true });
      } else if (part.startsWith('**') && isStreaming) {
        tokens.push({ text: part.slice(2), isBold: true });
      } else {
        tokens.push({ text: part, isBold: false });
      }
    }

    return (
      <>
        {tokens.map((tok, idx) => (
          <Text
            key={`${keyPrefix}-t-${idx}`}
            style={[
              tok.isBold && styles.boldInlineText,
              { color: colors.textPrimary },
            ]}
          >
            {tok.text}
          </Text>
        ))}
        {isStreaming && isLastLine && (
          <Text style={{ color: PALETTE.saffron, fontWeight: '900' }}> ▊</Text>
        )}
      </>
    );
  };

  return (
    <View style={styles.formattedContainer}>
      {lines.map((rawLine, lineIdx) => {
        const trimmed = rawLine.trim();
        if (!trimmed) return <View key={`spacer-${lineIdx}`} style={{ height: 6 }} />;

        const isBullet = /^[-*•]\s+/.test(trimmed);
        const cleanLine = isBullet ? trimmed.replace(/^[-*•]\s+/, '') : trimmed;
        const isLastLine = lineIdx === lines.length - 1;

        if (isBullet) {
          return (
            <View key={`line-${lineIdx}`} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={[styles.assistantBubbleText, { color: colors.textPrimary, flex: 1 }]}>
                {renderInlineBold(cleanLine, `l-${lineIdx}`, isLastLine)}
              </Text>
            </View>
          );
        }

        return (
          <Text key={`line-${lineIdx}`} style={[styles.assistantBubbleText, { color: colors.textPrimary }]}>
            {renderInlineBold(cleanLine, `l-${lineIdx}`, isLastLine)}
          </Text>
        );
      })}
    </View>
  );
}

/**
 * Animated typewriter effect that outputs ChatGPT-style streaming text chunk-by-chunk
 */
function TypewriterAssistantText({
  fullContent,
  onComplete,
  onProgress,
}: {
  fullContent: string;
  onComplete?: () => void;
  onProgress?: () => void;
}) {
  const [displayedLength, setDisplayedLength] = useState(1);
  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);
  onCompleteRef.current = onComplete;
  onProgressRef.current = onProgress;

  useEffect(() => {
    if (!fullContent) {
      onCompleteRef.current?.();
      return;
    }

    let currentIndex = 1;
    const totalLength = fullContent.length;
    // Chunk size: 2 to 6 characters so the animation feels snappy and finishes in ~1.5 - 2.5s
    const chunkSize = Math.max(2, Math.min(6, Math.ceil(totalLength / 120)));
    let lastScrollTick = 0;

    const timer = setInterval(() => {
      currentIndex = Math.min(totalLength, currentIndex + chunkSize);
      setDisplayedLength(currentIndex);

      const now = Date.now();
      if (now - lastScrollTick > 90) {
        lastScrollTick = now;
        onProgressRef.current?.();
      }

      if (currentIndex >= totalLength) {
        clearInterval(timer);
        onCompleteRef.current?.();
      }
    }, 18);

    return () => clearInterval(timer);
  }, [fullContent]);

  const partialText = fullContent.slice(0, displayedLength);
  const isStreaming = displayedLength < fullContent.length;

  return (
    <FormattedAssistantText
      content={partialText}
      isStreaming={isStreaming}
    />
  );
}

export default function AiAssistantChatScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = (windowWidth - 20 * 2 - 12) / 2;

  const [todayNutrition, setTodayNutrition] = useState<TodayNutritionContext | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [pendingImage, setPendingImage] = useState<CapturedChatImage | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // In-chat Camera Modal state (never navigates away from AI Coach)
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraPresetPrompt, setCameraPresetPrompt] = useState<string | null>(null);

  // History Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [history, setHistory] = useState<ConversationSummary[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const scrollToBottom = useCallback((animated = true) => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated }), 100);
  }, []);

  const loadContext = useCallback(async () => {
    try {
      const data = await aiApi.getAssistantContext();
      setTodayNutrition(data.todayNutrition || null);
      setConversationId(data.activeConversation?.id || null);
      setStreamingMessageId(null);
      setMessages((prev) => {
        const incoming = data.activeConversation?.messages || [];
        if (prev.length === 0) return incoming;
        // Preserve localImageUri attached during current session
        const localImageMap = new Map<string, string>();
        for (const m of prev) {
          if (m.localImageUri) localImageMap.set(m.id, m.localImageUri);
        }
        return incoming.map((m) =>
          localImageMap.has(m.id) ? { ...m, localImageUri: localImageMap.get(m.id) } : m,
        );
      });
      setErrorBanner(null);
    } catch (err: any) {
      console.warn('Failed to load AI Coach context:', err?.message);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadContext();
    }, [loadContext]),
  );

  useEffect(() => {
    if (messages.length > 0) scrollToBottom(false);
  }, [messages.length, scrollToBottom]);

  // ── Navigation ────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (isCameraModalOpen) {
      setIsCameraModalOpen(false);
      return;
    }
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)');
    }
  }, [isCameraModalOpen, isDrawerOpen, router]);

  // Handle hardware back button on Android
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleClose();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleClose])
  );

  // Opens dedicated in-chat camera modal without leaving AI Coach
  const handleOpenInChatCamera = (presetPrompt?: string) => {
    setCameraPresetPrompt(presetPrompt || null);
    setIsCameraModalOpen(true);
  };

  const handleImageCapturedFromModal = (captured: CapturedChatImage) => {
    setIsCameraModalOpen(false);
    if (cameraPresetPrompt) {
      // Triggered from a "Scan" card -> send photo + prompt directly in chat!
      const promptToUse = cameraPresetPrompt;
      setCameraPresetPrompt(null);
      handleSendMessage(promptToUse, captured);
    } else {
      // Triggered from bottom camera button -> attach photo above input so user can type or hit send
      setPendingImage(captured);
    }
  };

  // ── History drawer ────────────────────────────────────────────────
  const handleOpenDrawer = async () => {
    setIsDrawerOpen(true);
    setIsHistoryLoading(true);
    try {
      setHistory(await aiApi.listConversations());
    } catch (err: any) {
      console.warn('Failed to load chat history:', err?.message);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleNewChat = async () => {
    setIsDrawerOpen(false);
    if (isSending) return;
    setErrorBanner(null);
    setStreamingMessageId(null);
    try {
      const data = await aiApi.startNewConversation();
      setTodayNutrition(data.todayNutrition || null);
      setConversationId(data.activeConversation?.id || null);
      setMessages([]);
      setInputText('');
      setPendingImage(null);
    } catch {
      setErrorBanner('Failed to start a new chat session.');
    }
  };

  const handleSelectConversation = async (id: string) => {
    setIsDrawerOpen(false);
    if (id === conversationId) return;
    setStreamingMessageId(null);
    try {
      const data = await aiApi.openConversation(id);
      setTodayNutrition(data.todayNutrition || null);
      setConversationId(data.activeConversation?.id || id);
      setMessages(data.activeConversation?.messages || []);
      setPendingImage(null);
      setErrorBanner(null);
    } catch {
      setErrorBanner('Could not open this conversation.');
    }
  };

  // ── Messaging ─────────────────────────────────────────────────────
  const handleSendMessage = async (
    customQuestion?: string,
    customImage?: CapturedChatImage | null,
  ) => {
    const imageToSend = customImage !== undefined ? customImage : pendingImage;
    const rawText = (customQuestion ?? inputText).trim();
    const textToSend =
      rawText ||
      (imageToSend
        ? 'Can you analyze the nutrition and calories of this meal for me?'
        : '');

    if (!textToSend || isSending) return;

    if (!customQuestion) setInputText('');
    setPendingImage(null);
    setErrorBanner(null);

    const tempUserMsg: ChatMessageItem = {
      id: `temp-user-${Date.now()}`,
      role: 'USER',
      content: textToSend,
      createdAt: new Date().toISOString(),
      localImageUri: imageToSend?.uri,
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsSending(true);
    scrollToBottom(true);

    try {
      const res = await aiApi.sendChatMessage({
        message: textToSend,
        conversationId: conversationId || undefined,
        ...(imageToSend
          ? {
              imageBase64: imageToSend.base64,
              mimeType: imageToSend.mimeType,
            }
          : {}),
      });

      setConversationId(res.conversationId);
      setTodayNutrition(res.todayNutrition);
      const savedUserMsg: ChatMessageItem = imageToSend?.uri
        ? { ...res.userMessage, localImageUri: imageToSend.uri }
        : res.userMessage;

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        savedUserMsg,
        res.assistantMessage,
      ]);
      setStreamingMessageId(res.assistantMessage.id);
      scrollToBottom(true);
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));

      const statusCode = err?.response?.status;
      const errCode = err?.response?.data?.code;
      if (statusCode === 403 || errCode === 'DAILY_CHAT_LIMIT_REACHED') {
        const { useSubscriptionStore } = require('../../../src/store/subscriptionStore');
        useSubscriptionStore.getState().openQuotaModal('CHAT');
        return;
      }

      setErrorBanner(
        err?.response?.data?.message ||
          err?.message ||
          'Could not reach AI Coach. Please try again.',
      );
      if (!customQuestion) setInputText(rawText);
      if (imageToSend) setPendingImage(imageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handlePromptCardPress = (card: PromptCardConfig) => {
    if (card.action === 'scan') {
      handleOpenInChatCamera(card.prompt);
      return;
    }
    if (card.action === 'prefill') {
      setInputText(card.prompt);
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    handleSendMessage(card.prompt);
  };

  const hasConversation = messages.length > 0;
  const canSend = Boolean((inputText.trim() || pendingImage) && !isSending);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Top Bar: History menu + Close ─────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={handleOpenDrawer}
            accessibilityLabel="Open chat history"
          >
            <AlignLeft size={22} color={colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>

          {hasConversation ? (
            <View style={styles.compactTitleRow}>
              <Sparkles size={16} color={PALETTE.saffron} strokeWidth={2.4} />
              <Text style={[styles.compactTitle, { color: colors.textPrimary }]}>AI Coach</Text>
            </View>
          ) : (
            <View />
          )}

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={handleClose}
            accessibilityLabel="Close AI Coach"
          >
            <X size={22} color={colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!hasConversation && (
            <>
              {/* ── Hero Title ─────────────────────────────────────── */}
              <View style={styles.hero}>
                <View style={styles.heroTitleRow}>
                  <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>AI Coach</Text>
                  <Sparkles size={20} color={PALETTE.saffron} strokeWidth={2.4} style={styles.heroSparkle} />
                </View>
                <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Your everyday nutrition companion</Text>

                {todayNutrition && (
                  <View style={[styles.todayPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.todayPillDot} />
                    <Text style={[styles.todayPillText, { color: colors.textSecondary }]}>
                      Today{' '}
                      <Text style={[styles.todayPillBold, { color: colors.textPrimary }]}>
                        {todayNutrition.caloriesConsumed.toLocaleString()}
                      </Text>
                      {' / '}
                      {todayNutrition.caloriesTarget.toLocaleString()} kcal
                    </Text>
                  </View>
                )}
              </View>

              {/* ── Section label (Meals) ──────────────────────────── */}
              <View style={styles.sectionLabelWrap}>
                <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Meals</Text>
                <View style={styles.sectionLabelUnderline} />
              </View>

              {/* ── Prompt cards grid ─────────────────────────────── */}
              {isInitialLoading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="small" color={PALETTE.saffron} />
                </View>
              ) : (
                <View style={styles.grid}>
                  {PROMPT_CARDS.map((card) => {
                    const isScan = card.action === 'scan';
                    return (
                      <View
                        key={card.id}
                        style={[
                          styles.promptCard,
                          { width: cardWidth, backgroundColor: colors.surface, borderColor: colors.border },
                        ]}
                      >
                        <View style={[styles.promptImageWrap, { backgroundColor: colors.surfaceMuted }]}>
                          <Image source={{ uri: card.imageUri }} style={styles.promptImage} />
                          <View style={styles.promptTag}>
                            <Text style={styles.promptTagText}>{card.tag}</Text>
                          </View>
                        </View>

                        <View style={styles.promptBody}>
                          <Text style={[styles.promptText, { color: colors.textPrimary }]} numberOfLines={2}>
                            {card.displayText}
                          </Text>
                          <TouchableOpacity
                            style={[styles.promptBtn, isScan ? styles.promptBtnScan : styles.promptBtnAsk]}
                            activeOpacity={0.75}
                            disabled={isSending}
                            onPress={() => handlePromptCardPress(card)}
                          >
                            <Text
                              style={[
                                styles.promptBtnText,
                                isScan ? styles.promptBtnTextScan : styles.promptBtnTextAsk,
                              ]}
                            >
                              {isScan ? 'Scan' : 'Ask'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                Content provided for information only.{'\n'}AI can make mistakes.
              </Text>
            </>
          )}

          {/* ── Conversation thread ─────────────────────────────── */}
          {hasConversation && (
            <View style={styles.messagesList}>
              {messages.map((msg) => {
                const timeString = formatMessageTime(msg.createdAt);

                if (msg.role === 'USER') {
                  return (
                    <View key={msg.id} style={styles.userMessageRow}>
                      <View style={styles.userBubbleWrap}>
                        <View style={[styles.userBubble, isDark && { backgroundColor: '#2C2C2E' }]}>
                          {msg.localImageUri && (
                            <Image
                              source={{ uri: msg.localImageUri }}
                              style={styles.userBubbleImage}
                            />
                          )}
                          <Text style={styles.userBubbleText}>{msg.content}</Text>
                        </View>
                        {Boolean(timeString) && (
                          <Text style={[styles.messageTimestamp, styles.userTimestamp, { color: colors.textSecondary }]}>
                            {timeString}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                }

                const toolBadge = formatToolBadgeLabel(msg.toolsUsed);
                const isThisStreaming = msg.id === streamingMessageId;

                return (
                  <View key={msg.id} style={styles.assistantMessageRow}>
                    <View style={styles.assistantAvatar}>
                      <Sparkles size={14} color={PALETTE.saffron} strokeWidth={2.4} />
                    </View>
                    <View style={styles.assistantBubbleWrap}>
                      <TouchableOpacity
                        activeOpacity={0.95}
                        disabled={!isThisStreaming}
                        onPress={() => setStreamingMessageId(null)}
                        style={[styles.assistantBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      >
                        {toolBadge && (
                          <View style={styles.toolBadgePill}>
                            <CheckCircle2 size={13} color="#3D7A1F" strokeWidth={2.3} />
                            <Text style={styles.toolBadgeText}>{toolBadge}</Text>
                          </View>
                        )}
                        {isThisStreaming ? (
                          <TypewriterAssistantText
                            fullContent={msg.content}
                            onComplete={() => setStreamingMessageId(null)}
                            onProgress={() => scrollToBottom(false)}
                          />
                        ) : (
                          <FormattedAssistantText content={msg.content} />
                        )}
                      </TouchableOpacity>
                      {Boolean(timeString) && (
                        <Text style={[styles.messageTimestamp, styles.assistantTimestamp, { color: colors.textSecondary }]}>
                          {timeString}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}

              {isSending && (
                <View style={styles.assistantMessageRow}>
                  <View style={styles.assistantAvatar}>
                    <Sparkles size={14} color={PALETTE.saffron} strokeWidth={2.4} />
                  </View>
                  <View style={[styles.typingBubble, { backgroundColor: colors.surface }]}>
                    <ActivityIndicator size="small" color={PALETTE.saffron} />
                    <Text style={[styles.typingText, { color: colors.textSecondary }]}>Thinking...</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {errorBanner && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorBanner}</Text>
            </View>
          )}
        </ScrollView>

        {/* ── Pending Image Attachment Preview (above input bar) ── */}
        {pendingImage && (
          <View style={[styles.attachmentBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Image source={{ uri: pendingImage.uri }} style={styles.attachmentThumb} />
            <View style={styles.attachmentTextCol}>
              <Text style={[styles.attachmentTitle, { color: colors.textPrimary }]}>Meal photo attached</Text>
              <Text style={[styles.attachmentSub, { color: colors.textSecondary }]} numberOfLines={1}>
                Ask a question below or tap send to analyze
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.attachmentRemoveBtn,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : PALETTE.surfaceContainerLow },
              ]}
              onPress={() => setPendingImage(null)}
              hitSlop={8}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Bottom bar: Camera + Ask anything ─────────────────── */}
        <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={styles.cameraBtn}
            activeOpacity={0.85}
            onPress={() => handleOpenInChatCamera()}
            accessibilityLabel="Attach food photo"
          >
            <Camera size={22} color={PALETTE.textInverse} strokeWidth={2.3} />
          </TouchableOpacity>

          <View style={[styles.inputBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: colors.textPrimary }]}
              placeholder={pendingImage ? 'Ask about this photo...' : 'Ask anything'}
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={!isSending}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                isDark && { backgroundColor: colors.textPrimary },
                !canSend && (isDark ? { backgroundColor: '#3A3A3C' } : styles.sendBtnDisabled),
              ]}
              activeOpacity={0.8}
              disabled={!canSend}
              onPress={() => handleSendMessage()}
              accessibilityLabel="Send message"
            >
              <ArrowUp size={18} color={isDark ? colors.background : PALETTE.textInverse} strokeWidth={2.6} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <AiChatCameraModal
        visible={isCameraModalOpen}
        subtitle={
          cameraPresetPrompt
            ? `"${cameraPresetPrompt}"`
            : 'Snap a meal or pick a photo to ask AI Coach'
        }
        onClose={() => {
          setIsCameraModalOpen(false);
          setCameraPresetPrompt(null);
        }}
        onImageCaptured={handleImageCapturedFromModal}
      />

      <ChatHistoryDrawer
        visible={isDrawerOpen}
        conversations={history}
        activeConversationId={conversationId}
        isLoading={isHistoryLoading}
        onClose={() => setIsDrawerOpen(false)}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.ivory,
  },
  flex: {
    flex: 1,
  },

  // ── Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: PALETTE.textPrimary,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  // ── Hero
  hero: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 18,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 30,
    lineHeight: 36,
    color: PALETTE.textPrimary,
    letterSpacing: -0.6,
  },
  heroSparkle: {
    marginLeft: 4,
    marginTop: -2,
  },
  heroSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    lineHeight: 20,
    color: PALETTE.textSecondary,
    marginTop: 4,
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: PALETTE.surfaceWhite,
    borderWidth: 1,
    borderColor: PALETTE.borderLight,
  },
  todayPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.saffron,
  },
  todayPillText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: PALETTE.textSecondary,
  },
  todayPillBold: {
    fontFamily: FONTS.bold,
    color: PALETTE.textPrimary,
  },

  // ── Section label
  sectionLabelWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: PALETTE.textPrimary,
  },
  sectionLabelUnderline: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: PALETTE.saffron,
    marginTop: 5,
  },

  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  // ── Prompt cards
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  promptCard: {
    backgroundColor: PALETTE.surfaceWhite,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.borderMuted,
    ...SHADOWS.elevation1,
  },
  promptImageWrap: {
    height: 118,
    backgroundColor: PALETTE.surfaceContainerLow,
  },
  promptImage: {
    width: '100%',
    height: '100%',
  },
  promptTag: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(19, 19, 19, 0.78)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  promptTagText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: PALETTE.textInverse,
  },
  promptBody: {
    padding: 12,
    gap: 10,
  },
  promptText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 19,
    color: PALETTE.textPrimary,
    minHeight: 38,
  },
  promptBtn: {
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptBtnAsk: {
    backgroundColor: 'rgba(255, 145, 20, 0.14)',
  },
  promptBtnScan: {
    backgroundColor: 'rgba(142, 220, 94, 0.22)',
  },
  promptBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  promptBtnTextAsk: {
    color: '#B85F00',
  },
  promptBtnTextScan: {
    color: '#3D7A1F',
  },

  disclaimer: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 17,
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginTop: 22,
  },

  // ── Messages
  messagesList: {
    paddingTop: 8,
    gap: 14,
  },
  userMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  userBubbleWrap: {
    maxWidth: '82%',
    alignItems: 'flex-end',
  },
  userBubble: {
    width: '100%',
    backgroundColor: PALETTE.onyx,
    borderRadius: RADIUS.md,
    borderBottomRightRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 11,
    gap: 8,
  },
  userBubbleImage: {
    width: 190,
    height: 140,
    borderRadius: RADIUS.sm,
  },
  userBubbleText: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    lineHeight: 21,
    color: PALETTE.textInverse,
  },
  assistantMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 145, 20, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  assistantBubbleWrap: {
    flex: 1,
    alignItems: 'flex-start',
  },
  assistantBubble: {
    width: '100%',
    backgroundColor: PALETTE.surfaceWhite,
    borderRadius: RADIUS.md,
    borderTopLeftRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    ...SHADOWS.elevation1,
  },
  messageTimestamp: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 4,
    opacity: 0.75,
  },
  userTimestamp: {
    marginRight: 4,
    alignSelf: 'flex-end',
  },
  assistantTimestamp: {
    marginLeft: 4,
    alignSelf: 'flex-start',
  },
  toolBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: 'rgba(142, 220, 94, 0.22)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 8,
  },
  toolBadgeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: '#3D7A1F',
  },
  formattedContainer: {
    gap: 3,
  },
  assistantBubbleText: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 22,
    color: PALETTE.textPrimary,
    flexShrink: 1,
  },
  boldInlineText: {
    fontFamily: FONTS.bold,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.saffron,
    marginTop: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PALETTE.surfaceWhite,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: PALETTE.textSecondary,
  },

  errorBox: {
    marginTop: 14,
    backgroundColor: 'rgba(240, 75, 55, 0.08)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(240, 75, 55, 0.25)',
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#B42318',
  },

  // ── Pending Attachment Preview Bar
  attachmentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: PALETTE.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: PALETTE.borderLight,
    ...SHADOWS.elevation1,
  },
  attachmentThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  attachmentTextCol: {
    flex: 1,
  },
  attachmentTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: PALETTE.textPrimary,
  },
  attachmentSub: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: PALETTE.textSecondary,
  },
  attachmentRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PALETTE.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: PALETTE.ivory,
  },
  cameraBtn: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: PALETTE.saffron,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.elevation3,
  },
  inputBar: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.surfaceWhite,
    borderRadius: RADIUS.full,
    paddingLeft: 18,
    paddingRight: 7,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: PALETTE.borderLight,
  },
  textInput: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: PALETTE.textPrimary,
    maxHeight: 100,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    marginRight: 8,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: PALETTE.onyx,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: PALETTE.khaki,
  },
});
