import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { theme } from '../design/theme';
import { acceptInviteWithCode } from '../services/groupService';

type AcceptInviteScreenProps = {
  onBack: () => void;
};

const AcceptInviteScreen = ({ onBack }: AcceptInviteScreenProps) => {
  const [inviteText, setInviteText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAcceptInvite = async () => {
    if (!inviteText.trim()) {
      Alert.alert('Convite obrigatório', 'Cole o código ou link do convite.');
      return;
    }

    setLoading(true);
    try {
      const groupName = await acceptInviteWithCode(inviteText.trim());
      Alert.alert('Convite aceito', `Você entrou no grupo ${groupName} com sucesso.`);
      setInviteText('');
      onBack();
    } catch (error: any) {
      Alert.alert('Falha ao aceitar convite', error.message ?? 'Verifique o convite e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>Voltar</Text>
            </Pressable>
            <Text style={styles.title}>Aceitar convite</Text>
          </View>

          <Text style={styles.subtitle}>
            Cole o link ou o código do convite para entrar no grupo.
          </Text>
        </View>

        <TextInput
          testID="inviteInput"
          value={inviteText}
          onChangeText={setInviteText}
          placeholder="Ex: https://jogamuito.app/invite/abc123"
          style={styles.input}
          editable={!loading}
          autoCapitalize="none"
        />

        <Pressable
          testID="acceptInviteConfirmButton"
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAcceptInvite}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Validando...' : 'Aceitar convite'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  headerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.sm,
    marginRight: theme.spacing.sm,
  },
  backButtonText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    lineHeight: 22,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AcceptInviteScreen;
