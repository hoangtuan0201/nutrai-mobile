import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi, ProfileResponseDto, UpdateProfileDto } from '../api/profile.api';
import { useAuthStore } from '../../../store/authStore';

export const PROFILE_QUERY_KEY = ['profile'];

export function useProfile() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  const query = useQuery<ProfileResponseDto>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: profileApi.getProfile,
    enabled: Boolean(accessToken),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  const updateMutation = useMutation({
    mutationFn: (dto: UpdateProfileDto) => profileApi.updateProfile(dto),
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, data);
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
