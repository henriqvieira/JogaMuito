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
import { GroupFinancialHistory, getGroupFinancialHistory } from '../services/matchCostService';

type FinancialHistoryScreenProps = {
  onBack: () => void;
};

const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

const FinancialHistoryScreen = ({ onBack }: FinancialHistoryScreenProps) => {
  const [groupId, setGroupId] = useState('');
  const [history, setHistory] = useState<GroupFinancialHistory | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoadHistory = async () => {
    const normalizedGroupId = groupId.trim();
    if (!normalizedGroupId) {
      Alert.alert('Grupo obrigatorio', 'Informe o ID do grupo para buscar o historico financeiro.');
      return;
    }

    setLoading(true);
    try {
      const data = await getGroupFinancialHistory(normalizedGroupId);
      setHistory(data);
      if (data.players.length === 0) {
        Alert.alert('Sem registros', 'Nao ha custos salvos para esse grupo.');
      }
    } catch (error: any) {
      Alert.alert('Erro ao carregar historico', error.message ?? 'Nao foi possivel consultar dados no Firestore.');
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
            <Text style={styles.title}>Histórico financeiro</Text>
          </View>

          <Text style={styles.subtitle}>
            Consulte por grupo quanto cada jogador já pagou, quanto ainda deve e os totais acumulados.
          </Text>
        </View>

        <Text style={styles.label}>ID do grupo</Text>
        <View style={styles.searchRow}>
          <TextInput
            testID="financialHistoryGroupIdInput"
            value={groupId}
            onChangeText={setGroupId}
            placeholder="ID do grupo"
            style={[styles.input, styles.searchInput]}
            autoCapitalize="none"
            editable={!loading}
          />
          <Pressable
            testID="loadFinancialHistoryButton"
            style={styles.loadButton}
            onPress={handleLoadHistory}
            disabled={loading}
          >
            <Text style={styles.loadButtonText}>{loading ? 'Carregando...' : 'Buscar'}</Text>
          </Pressable>
        </View>

        {history ? (
          <View testID="financialHistorySummaryCard" style={styles.summaryCard}>
            <Text testID="financialHistoryGroupTitle" style={styles.summaryTitle}>Totais do grupo {history.groupId}</Text>
            <Text testID="financialHistoryTotalPaidText" style={styles.summaryLine}>Total pago: {formatCurrency(history.totalPaid)}</Text>
            <Text testID="financialHistoryTotalOwedText" style={styles.summaryLine}>Total devido: {formatCurrency(history.totalOwed)}</Text>
            <Text testID="financialHistoryGrandTotalText" style={styles.summaryValue}>Total acumulado: {formatCurrency(history.grandTotal)}</Text>
          </View>
        ) : null}

        {history && history.players.length > 0 ? (
          <View style={styles.playersSection}>
            <Text style={styles.playersTitle}>Resumo por jogador</Text>
            {history.players.map(player => (
              <View key={player.playerName} testID={`financialPlayerCard-${player.playerName}`} style={styles.playerCard}>
                <Text testID={`financialPlayerName-${player.playerName}`} style={styles.playerName}>{player.playerName}</Text>
                <Text testID={`financialPlayerPaid-${player.playerName}`} style={styles.playerLine}>Pago: {formatCurrency(player.paid)}</Text>
                <Text testID={`financialPlayerOwed-${player.playerName}`} style={styles.playerLine}>Deve: {formatCurrency(player.owed)}</Text>
                <Text testID={`financialPlayerTotal-${player.playerName}`} style={styles.playerTotal}>Acumulado: {formatCurrency(player.total)}</Text>
                <Text testID={`financialPlayerMatches-${player.playerName}`} style={styles.playerMatches}>Partidas registradas: {player.matches}</Text>
              </View>
            ))}
          </View>
        ) : null}
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
  },
  label: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 15,
    color: theme.colors.text,
  },
  searchInput: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  loadButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  loadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  summaryLine: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 15,
    color: theme.colors.primaryDark,
    fontWeight: '700',
  },
  playersSection: {
    marginBottom: theme.spacing.xl,
  },
  playersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  playerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  playerName: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: 6,
  },
  playerLine: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  playerTotal: {
    fontSize: 14,
    color: theme.colors.primaryDark,
    fontWeight: '700',
    marginTop: 4,
  },
  playerMatches: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
});

export default FinancialHistoryScreen;