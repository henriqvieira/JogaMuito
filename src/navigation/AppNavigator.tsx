import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AuthenticatedHomeScreen from '../screens/AuthenticatedHomeScreen';
import { auth } from '../services/firebase';
import { clearAuthSession, saveAuthSession } from '../services/authStorage';

const AppNavigator = () => {
  const [screen, setScreen] = useState<'login' | 'register' | 'home'>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        await saveAuthSession({
          uid: user.uid,
          email: user.email,
          token: await user.getIdToken(),
        });
        setIsAuthenticated(true);
        setScreen('home');
      } else {
        await clearAuthSession();
        setIsAuthenticated(false);
        setScreen('login');
      }
    });

    return () => unsubscribe();
  }, []);

  if (isAuthenticated && screen === 'home') {
    return <AuthenticatedHomeScreen onLogout={() => setScreen('login')} />;
  }

  if (screen === 'register') {
    return (
      <RegisterScreen
        onRegistered={() => setScreen('home')}
        onSwitchToLogin={() => setScreen('login')}
      />
    );
  }

  return (
    <LoginScreen
      onAuthenticated={() => setScreen('home')}
      onSwitchToRegister={() => setScreen('register')}
    />
  );
};

export default AppNavigator;
