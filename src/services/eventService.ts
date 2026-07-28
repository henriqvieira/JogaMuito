import {
  addDoc,
  collection,
  doc,
  getDocs,
  getDoc,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export type TeamId = 'A' | 'B';

export type GoalRecord = {
  player: string;
  team: TeamId;
  minute?: number | null;
  createdBy: string;
  createdAt: Timestamp;
};

export type MatchResult = {
  teamA: number;
  teamB: number;
  winner: TeamId | 'draw';
};

export type CreateGameEventInput = {
  groupId: string;
  date: string;
  time: string;
  location: string;
  participants: string[];
  lineup: {
    teamA: string[];
    teamB: string[];
  };
};

export type GameEvent = {
  id: string;
  groupId: string;
  date: string;
  time: string;
  location: string;
  participants: string[];
  lineup: {
    teamA: string[];
    teamB: string[];
  };
  goals: GoalRecord[];
  result: MatchResult;
  createdBy: string;
  createdAt?: Timestamp | null;
};

const eventsCollection = collection(db, 'gameEvents');

const isValidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isValidTime = (value: string) => /^\d{2}:\d{2}$/.test(value);
const groupsCollection = collection(db, 'groups');

const normalizeLineup = (lineup: { teamA: string[]; teamB: string[] }) => ({
  teamA: lineup.teamA.map(player => player.trim()).filter(Boolean),
  teamB: lineup.teamB.map(player => player.trim()).filter(Boolean),
});

const validateLineup = (participants: string[], lineup: { teamA: string[]; teamB: string[] }) => {
  if (lineup.teamA.length === 0 || lineup.teamB.length === 0) {
    throw new Error('A escalação precisa ter jogadores nos dois times.');
  }

  const participantSet = new Set(participants);
  const teamASet = new Set(lineup.teamA);
  const teamBSet = new Set(lineup.teamB);

  for (const player of [...teamASet, ...teamBSet]) {
    if (!participantSet.has(player)) {
      throw new Error('A escalação contém jogador que não está na lista de participantes.');
    }
  }

  for (const player of teamASet) {
    if (teamBSet.has(player)) {
      throw new Error('Um jogador não pode estar nos dois times ao mesmo tempo.');
    }
  }
};

const assertUserIsGroupAdmin = async (groupId: string) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('Autenticação necessária para executar esta ação.');
  }

  const groupRef = doc(groupsCollection, groupId);
  const groupSnapshot = await getDoc(groupRef);
  if (!groupSnapshot.exists()) {
    throw new Error('Grupo não encontrado para validação de permissão.');
  }

  const admins = (groupSnapshot.data().admins ?? []) as string[];
  if (!admins.includes(userId)) {
    throw new Error('Permissão negada: apenas administradores do grupo podem salvar alterações.');
  }

  return userId;
};

export const validateGameEvent = (event: CreateGameEventInput) => {
  if (!event.groupId.trim()) {
    throw new Error('ID do grupo é obrigatório.');
  }

  if (!isValidDate(event.date.trim())) {
    throw new Error('Data inválida. Use o formato AAAA-MM-DD.');
  }

  if (!isValidTime(event.time.trim())) {
    throw new Error('Horário inválido. Use o formato HH:MM.');
  }

  if (!event.location.trim()) {
    throw new Error('Local é obrigatório.');
  }

  if (event.participants.length === 0) {
    throw new Error('Adicione ao menos um participante.');
  }

  validateLineup(event.participants, event.lineup);
};

export const calculateMatchResult = (goals: GoalRecord[]): MatchResult => {
  const teamA = goals.filter(goal => goal.team === 'A').length;
  const teamB = goals.filter(goal => goal.team === 'B').length;

  if (teamA === teamB) {
    return { teamA, teamB, winner: 'draw' };
  }

  return {
    teamA,
    teamB,
    winner: teamA > teamB ? 'A' : 'B',
  };
};

export const createGameEvent = async (event: CreateGameEventInput) => {
  // Permission validation is performed before any write to Firestore.
  const userId = await assertUserIsGroupAdmin(event.groupId.trim());

  const normalizedEvent = {
    groupId: event.groupId.trim(),
    date: event.date.trim(),
    time: event.time.trim(),
    location: event.location.trim(),
    participants: event.participants.map(participant => participant.trim()).filter(Boolean),
    lineup: normalizeLineup(event.lineup),
  };

  validateGameEvent(normalizedEvent);

  return addDoc(eventsCollection, {
    ...normalizedEvent,
    goals: [],
    result: {
      teamA: 0,
      teamB: 0,
      winner: 'draw',
    },
    createdBy: userId,
    createdAt: serverTimestamp(),
  });
};

