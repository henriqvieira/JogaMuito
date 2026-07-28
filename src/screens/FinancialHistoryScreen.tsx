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
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </Pressable>
          <Text style={styles.title}>Historico financeiro</Text>
        </View>

        <Text style={styles.subtitle}>
          Consulte por grupo quanto cada jogador ja pagou, quanto ainda deve e os totais acumulados.
        </Text>

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
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 20,
    paddingTop: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  searchInput: {
    flex: 1,
    marginRight: 10,
  },
  loadButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  loadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 14,
    marginBottom: 18,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  summaryLine: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 15,
    color: '#0f766e',
    fontWeight: '700',
  },
  playersSection: {
    marginBottom: 20,
  },
  playersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  playerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 10,
  },
  playerName: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '700',
    marginBottom: 6,
  },
  playerLine: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 2,
  },
  playerTotal: {
    fontSize: 14,
    color: '#0f766e',
    fontWeight: '700',
    marginTop: 4,
  },
  playerMatches: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
});

export default FinancialHistoryScreen;