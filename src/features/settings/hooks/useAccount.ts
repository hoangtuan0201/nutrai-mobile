import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { accountApi, AccountMe } from '../api/account.api';
import { useAuthStore } from '../../../store/authStore';

export const ACCOUNT_QUERY_KEY = ['account', 'me'];

/** Account info (avatar, name, email) + avatar upload flow. */
export function useAccount() {
  const { accessToken, user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const query = useQuery<AccountMe>({
    queryKey: ACCOUNT_QUERY_KEY,
    queryFn: accountApi.getMe,
    enabled: Boolean(accessToken),
    staleTime: 1000 * 60 * 5,
  });

  // Sync server avatar to auth store when loaded
  useEffect(() => {
    if (query.data?.avatarUrl && query.data.avatarUrl !== user?.avatarUrl) {
      updateUser({ avatarUrl: query.data.avatarUrl });
    }
  }, [query.data?.avatarUrl, user?.avatarUrl, updateUser]);

  const avatarMutation = useMutation({
    mutationFn: (base64: string) => accountApi.uploadAvatar(base64),
    onSuccess: ({ avatarUrl }) => {
      queryClient.setQueryData<AccountMe>(ACCOUNT_QUERY_KEY, (old) =>
        old ? { ...old, avatarUrl } : old,
      );
      updateUser({ avatarUrl });
    },
  });

  const pickAndUploadAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;

    const asset = result.assets[0];
    try {
      await avatarMutation.mutateAsync(`data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`);
    } catch {
      Alert.alert('Upload failed', 'Could not update your avatar. Please try again.');
    }
  };

  const effectiveAvatarUrl = query.data?.avatarUrl ?? user?.avatarUrl ?? null;

  return {
    account: query.data,
    avatarUrl: effectiveAvatarUrl,
    isUploadingAvatar: avatarMutation.isPending,
    pickAndUploadAvatar,
  };
}

