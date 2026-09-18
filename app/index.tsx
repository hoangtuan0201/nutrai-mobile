import { Redirect } from 'expo-router';

/**
 * Entry point: redirect to (main) tab — swap to /(auth)/login when auth is wired up
 */
export default function Index() {
  return <Redirect href="/(main)" />;
}
