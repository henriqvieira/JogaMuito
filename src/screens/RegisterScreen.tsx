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
import { theme } from '../design/theme';
import {
  getFirebaseAuthErrorMessage,
  logFirebaseError,
  registerWithEmailAndPassword,
} from '../services/firebase';

type RegisterScreenProps = {
  onRegistered: () => void;
  onSwitchToLogin: () => void;
};

const RegisterScreen = ({ onRegistered, onSwitchToLogin }: RegisterScreenProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      Alert.alert('Ops', 'Preencha nome, email e senha para cadastrar.');
      return;
    }

    if (trimmedName.length < 3) {
      Alert.alert('Ops', 'O nome precisa ter pelo menos 3 caracteres.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      Alert.alert('Ops', 'Informe um email válido.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Ops', 'A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Ops', 'As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      await registerWithEmailAndPassword(trimmedEmail, password, trimmedName);
      onRegistered();
    } catch (error: any) {
      logFirebaseError('registerWithEmailAndPassword', error);
      Alert.alert('Erro ao cadastrar', getFirebaseAuthErrorMessage(error));
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
            <Text style={styles.eyebrow}>⚽ Novo no JogaMuito?</Text>
            <Text style={styles.title}>Crie sua conta e monte seu time.</Text>
            <Text style={styles.subtitle}>
              Cadastre-se para centralizar eventos, finanças e convites.
            </Text>
          </View>

          <TextInput
            testID="registerNameInput"
            style={styles.input}
            placeholder="Nome"
            placeholderTextColor={theme.colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            testID="registerEmailInput"
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={theme.colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            testID="registerPasswordInput"
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={theme.colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            testID="registerConfirmPasswordInput"
            style={styles.input}
            placeholder="Confirmar senha"
            placeholderTextColor={theme.colors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Pressable
            testID="registerButton"
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Cadastrando...' : 'Cadastrar'}</Text>
          </Pressable>

          <Pressable onPress={onSwitchToLogin}>
            <Text style={styles.linkText}>Já tem conta? Entre agora</Text>
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
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
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

export default RegisterScreen;
