import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  notificationsApi,
  PaginatedNotificationsResponse,
} from '../api/notifications.api';
import { useAuthStore } from '../../../store/authStore';

export const NOTIFICATIONS_KEYS = {
  all: ['notifications'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  list: (unreadOnly: boolean) => ['notifications', 'list', { unreadOnly }] as const,
};

export function useUnreadNotificationsCount() {
  const accessToken = useAuthStore((s) => s.accessToken);

  const query = useQuery({
    queryKey: NOTIFICATIONS_KEYS.unreadCount,
    queryFn: notificationsApi.getUnreadCount,
    enabled: Boolean(accessToken),
    refetchInterval: 30_000, // Refresh badge count every 30s while app is open
  });

  return {
    unreadCount: query.data?.unreadCount ?? 0,
    refetchUnreadCount: query.refetch,
  };
}

export function useNotificationsList(unreadOnly = false) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const listQuery = useQuery<PaginatedNotificationsResponse>({
    queryKey: NOTIFICATIONS_KEYS.list(unreadOnly),
    queryFn: () => notificationsApi.getNotifications({ page: 1, limit: 40, unreadOnly }),
    enabled: Boolean(accessToken),
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEYS.all });
  };

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: invalidateAll,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: invalidateAll,
  });

  const sendTestPushMutation = useMutation({
    mutationFn: () => notificationsApi.sendTestPush(),
    onSuccess: invalidateAll,
  });

  return {
    notifications: listQuery.data?.items ?? [],
    unreadCount: listQuery.data?.unreadCount ?? 0,
    total: listQuery.data?.total ?? 0,
    isLoading: listQuery.isLoading,
    isRefetching: listQuery.isRefetching,
    refetch: listQuery.refetch,
    markAsRead: (id: string) => markAsReadMutation.mutateAsync(id),
    markAllAsRead: () => markAllAsReadMutation.mutateAsync(),
    isMarkingAll: markAllAsReadMutation.isPending,
    sendTestPush: () => sendTestPushMutation.mutateAsync(),
    isSendingTest: sendTestPushMutation.isPending,
  };
}

