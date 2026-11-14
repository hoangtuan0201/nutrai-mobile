import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

/**
 * Fallback screen for malformed or empty deep links (e.g. `nutraai:///`).
 * Redirects cleanly to the authenticated home or welcome screen.
 */
export default function NotFoundRedirectScreen() {
  const user = useAuthStore((s) => s.user);
  return <Redirect href={user ? '/(main)' : '/(auth)/welcome'} />;
}

