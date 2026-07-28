import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDCVtLTn6nksIZCi0muz5Qbtgm_lZ4TXkI',
  authDomain: 'jogamuito-def71.firebaseapp.com',
  projectId: 'jogamuito-def71',
  storageBucket: 'jogamuito-def71.firebasestorage.app',
  messagingSenderId: '380674096547',
  appId: '1:380674096547:android:18792cd8e4efa587ebae16',
};

let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
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

export const signInWithSocialCredential = async (credential: any) => {
  return signInWithCredential(auth, credential);
};

export const logout = async () => {
  return signOut(auth);
};

export const logFirebaseError = (context: string, error: any) => {
  const payload = {
    context,
    code: error?.code,
    message: error?.message,
    name: error?.name,
  };

  console.error('[FirebaseError]', payload);
};

export const getFirebaseAuthErrorMessage = (error: any) => {
  const code = error?.code as string | undefined;

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
      return error?.message || 'Nao foi possivel criar a conta.';
  }
};
