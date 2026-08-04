import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../design/theme';
import { clearAuthSession } from '../services/authStorage';
import { logout } from '../services/firebase';
import CreateGroupScreen from './CreateGroupScreen';
import ViewGroupsScreen from './ViewGroupsScreen';
import AcceptInviteScreen from './AcceptInviteScreen';
import CreateGameEventScreen from './CreateGameEventScreen';
import RecordGoalsScreen from './RecordGoalsScreen';
import ManageMatchCostScreen from './ManageMatchCostScreen';
import FinancialHistoryScreen from './FinancialHistoryScreen';
import GroupMatchReportScreen from './GroupMatchReportScreen';

type AuthenticatedHomeScreenProps = {
  onLogout: () => void;
};

const AuthenticatedHomeScreen = ({ onLogout }: AuthenticatedHomeScreenProps) => {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showViewGroups, setShowViewGroups] = useState(false);
  const [showAcceptInvite, setShowAcceptInvite] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showRecordGoals, setShowRecordGoals] = useState(false);
  const [showManageCosts, setShowManageCosts] = useState(false);
  const [showFinancialHistory, setShowFinancialHistory] = useState(false);
  const [showMatchReport, setShowMatchReport] = useState(false);

  const handleLogout = async () => {
    await logout();
    await clearAuthSession();
    onLogout();
  };

  if (showCreateGroup) {
    return (
      <CreateGroupScreen
        onBack={() => setShowCreateGroup(false)}
        onViewGroups={() => {
          setShowCreateGroup(false);
          setShowViewGroups(true);
        }}
      />
    );
  }

  if (showViewGroups) {
    return <ViewGroupsScreen onBack={() => setShowViewGroups(false)} />;
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

  if (showManageCosts) {
    return <ManageMatchCostScreen onBack={() => setShowManageCosts(false)} />;
  }

  if (showFinancialHistory) {
    return <FinancialHistoryScreen onBack={() => setShowFinancialHistory(false)} />;
  }

  if (showMatchReport) {
    return <GroupMatchReportScreen onBack={() => setShowMatchReport(false)} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <Text testID="homeTitle" style={styles.title}>
            Bem-vindo ao JogaMuito
          </Text>
          <Text style={styles.subtitle}>
            Seu clube em campo está pronto para organizar jogos, finanças e estatísticas.
          </Text>
        </View>

        <View style={styles.actionsGrid}>
          <Pressable
            testID="createGroupHomeButton"
            style={[styles.button, styles.primaryButton]}
            onPress={() => setShowCreateGroup(true)}
          >
            <Text style={styles.buttonText}>Criar grupo</Text>
          </Pressable>

          <Pressable
            testID="viewGroupsButton"
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setShowViewGroups(true)}
          >
            <Text style={styles.buttonText}>Ver grupos</Text>
          </Pressable>

          <Pressable
            testID="acceptInviteButton"
            style={[styles.button, styles.accentButton]}
            onPress={() => setShowAcceptInvite(true)}
          >
            <Text style={styles.buttonText}>Aceitar convite</Text>
          </Pressable>

          <Pressable
            testID="createGameEventButton"
            style={[styles.button, styles.eventButton]}
            onPress={() => setShowCreateEvent(true)}
          >
            <Text style={styles.buttonText}>Criar evento</Text>
          </Pressable>

          <Pressable
            testID="recordGoalsButton"
            style={[styles.button, styles.goalsButton]}
            onPress={() => setShowRecordGoals(true)}
          >
            <Text style={styles.buttonText}>Registrar gols</Text>
          </Pressable>

          <Pressable
            testID="manageMatchCostsButton"
            style={[styles.button, styles.costsButton]}
            onPress={() => setShowManageCosts(true)}
          >
            <Text style={styles.buttonText}>Gerenciar custos</Text>
          </Pressable>

          <Pressable
            testID="financialHistoryButton"
            style={[styles.button, styles.historyButton]}
            onPress={() => setShowFinancialHistory(true)}
          >
            <Text style={styles.buttonText}>Histórico</Text>
          </Pressable>

          <Pressable
            testID="groupMatchReportButton"
            style={[styles.button, styles.matchReportButton]}
            onPress={() => setShowMatchReport(true)}
          >
            <Text style={styles.buttonText}>Estatísticas</Text>
          </Pressable>
        </View>

        <Pressable style={[styles.button, styles.tertiaryButton]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Sair</Text>
        </Pressable>
      </View>
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
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.card,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  actionsGrid: {
    marginBottom: theme.spacing.lg,
  },
  button: {
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.info,
  },
  accentButton: {
    backgroundColor: theme.colors.accent,
  },
  eventButton: {
    backgroundColor: '#3b82f6',
  },
  goalsButton: {
    backgroundColor: '#0f766e',
  },
  costsButton: {
    backgroundColor: '#14b8a6',
  },
  historyButton: {
    backgroundColor: '#8b5cf6',
  },
  matchReportButton: {
    backgroundColor: '#6366f1',
  },
  tertiaryButton: {
    backgroundColor: theme.colors.danger,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AuthenticatedHomeScreen;
