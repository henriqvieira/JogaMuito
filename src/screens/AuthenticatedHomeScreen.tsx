import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../design/theme';
import { clearAuthSession } from '../services/authStorage';
import { logout } from '../services/firebase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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

  if (showCreateGroup) return <CreateGroupScreen onBack={() => setShowCreateGroup(false)} onViewGroups={() => { setShowCreateGroup(false); setShowViewGroups(true); }} />;
  if (showViewGroups) return <ViewGroupsScreen onBack={() => setShowViewGroups(false)} />;
  if (showAcceptInvite) return <AcceptInviteScreen onBack={() => setShowAcceptInvite(false)} />;
  if (showCreateEvent) return <CreateGameEventScreen onBack={() => setShowCreateEvent(false)} />;
  if (showRecordGoals) return <RecordGoalsScreen onBack={() => setShowRecordGoals(false)} />;
  if (showManageCosts) return <ManageMatchCostScreen onBack={() => setShowManageCosts(false)} />;
  if (showFinancialHistory) return <FinancialHistoryScreen onBack={() => setShowFinancialHistory(false)} />;
  if (showMatchReport) return <GroupMatchReportScreen onBack={() => setShowMatchReport(false)} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.title}>Bem-vindo ao JogaMuito ⚽</Text>
          <Text style={styles.subtitle}>
            Seu clube em campo está pronto para organizar jogos, finanças e estatísticas.
          </Text>
        </View>

        <View style={styles.grid}>
          <Pressable style={[styles.card, styles.primary]} onPress={() => setShowCreateGroup(true)}>
            <Icon name="account-group" size={24} color="#fff" />
            <Text style={styles.cardText}>Criar grupo</Text>
          </Pressable>

          <Pressable style={[styles.card, styles.secondary]} onPress={() => setShowViewGroups(true)}>
            <Icon name="folder" size={24} color="#fff" />
            <Text style={styles.cardText}>Ver grupos</Text>
          </Pressable>

          <Pressable style={[styles.card, styles.accent]} onPress={() => setShowAcceptInvite(true)}>
            <Icon name="email" size={24} color="#fff" />
            <Text style={styles.cardText}>Aceitar convite</Text>
          </Pressable>

          <Pressable style={[styles.card, styles.event]} onPress={() => setShowCreateEvent(true)}>
            <Icon name="calendar" size={24} color="#fff" />
            <Text style={styles.cardText}>Criar evento</Text>
          </Pressable>

          <Pressable style={[styles.card, styles.goals]} onPress={() => setShowRecordGoals(true)}>
            <Icon name="soccer" size={24} color="#fff" />
            <Text style={styles.cardText}>Registrar gols</Text>
          </Pressable>

          <Pressable style={[styles.card, styles.costs]} onPress={() => setShowManageCosts(true)}>
            <Icon name="currency-usd" size={24} color="#fff" />
            <Text style={styles.cardText}>Gerenciar custos</Text>
          </Pressable>

          <Pressable style={[styles.card, styles.history]} onPress={() => setShowFinancialHistory(true)}>
            <Icon name="file-document" size={24} color="#fff" />
            <Text style={styles.cardText}>Histórico</Text>
          </Pressable>

          <Pressable style={[styles.card, styles.report]} onPress={() => setShowMatchReport(true)}>
            <Icon name="chart-bar" size={24} color="#fff" />
            <Text style={styles.cardText}>Estatísticas</Text>
          </Pressable>
        </View>

        <Pressable style={[styles.card, styles.logout]} onPress={handleLogout}>
          <Icon name="exit-to-app" size={24} color="#fff" />
          <Text style={styles.cardText}>Sair</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, padding: theme.spacing.lg },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
    marginBottom: theme.spacing.lg,
  },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  subtitle: { marginTop: theme.spacing.sm, fontSize: 15, color: theme.colors.textMuted, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.md,
    elevation: 3,
    gap: 8,
  },
  cardText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.info },
  accent: { backgroundColor: theme.colors.accent },
  event: { backgroundColor: '#3b82f6' },
  goals: { backgroundColor: '#0f766e' },
  costs: { backgroundColor: '#14b8a6' },
  history: { backgroundColor: '#8b5cf6' },
  report: { backgroundColor: '#6366f1' },
  logout: { backgroundColor: theme.colors.danger, width: '100%' },
});

export default AuthenticatedHomeScreen;