export const getGameEventById = async (eventId: string) => {
  const eventRef = doc(db, 'gameEvents', eventId.trim());
  const snapshot = await getDoc(eventRef);

  if (!snapshot.exists()) {
    throw new Error('Evento não encontrado.');
  }

  const data = snapshot.data();
  return {
    id: snapshot.id,
    groupId: data.groupId ?? '',
    date: data.date ?? '',
    time: data.time ?? '',
    location: data.location ?? '',
    participants: data.participants ?? [],
    lineup: {
      teamA: data.lineup?.teamA ?? [],
      teamB: data.lineup?.teamB ?? [],
    },
    goals: (data.goals ?? []) as GoalRecord[],
    result: (data.result ?? { teamA: 0, teamB: 0, winner: 'draw' }) as MatchResult,
    createdBy: data.createdBy ?? '',
    createdAt: data.createdAt ?? null,
  } as GameEvent;
};

export const getLatestGameEventByGroup = async (groupId: string) => {
  const normalizedGroupId = groupId.trim();
  if (!normalizedGroupId) {
    throw new Error('ID do grupo é obrigatório para buscar eventos.');
  }

  const eventsQuery = query(
    eventsCollection,
    where('groupId', '==', normalizedGroupId),
    orderBy('createdAt', 'desc'),
    limit(1),
  );

  const snapshot = await getDocs(eventsQuery);
  if (snapshot.empty) {
    throw new Error('Nenhum evento encontrado para este grupo.');
  }

  const latestEvent = snapshot.docs[0];
  return getGameEventById(latestEvent.id);
};

export const updateEventLineup = async (eventId: string, lineup: { teamA: string[]; teamB: string[] }) => {
  const eventRef = doc(db, 'gameEvents', eventId.trim());
  const eventSnapshot = await getDoc(eventRef);

  if (!eventSnapshot.exists()) {
    throw new Error('Evento não encontrado.');
  }

  const eventData = eventSnapshot.data();
  const groupId = (eventData.groupId ?? '').toString().trim();
  if (!groupId) {
    throw new Error('Evento sem grupo vinculado. Não foi possível validar permissão.');
  }

  await assertUserIsGroupAdmin(groupId);

  const participants = (eventData.participants ?? []) as string[];
  const normalizedLineup = normalizeLineup(lineup);
  validateLineup(participants, normalizedLineup);

  return runTransaction(db, async transaction => {
    const freshEvent = await transaction.get(eventRef);
    if (!freshEvent.exists()) {
      throw new Error('Evento não encontrado.');
    }

    transaction.update(eventRef, {
      lineup: normalizedLineup,
      updatedAt: serverTimestamp(),
    });

    return normalizedLineup;
  });
};

export const registerEventGoal = async (eventId: string, input: { player: string; team: TeamId; minute?: number }) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('Autenticação necessária para registrar gols.');
  }

  const normalizedPlayer = input.player.trim();
  if (!normalizedPlayer) {
    throw new Error('Jogador é obrigatório para registrar gol.');
  }

  if (input.minute !== undefined && (input.minute < 0 || input.minute > 300)) {
    throw new Error('Minuto do gol inválido.');
  }

  const eventRef = doc(db, 'gameEvents', eventId.trim());

  const eventSnapshot = await getDoc(eventRef);
  if (!eventSnapshot.exists()) {
    throw new Error('Evento não encontrado.');
  }

  const groupId = (eventSnapshot.data().groupId ?? '').toString().trim();
  if (!groupId) {
    throw new Error('Evento sem grupo vinculado. Não foi possível validar permissão.');
  }

  await assertUserIsGroupAdmin(groupId);

  return runTransaction(db, async transaction => {
    const eventSnapshot = await transaction.get(eventRef);
    if (!eventSnapshot.exists()) {
      throw new Error('Evento não encontrado.');
    }

    const data = eventSnapshot.data();
    const teamA = (data.lineup?.teamA ?? []) as string[];
    const teamB = (data.lineup?.teamB ?? []) as string[];
    const participants = (data.participants ?? []) as string[];

    if (!participants.includes(normalizedPlayer)) {
      throw new Error('Jogador não está listado como participante do evento.');
    }

    const belongsToSelectedTeam =
      (input.team === 'A' && teamA.includes(normalizedPlayer)) ||
      (input.team === 'B' && teamB.includes(normalizedPlayer));

    if (!belongsToSelectedTeam) {
      throw new Error('Jogador não pertence ao time selecionado na escalação.');
    }

    const currentGoals = ((data.goals ?? []) as GoalRecord[]).map(goal => ({
      ...goal,
      createdAt: goal.createdAt instanceof Timestamp ? goal.createdAt : Timestamp.now(),
    }));

    const newGoal: GoalRecord = {
      player: normalizedPlayer,
      team: input.team,
      minute: input.minute ?? null,
      createdBy: userId,
      createdAt: Timestamp.now(),
    };

    const goals = [...currentGoals, newGoal];
    const result = calculateMatchResult(goals);

    transaction.update(eventRef, {
      goals,
      result,
      updatedAt: serverTimestamp(),
    });

    return { goals, result };
  });
};
