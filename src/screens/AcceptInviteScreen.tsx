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
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </Pressable>
          <Text style={styles.title}>Aceitar convite</Text>
        </View>

        <Text style={styles.subtitle}>
          Cole o link ou o código do convite para entrar no grupo.
        </Text>

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
    backgroundColor: '#eef2ff',
  },
  container: {
    padding: 20,
    paddingTop: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 20,
    lineHeight: 22,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
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
