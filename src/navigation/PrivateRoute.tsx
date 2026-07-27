import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getAuthSession } from '../services/authStorage';
import LoginScreen from '../screens/LoginScreen';

type PrivateRouteProps = {
  children: React.ReactNode;
  onAuthenticated?: () => void;
  onUnauthorized?: () => void;
};

const PrivateRoute = ({ children, onAuthenticated, onUnauthorized }: PrivateRouteProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      const session = await getAuthSession();
      const hasSession = Boolean(session?.uid);

      setIsAuthenticated(hasSession);
      setIsChecking(false);

      if (hasSession) {
        onAuthenticated?.();
      } else {
        onUnauthorized?.();
      }
    };

    verifySession();
  }, [onAuthenticated, onUnauthorized]);

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onAuthenticated={() => {}} onSwitchToRegister={() => {}} />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
