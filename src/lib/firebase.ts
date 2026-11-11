import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // @ts-ignore
  getReactNativePersistence,
  GoogleAuthProvider,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDOHXoT4udUjudjxcVo5jSgPTzFkthv15g',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'nutrai-b2bdd.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'nutrai-b2bdd',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'nutrai-b2bdd.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '86356630707',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:86356630707:android:8168bc3da69c07ba1ba4c6',
};

export const firebaseApp = (() => {
  try {
    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  } catch (error) {
    console.warn('[Firebase] initializeApp failed:', error);
    return null as any;
  }
})();

// Configure persistence: AsyncStorage on React Native, browser persistence on Web
export const firebaseAuth = (() => {
  if (!firebaseApp) return null as any;
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }
  try {
    // @ts-ignore
    const storage = typeof AsyncStorage.createAsyncStorage === 'function'
      // @ts-ignore
      ? AsyncStorage.createAsyncStorage('nutraai-auth')
      : AsyncStorage;

    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(storage),
    });
  } catch (error) {
    console.warn('[Firebase] initializeAuth with persistence failed, fallback to getAuth:', error);
    try {
      return getAuth(firebaseApp);
    } catch (e) {
      console.warn('[Firebase] getAuth fallback failed:', e);
      return null as any;
    }
  }
})();

export const googleAuthProvider = new GoogleAuthProvider();
