import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import SocialAuthButtons from '../components/SocialAuthButtons';
import { loginWithEmailAndPassword } from '../services/firebase';

type LoginScreenProps = {
  onAuthenticated: () => void;
  onSwitchToRegister: () => void;
};

const LoginScreen = ({ onAuthenticated, onSwitchToRegister }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | 'apple' | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    setSocialLoading(provider);

    try {
      if (provider === 'google') {
        Alert.alert('Google', 'Integre o fluxo com o Google Sign-In no seu projeto React Native para concluir este provedor.');
      } else if (provider === 'facebook') {
        Alert.alert('Facebook', 'Integre com o Facebook Login SDK para concluir este provedor.');
      } else {
        Alert.alert('Apple', 'Integre com o Sign in with Apple para concluir este provedor.');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      Alert.alert('Ops', 'Preencha email e senha para continuar.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      Alert.alert('Ops', 'Informe um email válido.');
      return;
    }

    setLoading(true);

    try {
      await loginWithEmailAndPassword(trimmedEmail, password);
      onAuthenticated();
    } catch (error: any) {
      Alert.alert('Erro ao entrar', error?.message || 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <Text style={styles.title}>JogaMuito</Text>
          <Text style={styles.subtitle}>Entre com sua conta para continuar.</Text>

          <TextInput
            testID="emailInput"
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            testID="passwordInput"
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable testID="loginButton" style={styles.button} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
          </Pressable>

          <SocialAuthButtons
            onGooglePress={() => handleSocialLogin('google')}
            onFacebookPress={() => handleSocialLogin('facebook')}
            onApplePress={() => handleSocialLogin('apple')}
            loading={socialLoading}
            disabled={loading}
          />

          <Pressable onPress={onSwitchToRegister}>
            <Text style={styles.linkText}>Ainda não tem conta? Cadastre-se</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: '#111827',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    marginTop: 16,
    color: '#2563eb',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default LoginScreen;
