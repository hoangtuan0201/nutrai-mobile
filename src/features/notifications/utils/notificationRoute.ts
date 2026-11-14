/**
 * Normalizes notification deep-link routes so legacy or malformed paths
 * always resolve to valid Expo Router screens.
 */
const LEGACY_ROUTE_ALIASES: Record<string, string> = {
  '/(main)/subscription': '/settings/subscription',
  '/subscription': '/settings/subscription',
  '/meals': '/(main)/meals',
  '/ai': '/(main)/ai/chat',
  '/ai/chat': '/(main)/ai/chat',
  '/progress': '/(main)/progress/calorie',
};

const VALID_STATIC_PREFIXES = [
  '/(main)',
  '/settings',
  '/notifications',
];

export function resolveNotificationRoute(
  rawRoute?: unknown,
  notificationType?: unknown,
  fallbackRoute: string | null = '/notifications',
): string | null {
  if (typeof rawRoute === 'string') {
    const trimmed = rawRoute.trim();
    if (trimmed && trimmed !== '/' && trimmed !== '///') {
      const normalized = LEGACY_ROUTE_ALIASES[trimmed] ?? trimmed;
      if (VALID_STATIC_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
        return normalized;
      }
    }
  }

  switch (notificationType) {
    case 'SUBSCRIPTION':
      return '/settings/subscription';
    case 'MEAL_REMINDER':
      return '/(main)/meals';
    case 'GOAL_ALERT':
      return '/(main)/progress/calorie';
    case 'AI_RECOMMENDATION':
      return '/(main)/ai/chat';
    default:
      return fallbackRoute;
  }
}

