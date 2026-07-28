import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { clearAuthSession } from '../services/authStorage';
import { logout } from '../services/firebase';
import GroupListScreen from './GroupListScreen';
import AcceptInviteScreen from './AcceptInviteScreen';
import CreateGameEventScreen from './CreateGameEventScreen';
import RecordGoalsScreen from './RecordGoalsScreen';

type AuthenticatedHomeScreenProps = {
  onLogout: () => void;
};

const AuthenticatedHomeScreen = ({ onLogout }: AuthenticatedHomeScreenProps) => {
  const [showGroups, setShowGroups] = useState(false);
  const [showAcceptInvite, setShowAcceptInvite] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showRecordGoals, setShowRecordGoals] = useState(false);

  const handleLogout = async () => {
    await logout();
    await clearAuthSession();
    onLogout();
  };

  if (showGroups) {
    return <GroupListScreen onLogout={handleLogout} onBack={() => setShowGroups(false)} />;
  }

  if (showAcceptInvite) {
    return <AcceptInviteScreen onBack={() => setShowAcceptInvite(false)} />;
  }

  if (showCreateEvent) {
    return <CreateGameEventScreen onBack={() => setShowCreateEvent(false)} />;
  }

  if (showRecordGoals) {
    return <RecordGoalsScreen onBack={() => setShowRecordGoals(false)} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text testID="homeTitle" style={styles.title}>Bem-vindo ao JogaMuito</Text>
        <Text style={styles.subtitle}>Sua conta foi autenticada com sucesso.</Text>

        <Pressable testID="viewGroupsButton" style={styles.primaryButton} onPress={() => setShowGroups(true)}>
          <Text style={styles.buttonText}>Ver grupos</Text>
        </Pressable>

        <Pressable testID="acceptInviteButton" style={styles.secondaryButton} onPress={() => setShowAcceptInvite(true)}>
          <Text style={styles.buttonText}>Aceitar convite</Text>
        </Pressable>

        <Pressable testID="createGameEventButton" style={styles.eventButton} onPress={() => setShowCreateEvent(true)}>
          <Text style={styles.buttonText}>Criar evento de jogo</Text>
        </Pressable>

        <Pressable testID="recordGoalsButton" style={styles.goalsButton} onPress={() => setShowRecordGoals(true)}>
          <Text style={styles.buttonText}>Registrar gols</Text>
        </Pressable>

        <Pressable style={styles.tertiaryButton} onPress={handleLogout}>
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
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  eventButton: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  goalsButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  tertiaryButton: {
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
