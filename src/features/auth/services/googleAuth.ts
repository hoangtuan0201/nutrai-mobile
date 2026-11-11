import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { firebaseAuth } from '../../../lib/firebase';
import { useAuthStore } from '../../../store/authStore';

export interface GoogleAuthResult {
  success: boolean;
  isNewUser?: boolean;
  error?: string;
}

// Configure Google Sign-In with Web Client ID from .env or fallback
const webClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '86356630707-vtv08l3apeej61eg6kq7l329cj6iejoa.apps.googleusercontent.com';
if (webClientId) {
  try {
    GoogleSignin.configure({
      webClientId,
      offlineAccess: true,
    });
  } catch (e) {
    console.warn('GoogleSignin.configure warning:', e);
  }
}

/**
 * Handle Native Google Sign-In (Android & iOS).
 * 
 * Architecture:
 * 1. Calls Google Play Services native account picker bottom-sheet.
 * 2. User taps their Google account on device (1-tap).
 * 3. Retrieves Google ID Token directly from Google Play Services.
 * 4. Converts to Firebase credential via signInWithCredential.
 * 5. Sends Firebase ID Token to NestJS backend (POST /auth/google).
 * 6. NestJS issues internal JWT; SecureStore persists session.
 */
export async function performGoogleAuth(): Promise<GoogleAuthResult> {
  const { loginWithGoogle } = useAuthStore.getState();

  if (!webClientId) {
    return {
      success: false,
      error: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID chưa được cấu hình trong .env',
    };
  }

  try {
    // 1. Verify Google Play Services are available on Android device
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // 2. Open native Google account selector sheet
    const response = await GoogleSignin.signIn();

    // In @react-native-google-signin/google-signin v13+, token is under response.data
    const googleIdToken = response.data?.idToken ?? (response as any).idToken;

    if (!googleIdToken) {
      return {
        success: false,
        error: 'Không nhận được Google ID Token từ phiên đăng nhập.',
      };
    }

    // 3. Convert Google Credential into Firebase Credential
    const credential = GoogleAuthProvider.credential(googleIdToken);
    const userCredential = await signInWithCredential(firebaseAuth, credential);
    const firebaseIdToken = await userCredential.user.getIdToken();

    // 4. Send Firebase ID Token to NestJS backend for internal JWT issuance
    const res = await loginWithGoogle(firebaseIdToken);
    return { success: true, isNewUser: res?.isNewUser };

  } catch (error: any) {
    // Handle standard Google Sign-In status codes
    if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
      return { success: false }; // User closed account picker without selecting
    }
    if (error?.code === statusCodes.IN_PROGRESS) {
      return { success: false }; // Already in progress
    }
    if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return {
        success: false,
        error: 'Google Play Services không khả dụng trên thiết bị này.',
      };
    }

    // Check if running inside standard Expo Go (which does not bundle third-party native code)
    if (
      error?.message?.includes('RNGoogleSignin') ||
      error?.message?.includes('TurboModule') ||
      error?.message?.includes('NativeModule')
    ) {
      return {
        success: false,
        error:
          'Native Google Sign-In yêu cầu chạy bằng Development Build (npx expo run:android) thay vì Expo Go để nạp Google Play Services.',
      };
    }

    console.error('Native Google Sign-In Error details:', {
      message: error?.message,
      code: error?.code,
      url: error?.config?.url,
      baseURL: error?.config?.baseURL,
      status: error?.response?.status,
    });
    return {
      success: false,
      error: error?.message || 'Đăng nhập Google thất bại.',
    };
  }
}
