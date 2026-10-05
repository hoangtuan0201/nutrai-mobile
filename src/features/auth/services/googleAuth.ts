import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { firebaseAuth } from '../../../lib/firebase';
import { useAuthStore } from '../../../store/authStore';

// Ensure any existing auth browser session is closed when app reloads
WebBrowser.maybeCompleteAuthSession();

export interface GoogleAuthResult {
  success: boolean;
  error?: string;
}

/**
 * Handle Google Sign-In for Mobile & Web.
 * 
 * Flow for Mobile (Android / iOS):
 * 1. Opens system in-app browser (Chrome Custom Tabs) to Google OAuth 2.0 endpoint.
 * 2. User selects their Google account on device.
 * 3. App receives Google ID Token via redirect URI (nutraai://auth/callback).
 * 4. Exchanges Google credential into Firebase via signInWithCredential (pure network call, no DOM popup).
 * 5. Retrieves Firebase ID Token and forwards to NestJS backend: POST /auth/google.
 * 6. NestJS verifies via Firebase Admin SDK and issues internal JWT + Refresh Token.
 * 7. SecureStore persists JWT and Zustand store transitions to authenticated session.
 */
export async function performGoogleAuth(): Promise<GoogleAuthResult> {
  const { loginWithGoogle } = useAuthStore.getState();

  try {
    // ── 1. Web fallback (Browser DOM environment) ──────────────
    if (Platform.OS === 'web') {
      const { signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(firebaseAuth, provider);
      const firebaseIdToken = await userCredential.user.getIdToken();
      await loginWithGoogle(firebaseIdToken);
      return { success: true };
    }

    // ── 2. Mobile Native (Android & iOS) ───────────────────────
    // Does NOT use signInWithPopup (which crashes on mobile native).
    // Uses Google OAuth 2.0 flow with Chrome Custom Tabs:
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!clientId) {
      return {
        success: false,
        error: 'error',
      };
    }

    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'nutraai',
      path: 'auth/callback',
    });

    const nonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Math.random().toString(36).substring(2)
    );

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=${encodeURIComponent('id_token token')}&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `nonce=${encodeURIComponent(nonce)}&` +
      `prompt=select_account`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success' && result.url) {
      // Parse parameters returned by Google in hash or query
      const hashPart = result.url.split('#')[1] || '';
      const queryPart = result.url.split('?')[1] || '';
      const params = new URLSearchParams(hashPart || queryPart);
      const googleIdToken = params.get('id_token');

      if (!googleIdToken) {
        return {
          success: false,
          error: 'Không nhận được Google ID Token từ phiên đăng nhập.',
        };
      }

      // Convert Google credential into Firebase credential on React Native
      const credential = GoogleAuthProvider.credential(googleIdToken);
      const userCredential = await signInWithCredential(firebaseAuth, credential);
      const firebaseIdToken = await userCredential.user.getIdToken();

      // Send Firebase ID Token to NestJS backend to issue internal JWT
      await loginWithGoogle(firebaseIdToken);
      return { success: true };
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { success: false }; // User cancelled, no error message needed
    }

    return {
      success: false,
      error: 'Đăng nhập Google chưa hoàn tất.',
    };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    return {
      success: false,
      error: error?.message || 'Đăng nhập Google thất bại.',
    };
  }
}
