import React, { useMemo, useState } from 'react';
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
import {
  calculateMatchCostSummary,
  saveMatchCost,
  validateMatchCostAdminPermission,
} from '../services/matchCostService';

type ManageMatchCostScreenProps = {
  onBack: () => void;
};

type PlayerCostState = {
  name: string;
  isExempt: boolean;
};

const ManageMatchCostScreen = ({ onBack }: ManageMatchCostScreenProps) => {
  const [groupId, setGroupId] = useState('');
  const [eventId, setEventId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState<PlayerCostState[]>([]);
  const [saving, setSaving] = useState(false);

  const parsedTotalAmount = Number(totalAmount.replace(',', '.'));

  const summary = useMemo(() => {
    if (!Number.isFinite(parsedTotalAmount) || parsedTotalAmount <= 0 || players.length === 0) {
      return null;
    }

    try {
      return calculateMatchCostSummary(parsedTotalAmount, players);
    } catch {
      return null;
    }
  }, [parsedTotalAmount, players]);

  const handleAddPlayer = () => {
    const normalizedName = playerName.trim();
    if (!normalizedName) {
      Alert.alert('Jogador obrigatorio', 'Informe o nome do jogador para adicionar na divisao.');
      return;
    }

    if (players.some(player => player.name.toLowerCase() === normalizedName.toLowerCase())) {
      Alert.alert('Jogador duplicado', 'Esse jogador ja foi adicionado.');
      return;
    }

    setPlayers(prev => [...prev, { name: normalizedName, isExempt: false }]);
    setPlayerName('');
  };

  const handleRemovePlayer = (name: string) => {
    setPlayers(prev => prev.filter(player => player.name !== name));
  };

  const handleToggleExemption = (name: string) => {
    setPlayers(prev =>
      prev.map(player =>
        player.name === name
          ? {
              ...player,
              isExempt: !player.isExempt,
            }
          : player,
      ),
    );
  };

  const handleSaveCosts = async () => {
    const normalizedGroupId = groupId.trim();
    if (!normalizedGroupId) {
      Alert.alert('Grupo obrigatorio', 'Informe o ID do grupo para salvar o custo da partida.');
      return;
    }

    if (!Number.isFinite(parsedTotalAmount) || parsedTotalAmount <= 0) {
      Alert.alert('Valor invalido', 'Informe um valor total valido para a partida.');
      return;
    }

    if (players.length === 0) {
      Alert.alert('Sem jogadores', 'Adicione jogadores antes de salvar.');
      return;
    }

    setSaving(true);
    try {
      await validateMatchCostAdminPermission(normalizedGroupId);

      const saved = await saveMatchCost({
        groupId: normalizedGroupId,
        eventId: eventId.trim() || undefined,
        totalAmount: parsedTotalAmount,
        players,
      });

      Alert.alert('Custos salvos', `Registro salvo no Firestore com ID ${saved.id}.`);
      setEventId('');
      setTotalAmount('');
      setPlayerName('');
      setPlayers([]);
      onBack();
    } catch (error: any) {
      Alert.alert('Erro ao salvar custos', error.message ?? 'Nao foi possivel salvar os custos no Firestore.');
    } finally {
      setSaving(false);
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
            <Text style={styles.title}>Custos da partida</Text>
          </View>

          <Text style={styles.subtitle}>
            Informe o valor total, adicione os jogadores e escolha quem será isento para dividir automaticamente.
          </Text>
        </View>

        <Text style={styles.label}>ID do grupo</Text>
        <TextInput
          testID="matchCostGroupIdInput"
          value={groupId}
          onChangeText={setGroupId}
          placeholder="ID do grupo"
          style={styles.input}
          editable={!saving}
          autoCapitalize="none"
        />

        <Text style={styles.label}>ID do evento (opcional)</Text>
        <TextInput
          testID="matchCostEventIdInput"
          value={eventId}
          onChangeText={setEventId}
          placeholder="ID do evento de jogo"
          style={styles.input}
          editable={!saving}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Valor total da partida (R$)</Text>
        <TextInput
          testID="matchCostTotalAmountInput"
          value={totalAmount}
          onChangeText={setTotalAmount}
          placeholder="Ex: 240.00"
          style={styles.input}
          keyboardType="decimal-pad"
          editable={!saving}
        />

        <Text style={styles.label}>Jogadores</Text>
        <View style={styles.playerRow}>
          <TextInput
            testID="matchCostPlayerInput"
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Nome do jogador"
            style={[styles.input, styles.playerInput]}
            editable={!saving}
          />
          <Pressable
            testID="addMatchCostPlayerButton"
            style={styles.addPlayerButton}
            onPress={handleAddPlayer}
            disabled={saving}
          >
            <Text style={styles.addPlayerButtonText}>Adicionar</Text>
          </Pressable>
        </View>

        <View style={styles.playerList}>
          {players.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum jogador adicionado.</Text>
          ) : (
            players.map(player => {
              const currentAmount = summary?.breakdown.find(item => item.name === player.name)?.amount ?? 0;
              return (
                <View key={player.name} style={styles.playerCard}>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerAmount}>R$ {currentAmount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.playerActions}>
                    <Pressable
                      testID={`toggleExempt-${player.name}`}
                      style={[styles.exemptButton, player.isExempt && styles.exemptButtonActive]}
                      onPress={() => handleToggleExemption(player.name)}
                    >
                      <Text style={styles.exemptButtonText}>{player.isExempt ? 'Isento' : 'Cobrar'}</Text>
                    </Pressable>
                    <Pressable onPress={() => handleRemovePlayer(player.name)}>
                      <Text style={styles.removeText}>Remover</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumo da divisao</Text>
          <Text testID="matchCostTotalSummaryText" style={styles.summaryText}>
            Total da partida: R$ {Number.isFinite(parsedTotalAmount) ? parsedTotalAmount.toFixed(2) : '0.00'}
          </Text>
          <Text testID="matchCostChargeableCountText" style={styles.summaryText}>
            Jogadores pagantes: {summary?.chargeablePlayers ?? 0}
          </Text>
          <Text testID="matchCostExemptCountText" style={styles.summaryText}>
            Jogadores isentos: {summary?.exemptPlayers ?? 0}
          </Text>
          <Text testID="matchCostAmountPerPlayerText" style={styles.summaryValue}>
            Valor por pagante: R$ {summary?.amountPerPlayer.toFixed(2) ?? '0.00'}
          </Text>
        </View>

        <Pressable
          testID="saveMatchCostButton"
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSaveCosts}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Salvar custos no Firestore'}</Text>
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
  },
  label: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 6,
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
    marginBottom: theme.spacing.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  playerInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 10,
  },
  addPlayerButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  addPlayerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  playerList: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  playerCard: {
    backgroundColor: '#dbeafe',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  playerAmount: {
    fontSize: 14,
    color: '#1d4ed8',
    fontWeight: '700',
  },
  playerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exemptButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  exemptButtonActive: {
    backgroundColor: '#16a34a',
  },
  exemptButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  removeText: {
    fontSize: 13,
    color: '#b91c1c',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 14,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 15,
    color: '#1d4ed8',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#0f766e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default ManageMatchCostScreen;