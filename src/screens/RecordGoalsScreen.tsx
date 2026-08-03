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
  GameEvent,
  MatchResult,
  TeamId,
  getGameEventById,
  getLatestGameEventByGroup,
  registerEventGoal,
  updateEventLineup,
} from '../services/eventService';

type RecordGoalsScreenProps = {
  onBack: () => void;
};

const initialResult: MatchResult = {
  teamA: 0,
  teamB: 0,
  winner: 'draw',
};

const RecordGoalsScreen = ({ onBack }: RecordGoalsScreenProps) => {
  const [groupId, setGroupId] = useState('');
  const [eventId, setEventId] = useState('');
  const [eventData, setEventData] = useState<GameEvent | null>(null);
  const [player, setPlayer] = useState('');
  const [team, setTeam] = useState<TeamId>('A');
  const [minute, setMinute] = useState('');
  const [result, setResult] = useState<MatchResult>(initialResult);
  const [lineupDraft, setLineupDraft] = useState<Record<string, TeamId>>({});
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingLineup, setSavingLineup] = useState(false);

  const availablePlayers = useMemo(() => {
    if (!eventData) {
      return [];
    }

    return [...eventData.lineup.teamA, ...eventData.lineup.teamB];
  }, [eventData]);

  const handleLoadEvent = async () => {
    if (!eventId.trim()) {
      Alert.alert('Evento obrigatório', 'Informe o ID do evento para registrar os gols.');
      return;
    }

    setLoadingEvent(true);
    try {
      const event = await getGameEventById(eventId.trim());
      setEventData(event);
      setResult(event.result ?? initialResult);
      const draft: Record<string, TeamId> = {};
      event.lineup.teamA.forEach((playerName) => {
        draft[playerName] = 'A';
      });
      event.lineup.teamB.forEach((playerName) => {
        draft[playerName] = 'B';
      });
      setLineupDraft(draft);
      setPlayer('');
      setMinute('');
      Alert.alert('Evento carregado', 'Agora voce pode registrar gols durante ou apos o jogo.');
    } catch (error: any) {
      Alert.alert('Erro ao carregar evento', error.message ?? 'Verifique o ID e tente novamente.');
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleLoadLatestEventByGroup = async () => {
    if (!groupId.trim()) {
      Alert.alert('Grupo obrigatório', 'Informe o ID do grupo para buscar o ultimo evento.');
      return;
    }

    setLoadingEvent(true);
    try {
      const event = await getLatestGameEventByGroup(groupId.trim());
      setEventData(event);
      setEventId(event.id);
      setResult(event.result ?? initialResult);

      const draft: Record<string, TeamId> = {};
      event.lineup.teamA.forEach((playerName) => {
        draft[playerName] = 'A';
      });
      event.lineup.teamB.forEach((playerName) => {
        draft[playerName] = 'B';
      });
      setLineupDraft(draft);
      setPlayer('');
      setMinute('');
      Alert.alert('Evento carregado', 'Ultimo evento do grupo carregado com sucesso.');
    } catch (error: any) {
      Alert.alert('Erro ao carregar ultimo evento', error.message ?? 'Tente novamente.');
    } finally {
      setLoadingEvent(false);
    }
  };

  const guessPlayerTeam = (selectedPlayer: string): TeamId => {
    if (!eventData) {
      return 'A';
    }

    if (eventData.lineup.teamB.includes(selectedPlayer)) {
      return 'B';
    }

    return 'A';
  };

  const handleSelectPlayer = (selectedPlayer: string) => {
    setPlayer(selectedPlayer);
    setTeam(guessPlayerTeam(selectedPlayer));
  };

  const handleDraftAssign = (playerName: string, teamId: TeamId) => {
    setLineupDraft((prev) => ({
      ...prev,
      [playerName]: teamId,
    }));
  };

  const handleSaveLineup = async () => {
    if (!eventData) {
      Alert.alert('Carregue o evento', 'Carregue um evento antes de editar a escalação.');
      return;
    }

    const allPlayers = eventData.participants;
    const teamA = allPlayers.filter((playerName) => lineupDraft[playerName] === 'A');
    const teamB = allPlayers.filter((playerName) => lineupDraft[playerName] === 'B');

    setSavingLineup(true);
    try {
      await updateEventLineup(eventData.id, { teamA, teamB });
      const refreshed = await getGameEventById(eventData.id);
      setEventData(refreshed);
      Alert.alert('Escalação atualizada', 'Permissão validada e escalação salva no Firestore.');
    } catch (error: any) {
      Alert.alert(
        'Erro ao atualizar escalação',
        error.message ?? 'Nao foi possivel salvar a escalação.',
      );
    } finally {
      setSavingLineup(false);
    }
  };

  const handleRegisterGoal = async () => {
    if (!eventData) {
      Alert.alert('Carregue o evento', 'Carregue um evento antes de registrar gols.');
      return;
    }

    if (!player.trim()) {
      Alert.alert('Jogador obrigatório', 'Selecione ou digite o jogador que marcou o gol.');
      return;
    }

    const parsedMinute = minute.trim() ? Number(minute.trim()) : undefined;
    if (parsedMinute !== undefined && Number.isNaN(parsedMinute)) {
      Alert.alert('Minuto invalido', 'Informe um numero valido para o minuto do gol.');
      return;
    }

    setSavingGoal(true);
    try {
      const updated = await registerEventGoal(eventData.id, {
        player: player.trim(),
        team,
        minute: parsedMinute,
      });

      setResult(updated.result);
      setMinute('');

      const refreshed = await getGameEventById(eventData.id);
      setEventData(refreshed);

      Alert.alert(
        'Gol registrado',
        `Placar atualizado: Time A ${updated.result.teamA} x ${updated.result.teamB} Time B`,
      );
    } catch (error: any) {
      Alert.alert('Erro ao registrar gol', error.message ?? 'Nao foi possivel salvar o gol.');
    } finally {
      setSavingGoal(false);
    }
  };

  const winnerText =
    result.winner === 'draw'
      ? 'Empate'
      : result.winner === 'A'
      ? 'Vencedor atual: Time A'
      : 'Vencedor atual: Time B';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>Voltar</Text>
            </Pressable>
            <Text style={styles.title}>Registrar gols</Text>
          </View>

          <Text style={styles.subtitle}>
            Registre gols durante ou após o jogo e salve o resultado automaticamente.
          </Text>
        </View>

        <Text style={styles.label}>ID do grupo</Text>
        <View style={styles.eventIdRow}>
          <TextInput
            testID="loadLatestEventGroupIdInput"
            value={groupId}
            onChangeText={setGroupId}
            placeholder="Grupo para carregar ultimo evento"
            style={[styles.input, styles.eventIdInput]}
            editable={!loadingEvent && !savingGoal && !savingLineup}
            autoCapitalize="none"
          />
          <Pressable
            testID="loadLatestEventButton"
            style={styles.loadButton}
            onPress={handleLoadLatestEventByGroup}
            disabled={loadingEvent || savingGoal || savingLineup}
          >
            <Text style={styles.loadButtonText}>
              {loadingEvent ? 'Carregando...' : 'Ultimo evento'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>ID do evento</Text>
        <View style={styles.eventIdRow}>
          <TextInput
            testID="goalEventIdInput"
            value={eventId}
            onChangeText={setEventId}
            placeholder="ID do documento no Firestore"
            style={[styles.input, styles.eventIdInput]}
            editable={!loadingEvent && !savingGoal}
            autoCapitalize="none"
          />
          <Pressable
            testID="loadEventButton"
            style={styles.loadButton}
            onPress={handleLoadEvent}
            disabled={loadingEvent || savingGoal}
          >
            <Text style={styles.loadButtonText}>{loadingEvent ? 'Carregando...' : 'Carregar'}</Text>
          </Pressable>
        </View>

        {eventData ? (
          <View style={styles.eventCard}>
            <Text style={styles.eventTitle}>Evento: {eventData.location}</Text>
            <Text style={styles.eventMeta}>Grupo: {eventData.groupId}</Text>
            <Text style={styles.eventMeta}>
              Data: {eventData.date} - Horario: {eventData.time}
            </Text>
            <Text style={styles.eventMeta}>
              Time A: {eventData.lineup.teamA.join(', ') || 'Sem jogadores'}
            </Text>
            <Text style={styles.eventMeta}>
              Time B: {eventData.lineup.teamB.join(', ') || 'Sem jogadores'}
            </Text>
          </View>
        ) : null}

        {eventData ? (
          <View style={styles.lineupEditCard}>
            <Text style={styles.lineupEditTitle}>Editar escalação (somente admin)</Text>
            <Text style={styles.lineupEditHint}>
              A permissão de administrador do grupo e validada antes de salvar.
            </Text>
            <View style={styles.lineupPlayersList}>
              {eventData.participants.map((playerName) => (
                <View key={playerName} style={styles.lineupPlayerRow}>
                  <Text style={styles.lineupPlayerName}>{playerName}</Text>
                  <View style={styles.lineupButtonsRow}>
                    <Pressable
                      style={[
                        styles.lineupTeamButton,
                        lineupDraft[playerName] === 'A' && styles.teamButtonActiveA,
                      ]}
                      onPress={() => handleDraftAssign(playerName, 'A')}
                    >
                      <Text style={styles.teamButtonText}>A</Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.lineupTeamButton,
                        lineupDraft[playerName] === 'B' && styles.teamButtonActiveB,
                      ]}
                      onPress={() => handleDraftAssign(playerName, 'B')}
                    >
                      <Text style={styles.teamButtonText}>B</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
            <Pressable
              testID="saveLineupButton"
              style={[styles.updateLineupButton, savingLineup && styles.disabledButton]}
              onPress={handleSaveLineup}
              disabled={savingLineup}
            >
              <Text style={styles.saveButtonText}>
                {savingLineup ? 'Salvando...' : 'Salvar escalação'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Resultado automatico</Text>
          <Text testID="resultScoreText" style={styles.scoreText}>
            Time A {result.teamA} x {result.teamB} Time B
          </Text>
          <Text style={styles.winnerText}>{winnerText}</Text>
        </View>

        <Text style={styles.label}>Jogador que marcou</Text>
        <TextInput
          testID="goalPlayerInput"
          value={player}
          onChangeText={setPlayer}
          placeholder="Nome do jogador"
          style={styles.input}
          editable={!savingGoal}
        />

        {availablePlayers.length > 0 ? (
          <View style={styles.playersCard}>
            <Text style={styles.playersTitle}>Selecionar jogador da escalacao</Text>
            <View style={styles.playersList}>
              {availablePlayers.map((playerName) => (
                <Pressable
                  key={playerName}
                  style={[styles.playerChip, player === playerName && styles.playerChipActive]}
                  onPress={() => handleSelectPlayer(playerName)}
                >
                  <Text style={styles.playerChipText}>{playerName}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <Text style={styles.label}>Time do gol</Text>
        <View style={styles.teamsRow}>
          <Pressable
            testID="goalTeamAButton"
            style={[styles.teamButton, team === 'A' && styles.teamButtonActiveA]}
            onPress={() => setTeam('A')}
            disabled={savingGoal}
          >
            <Text style={styles.teamButtonText}>Time A</Text>
          </Pressable>
          <Pressable
            testID="goalTeamBButton"
            style={[styles.teamButton, team === 'B' && styles.teamButtonActiveB]}
            onPress={() => setTeam('B')}
            disabled={savingGoal}
          >
            <Text style={styles.teamButtonText}>Time B</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Minuto do gol (opcional)</Text>
        <TextInput
          testID="goalMinuteInput"
          value={minute}
          onChangeText={setMinute}
          placeholder="Ex: 45"
          style={styles.input}
          editable={!savingGoal}
          keyboardType="number-pad"
        />

        <Pressable
          testID="registerGoalButton"
          style={[styles.saveButton, savingGoal && styles.disabledButton]}
          onPress={handleRegisterGoal}
          disabled={savingGoal}
        >
          <Text style={styles.saveButtonText}>{savingGoal ? 'Salvando...' : 'Registrar gol'}</Text>
        </Pressable>
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
    paddingTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    color: '#111827',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    color: '#334155',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  eventIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  eventIdInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 10,
  },
  loadButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  loadButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  eventCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7dd3fc',
    padding: 12,
    marginBottom: 14,
  },
  lineupEditCard: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    padding: 12,
    marginBottom: 16,
  },
  lineupEditTitle: {
    fontWeight: '700',
    color: '#312e81',
    marginBottom: 4,
  },
  lineupEditHint: {
    fontSize: 12,
    color: '#3730a3',
    marginBottom: 8,
  },
  lineupPlayersList: {
    marginBottom: 10,
  },
  lineupPlayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  lineupPlayerName: {
    fontSize: 13,
    color: '#1e1b4b',
    fontWeight: '600',
  },
  lineupButtonsRow: {
    flexDirection: 'row',
  },
  lineupTeamButton: {
    backgroundColor: '#94a3b8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 6,
  },
  updateLineupButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  eventTitle: {
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  eventMeta: {
    color: '#0f172a',
    fontSize: 13,
    marginBottom: 2,
  },
  scoreCard: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac',
    padding: 12,
    marginBottom: 16,
  },
  scoreTitle: {
    fontWeight: '700',
    color: '#14532d',
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#052e16',
    marginBottom: 4,
  },
  winnerText: {
    color: '#14532d',
    fontSize: 13,
  },
  playersCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  playersTitle: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 8,
    fontWeight: '600',
  },
  playersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  playerChip: {
    backgroundColor: '#cbd5e1',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  playerChipActive: {
    backgroundColor: '#0ea5e9',
  },
  playerChipText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  teamsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  teamButton: {
    backgroundColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10,
  },
  teamButtonActiveA: {
    backgroundColor: '#1d4ed8',
  },
  teamButtonActiveB: {
    backgroundColor: '#047857',
  },
  teamButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
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

export default RecordGoalsScreen;
