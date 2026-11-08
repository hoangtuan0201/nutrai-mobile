import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountApi, NotificationPreferences } from '../api/account.api';
import { useAuthStore } from '../../../store/authStore';

const KEY = ['account', 'preferences'];

/** Notification preferences with optimistic updates. */
export function useNotificationPrefs() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const query = useQuery<NotificationPreferences>({
    queryKey: KEY,
    queryFn: accountApi.getPreferences,
    enabled: Boolean(accessToken),
  });

  const mutation = useMutation({
    mutationFn: (dto: Partial<NotificationPreferences>) => accountApi.updatePreferences(dto),
    onMutate: async (dto) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const prev = queryClient.getQueryData<NotificationPreferences>(KEY);
      if (prev) queryClient.setQueryData(KEY, { ...prev, ...dto });
      return { prev };
    },
    onError: (_e, _dto, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(KEY, ctx.prev);
    },
    onSuccess: (data) => queryClient.setQueryData(KEY, data),
  });

  return {
    prefs: query.data,
    isLoading: query.isLoading,
    update: (dto: Partial<NotificationPreferences>) => mutation.mutate(dto),
  };
}

