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
import { createGameEvent } from '../services/eventService';

type CreateGameEventScreenProps = {
  onBack: () => void;
};

const CreateGameEventScreen = ({ onBack }: CreateGameEventScreenProps) => {
  const [groupId, setGroupId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [teamAssignments, setTeamAssignments] = useState<Record<string, 'A' | 'B'>>({});
  const [loading, setLoading] = useState(false);

  const handleAddParticipant = () => {
    const normalizedName = participantName.trim();
    if (!normalizedName) {
      Alert.alert('Participante obrigatório', 'Informe um nome para adicionar à lista.');
      return;
    }

    if (participants.includes(normalizedName)) {
      Alert.alert('Participante duplicado', 'Esse participante já foi adicionado.');
      return;
    }

    setParticipants(prev => [...prev, normalizedName]);
    setParticipantName('');
  };

  const handleRemoveParticipant = (name: string) => {
    setParticipants(prev => prev.filter(participant => participant !== name));
    setTeamAssignments(prev => {
      const nextAssignments = { ...prev };
      delete nextAssignments[name];
      return nextAssignments;
    });
  };

  const handleAssignTeam = (name: string, team: 'A' | 'B') => {
    setTeamAssignments(prev => {
      if (prev[name] === team) {
        const nextAssignments = { ...prev };
        delete nextAssignments[name];
        return nextAssignments;
      }

      return {
        ...prev,
        [name]: team,
      };
    });
  };

  const teamA = participants.filter(player => teamAssignments[player] === 'A');
  const teamB = participants.filter(player => teamAssignments[player] === 'B');

  const handleCreateEvent = async () => {
    setLoading(true);
    try {
      await createGameEvent({
        groupId,
        date,
        time,
        location,
        participants,
        lineup: {
          teamA,
          teamB,
        },
      });

      Alert.alert('Evento criado', 'O evento foi salvo no Firebase Firestore com sucesso.');
      setGroupId('');
      setDate('');
      setTime('');
      setLocation('');
      setParticipantName('');
      setParticipants([]);
      setTeamAssignments({});
      onBack();
    } catch (error: any) {
      Alert.alert('Erro ao criar evento', error.message ?? 'Não foi possível salvar o evento.');
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
          <Text style={styles.title}>Criar evento de jogo</Text>
        </View>

        <Text style={styles.subtitle}>Preencha os dados, monte os times e salve no Firestore.</Text>

        <Text style={styles.label}>ID do grupo</Text>
        <TextInput
          testID="eventGroupIdInput"
          value={groupId}
          onChangeText={setGroupId}
          placeholder="ID do grupo (admins podem criar eventos)"
          style={styles.input}
          editable={!loading}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Data</Text>
        <TextInput
          testID="eventDateInput"
          value={date}
          onChangeText={setDate}
          placeholder="AAAA-MM-DD"
          style={styles.input}
          editable={!loading}
        />

        <Text style={styles.label}>Horário</Text>
        <TextInput
          testID="eventTimeInput"
          value={time}
          onChangeText={setTime}
          placeholder="HH:MM"
          style={styles.input}
          editable={!loading}
        />

        <Text style={styles.label}>Local</Text>
        <TextInput
          testID="eventLocationInput"
          value={location}
          onChangeText={setLocation}
          placeholder="Ex: Quadra Central"
          style={styles.input}
          editable={!loading}
        />

        <Text style={styles.label}>Participantes</Text>
        <View style={styles.participantRow}>
          <TextInput
            testID="eventParticipantInput"
            value={participantName}
            onChangeText={setParticipantName}
            placeholder="Nome do participante"
            style={[styles.input, styles.participantInput]}
            editable={!loading}
          />
          <Pressable
            testID="addParticipantButton"
            style={styles.addParticipantButton}
            onPress={handleAddParticipant}
            disabled={loading}
          >
            <Text style={styles.addParticipantButtonText}>Adicionar</Text>
          </Pressable>
        </View>

        <View style={styles.participantList}>
          {participants.length === 0 ? (
            <Text style={styles.emptyListText}>Nenhum participante adicionado.</Text>
          ) : (
            participants.map(name => (
              <View key={name} style={styles.participantChip}>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>{name}</Text>
                  <Text style={styles.assignmentText}>
                    {teamAssignments[name] ? `Time ${teamAssignments[name]}` : 'Sem time'}
                  </Text>
                </View>
                <View style={styles.participantActions}>
                  <Pressable
                    testID={`assignTeamA-${name}`}
                    style={[styles.teamButton, teamAssignments[name] === 'A' && styles.teamButtonActiveA]}
                    onPress={() => handleAssignTeam(name, 'A')}
                  >
                    <Text style={styles.teamButtonText}>Time A</Text>
                  </Pressable>
                  <Pressable
                    testID={`assignTeamB-${name}`}
                    style={[styles.teamButton, teamAssignments[name] === 'B' && styles.teamButtonActiveB]}
                    onPress={() => handleAssignTeam(name, 'B')}
                  >
                    <Text style={styles.teamButtonText}>Time B</Text>
                  </Pressable>
                  <Pressable onPress={() => handleRemoveParticipant(name)}>
                    <Text style={styles.removeParticipantText}>Remover</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.lineupSummaryCard}>
          <Text style={styles.lineupTitle}>Escalacao dos times</Text>
          <Text style={styles.lineupItem}>Time A: {teamA.join(', ') || 'Sem jogadores'}</Text>
          <Text style={styles.lineupItem}>Time B: {teamB.join(', ') || 'Sem jogadores'}</Text>
          <Text style={styles.lineupHint}>
            Distribua os participantes entre os dois times antes de salvar o evento.
          </Text>
        </View>

        <Pressable
          testID="saveEventButton"
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleCreateEvent}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>{loading ? 'Salvando...' : 'Salvar evento'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f9ff',
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
    color: '#111827',
    fontWeight: '600',
    marginBottom: 6,
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
    marginBottom: 14,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 10,
  },
  addParticipantButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  addParticipantButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  participantList: {
    marginTop: 8,
    marginBottom: 20,
  },
  emptyListText: {
    fontSize: 14,
    color: '#64748b',
  },
  participantChip: {
    flexDirection: 'column',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  participantInfo: {
    marginBottom: 8,
  },
  participantName: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  assignmentText: {
    fontSize: 13,
    color: '#334155',
    marginTop: 2,
  },
  participantActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  teamButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#cbd5e1',
    marginRight: 8,
    marginBottom: 6,
  },
  teamButtonActiveA: {
    backgroundColor: '#1d4ed8',
  },
  teamButtonActiveB: {
    backgroundColor: '#047857',
  },
  teamButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  removeParticipantText: {
    fontSize: 13,
    color: '#b91c1c',
    fontWeight: '600',
  },
  lineupSummaryCard: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#7dd3fc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  lineupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  lineupItem: {
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 4,
  },
  lineupHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#334155',
  },
  saveButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CreateGameEventScreen;
