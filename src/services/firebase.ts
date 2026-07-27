import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
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
  apiKey: 'AIzaSyDUMMY-API-KEY',
  authDomain: 'jogamuito.firebaseapp.com',
  projectId: 'jogamuito',
  storageBucket: 'jogamuito.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:abc123',
};

let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
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
