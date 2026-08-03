import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import {
  AuthCredential,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut,
} from 'firebase/auth';
import {
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
} from '@env';

const requiredEnv = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing required Firebase env var: ${name}`);
  }

  return value;
};

const firebaseConfig = {
  apiKey: requiredEnv(FIREBASE_API_KEY, 'FIREBASE_API_KEY'),
  authDomain: requiredEnv(FIREBASE_AUTH_DOMAIN, 'FIREBASE_AUTH_DOMAIN'),
  projectId: requiredEnv(FIREBASE_PROJECT_ID, 'FIREBASE_PROJECT_ID'),
  storageBucket: requiredEnv(FIREBASE_STORAGE_BUCKET, 'FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requiredEnv(FIREBASE_MESSAGING_SENDER_ID, 'FIREBASE_MESSAGING_SENDER_ID'),
  appId: requiredEnv(FIREBASE_APP_ID, 'FIREBASE_APP_ID'),
};

let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);

// In React Native, force long polling to avoid Firestore transport issues.
initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

export const loginWithEmailAndPassword = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmailAndPassword = async (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithSocialCredential = async (credential: AuthCredential) => {
  return signInWithCredential(auth, credential);
};

export const logout = async () => {
  return signOut(auth);
};

export const logFirebaseError = (context: string, error: unknown) => {
  const typedError = error as { code?: string; message?: string; name?: string } | null;

  const payload = {
    context,
    code: typedError?.code,
    message: typedError?.message,
    name: typedError?.name,
  };

  console.error('[FirebaseError]', payload);
};

export const getFirebaseAuthErrorMessage = (error: unknown) => {
  const typedError = error as { code?: string; message?: string } | null;
  const code = typedError?.code;

  switch (code) {
    case 'auth/configuration-not-found':
      return 'Configuracao de autenticacao nao encontrada. No Firebase Console, ative Authentication > Sign-in method > Email/Password e confira se a config web do Firebase esta correta no app.';
    case 'auth/email-already-in-use':
      return 'Este email ja esta em uso.';
    case 'auth/invalid-email':
      return 'Email invalido.';
    case 'auth/weak-password':
      return 'Senha fraca. Use pelo menos 6 caracteres.';
    case 'auth/operation-not-allowed':
      return 'Cadastro por email/senha nao habilitado no Firebase.';
    case 'auth/network-request-failed':
      return 'Falha de rede. Verifique sua conexao e tente novamente.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    default:
      return typedError?.message || 'Nao foi possivel criar a conta.';
  }
};
