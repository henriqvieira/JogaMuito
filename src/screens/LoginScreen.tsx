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
import { theme, heroGradient } from '../design/theme';
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
        Alert.alert(
          'Google',
          'Integre o fluxo com o Google Sign-In no seu projeto React Native para concluir este provedor.',
        );
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>⚽ JogaMuito</Text>
            <Text style={styles.title}>Entre para organizar seu próximo jogo.</Text>
            <Text style={styles.subtitle}>Defina times, custos e convites em um só lugar.</Text>
          </View>

          <TextInput
            testID="emailInput"
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={theme.colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            testID="passwordInput"
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={theme.colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable
            testID="loginButton"
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
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
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.card,
  },
  hero: {
    paddingBottom: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  eyebrow: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceAlt,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  linkText: {
    marginTop: theme.spacing.md,
    color: theme.colors.primaryDark,
    textAlign: 'center',
    fontWeight: '700',
  },
});

export default LoginScreen;
