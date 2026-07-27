import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { clearAuthSession } from '../services/authStorage';
import { logout } from '../services/firebase';

type AuthenticatedHomeScreenProps = {
  onLogout: () => void;
};

const AuthenticatedHomeScreen = ({ onLogout }: AuthenticatedHomeScreenProps) => {
  const handleLogout = async () => {
    await logout();
    await clearAuthSession();
    onLogout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text testID="homeTitle" style={styles.title}>Bem-vindo ao JogaMuito</Text>
        <Text style={styles.subtitle}>Sua conta foi autenticada com sucesso.</Text>

        <Pressable style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Sair</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AuthenticatedHomeScreen;
