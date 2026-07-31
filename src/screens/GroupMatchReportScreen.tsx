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
import Share from 'react-native-share';
import { theme } from '../design/theme';
import {
  GroupMatchReport,
  GroupPlayerMatchStats,
  getSavedGroupMatchReport,
  isCurrentUserGroupAdmin,
  saveGroupMatchReport,
  updateGroupMatchReportManual,
} from '../services/eventService';

type GroupMatchReportScreenProps = {
  onBack: () => void;
};

const GroupMatchReportScreen = ({ onBack }: GroupMatchReportScreenProps) => {
  const [groupId, setGroupId] = useState('');
  const [report, setReport] = useState<GroupMatchReport | null>(null);
  const [editablePlayers, setEditablePlayers] = useState<GroupPlayerMatchStats[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const buildReportText = (data: GroupMatchReport) => {
    const lines = [
      `Relatorio de partidas - Grupo ${data.groupId}`,
      `Total de jogos: ${data.totalMatches}`,
      `Total de gols: ${data.totalGoals}`,
      '',
      'Estatisticas individuais:',
    ];

    data.players.forEach((player, index) => {
      lines.push(
        `${index + 1}. ${player.playerName} | Jogos: ${player.matches} | Gols: ${player.goals} | Vitorias: ${player.wins} | Derrotas: ${player.losses}`,
      );
    });

    return lines.join('\n');
  };

  const validateGroupId = () => {
    const normalizedGroupId = groupId.trim();
    if (!normalizedGroupId) {
      Alert.alert('Grupo obrigatorio', 'Informe o ID do grupo para carregar o relatorio.');
      return null;
    }

    return normalizedGroupId;
  };

  const handleGenerateAndSaveReport = async () => {
    const normalizedGroupId = validateGroupId();
    if (!normalizedGroupId) {
      return;
    }

    setLoading(true);
    try {
      const canEdit = await isCurrentUserGroupAdmin(normalizedGroupId);
      setIsAdmin(canEdit);

      const data = await saveGroupMatchReport(normalizedGroupId);
      setReport(data);
      setEditablePlayers(data.players);
      Alert.alert('Relatorio salvo', 'Estatisticas individuais calculadas e salvas no Firestore.');
      if (data.totalMatches === 0) {
        Alert.alert('Sem partidas', 'Nao ha partidas registradas para esse grupo ainda.');
      }
    } catch (error: any) {
      Alert.alert('Erro ao salvar relatorio', error.message ?? 'Nao foi possivel salvar os dados no Firestore.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSavedReport = async () => {
    const normalizedGroupId = validateGroupId();
    if (!normalizedGroupId) {
      return;
    }

    setLoading(true);
    try {
      const canEdit = await isCurrentUserGroupAdmin(normalizedGroupId);
      setIsAdmin(canEdit);

      const data = await getSavedGroupMatchReport(normalizedGroupId);
      setReport(data);
      setEditablePlayers(data.players);
      if (data.totalMatches === 0) {
        Alert.alert('Sem partidas', 'Nao ha partidas registradas para esse grupo ainda.');
      }
    } catch (error: any) {
      Alert.alert('Erro ao carregar relatorio', error.message ?? 'Nao foi possivel recuperar os dados salvos.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlayerStat = (
    index: number,
    field: 'matches' | 'wins' | 'losses' | 'goals',
    value: string,
  ) => {
    const numericValue = Math.max(0, Number(value.replace(/\D/g, '')) || 0);
    setEditablePlayers(prev =>
      prev.map((player, playerIndex) =>
        playerIndex === index
          ? {
              ...player,
              [field]: numericValue,
            }
          : player,
      ),
    );
  };

  const handleSaveManualStats = async () => {
    const normalizedGroupId = validateGroupId();
    if (!normalizedGroupId) {
      return;
    }

    if (!isAdmin) {
      Alert.alert('Permissao negada', 'Apenas administradores podem editar estatisticas manualmente.');
      return;
    }

    if (editablePlayers.length === 0) {
      Alert.alert('Sem jogadores', 'Carregue um relatorio antes de editar estatisticas.');
      return;
    }

    setLoading(true);
    try {
      const updatedReport = await updateGroupMatchReportManual(normalizedGroupId, editablePlayers);
      setReport(updatedReport);
      setEditablePlayers(updatedReport.players);
      Alert.alert('Estatisticas atualizadas', 'Alteracoes manuais salvas no Firestore com permissao de admin.');
    } catch (error: any) {
      Alert.alert('Erro ao salvar estatisticas', error.message ?? 'Nao foi possivel salvar as edicoes.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareReport = async () => {
    if (!report) {
      Alert.alert('Sem relatorio', 'Gere ou recupere um relatorio antes de compartilhar.');
      return;
    }

    const reportText = buildReportText(report);

    try {
      await Share.open({
        title: 'Relatorio de partidas',
        message: reportText,
        social: Share.Social.WHATSAPP,
      });
    } catch (error: any) {
      if (error?.message?.includes('not installed')) {
        Alert.alert('WhatsApp nao encontrado', 'Instale o WhatsApp para compartilhar o relatorio.');
      } else if (error?.message !== 'User did not share') {
        Alert.alert('Erro ao compartilhar', error.message ?? 'Nao foi possivel compartilhar o relatorio.');
      }
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
            <Text style={styles.title}>Relatório de partidas</Text>
          </View>

          <Text style={styles.subtitle}>
            Veja estatísticas individuais por jogador: jogos, gols, vitórias e derrotas.
          </Text>
        </View>

        <Text style={styles.label}>ID do grupo</Text>
        <View style={styles.searchRow}>
          <TextInput
            testID="matchReportGroupIdInput"
            value={groupId}
            onChangeText={setGroupId}
            placeholder="ID do grupo"
            style={[styles.input, styles.searchInput]}
            autoCapitalize="none"
            editable={!loading}
          />
          <Pressable
            testID="saveMatchReportButton"
            style={styles.saveButton}
            onPress={handleGenerateAndSaveReport}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>{loading ? 'Salvando...' : 'Salvar'}</Text>
          </Pressable>
          <Pressable
            testID="loadMatchReportButton"
            style={styles.loadButton}
            onPress={handleLoadSavedReport}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>{loading ? 'Carregando...' : 'Recuperar'}</Text>
          </Pressable>
        </View>

        {report ? (
          <View testID="matchReportSummaryCard" style={styles.summaryCard}>
            <Text testID="matchReportGroupTitle" style={styles.summaryTitle}>
              Grupo {report.groupId}
            </Text>
            <Text testID="matchReportTotalMatches" style={styles.summaryLine}>
              Total de jogos: {report.totalMatches}
            </Text>
            <Text testID="matchReportTotalGoals" style={styles.summaryLine}>
              Total de gols: {report.totalGoals}
            </Text>
            <Text style={styles.summaryHint}>
              Os dados sao salvos em groupMatchReports e recuperados do Firestore sob demanda.
            </Text>

            <Text style={styles.permissionHint}>
              {isAdmin
                ? 'Perfil administrador: voce pode editar estatisticas manualmente.'
                : 'Perfil comum: voce pode apenas visualizar e compartilhar relatorios.'}
            </Text>

            <Pressable
              testID="shareMatchReportButton"
              style={styles.shareButton}
              onPress={handleShareReport}
            >
              <Text style={styles.shareButtonText}>Exportar texto e compartilhar no WhatsApp</Text>
            </Pressable>
          </View>
        ) : null}

        {report && report.players.length > 0 ? (
          <View style={styles.playersSection}>
            <Text style={styles.playersTitle}>Desempenho por jogador</Text>
            {report.players.map(player => (
              <View
                key={player.playerName}
                testID={`matchReportPlayerCard-${player.playerName}`}
                style={styles.playerCard}
              >
                <Text testID={`matchReportPlayerName-${player.playerName}`} style={styles.playerName}>
                  {player.playerName}
                </Text>
                <Text testID={`matchReportPlayerMatches-${player.playerName}`} style={styles.playerLine}>
                  Jogos: {player.matches}
                </Text>
                <Text testID={`matchReportPlayerWins-${player.playerName}`} style={styles.playerLine}>
                  Vitorias: {player.wins}
                </Text>
                <Text testID={`matchReportPlayerLosses-${player.playerName}`} style={styles.playerLine}>
                  Derrotas: {player.losses}
                </Text>
                <Text testID={`matchReportPlayerGoals-${player.playerName}`} style={styles.playerGoals}>
                  Gols: {player.goals}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {report && editablePlayers.length > 0 && isAdmin ? (
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>Edicao manual (somente admin)</Text>
            {editablePlayers.map((player, index) => (
              <View key={`editable-${player.playerName}`} style={styles.editPlayerRow}>
                <Text style={styles.editPlayerName}>{player.playerName}</Text>
                <View style={styles.editInputsRow}>
                  <TextInput
                    value={`${player.matches}`}
                    onChangeText={value => handleChangePlayerStat(index, 'matches', value)}
                    keyboardType="number-pad"
                    style={styles.editInput}
                    placeholder="Jogos"
                  />
                  <TextInput
                    value={`${player.goals}`}
                    onChangeText={value => handleChangePlayerStat(index, 'goals', value)}
                    keyboardType="number-pad"
                    style={styles.editInput}
                    placeholder="Gols"
                  />
                  <TextInput
                    value={`${player.wins}`}
                    onChangeText={value => handleChangePlayerStat(index, 'wins', value)}
                    keyboardType="number-pad"
                    style={styles.editInput}
                    placeholder="Vitorias"
                  />
                  <TextInput
                    value={`${player.losses}`}
                    onChangeText={value => handleChangePlayerStat(index, 'losses', value)}
                    keyboardType="number-pad"
                    style={styles.editInput}
                    placeholder="Derrotas"
                  />
                </View>
              </View>
            ))}

            <Pressable
              testID="saveManualStatsButton"
              style={styles.manualSaveButton}
              onPress={handleSaveManualStats}
              disabled={loading}
            >
              <Text style={styles.manualSaveButtonText}>{loading ? 'Salvando...' : 'Salvar edicao manual'}</Text>
            </Pressable>
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
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#0f766e',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  loadButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  actionButtonText: {
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
  summaryHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
  },
  permissionHint: {
    fontSize: 12,
    color: '#0f172a',
    marginTop: 8,
    fontWeight: '600',
  },
  shareButton: {
    marginTop: 12,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  playersSection: {
    marginBottom: theme.spacing.xl,
  },
  playersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
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
    color: '#0f172a',
    fontWeight: '700',
    marginBottom: 6,
  },
  playerLine: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 2,
  },
  playerGoals: {
    fontSize: 14,
    color: '#0f766e',
    fontWeight: '700',
    marginTop: 4,
  },
  editCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    marginBottom: 20,
  },
  editTitle: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '700',
    marginBottom: 10,
  },
  editPlayerRow: {
    marginBottom: 10,
  },
  editPlayerName: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 6,
  },
  editInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 12,
    color: '#0f172a',
    marginRight: 6,
  },
  manualSaveButton: {
    marginTop: 8,
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  manualSaveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default GroupMatchReportScreen;
