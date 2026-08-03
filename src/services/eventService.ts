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
  setDoc,
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

export type GroupPlayerMatchStats = {
  playerName: string;
  matches: number;
  wins: number;
  losses: number;
  goals: number;
};

export type GroupMatchReport = {
  groupId: string;
  totalMatches: number;
  totalGoals: number;
  players: GroupPlayerMatchStats[];
};

export type ManualPlayerStatsInput = {
  playerName: string;
  matches: number;
  wins: number;
  losses: number;
  goals: number;
};

const eventsCollection = collection(db, 'gameEvents');

const isValidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isValidTime = (value: string) => /^\d{2}:\d{2}$/.test(value);
const groupsCollection = collection(db, 'groups');

const normalizeLineup = (lineup: { teamA: string[]; teamB: string[] }) => ({
  teamA: lineup.teamA.map((player) => player.trim()).filter(Boolean),
  teamB: lineup.teamB.map((player) => player.trim()).filter(Boolean),
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
  const teamA = goals.filter((goal) => goal.team === 'A').length;
  const teamB = goals.filter((goal) => goal.team === 'B').length;

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
    participants: event.participants.map((participant) => participant.trim()).filter(Boolean),
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

const ensurePlayerStats = (
  playerMap: Record<string, GroupPlayerMatchStats>,
  playerName: string,
) => {
  const normalizedName = playerName.trim();
  if (!normalizedName) {
    return null;
  }

  if (!playerMap[normalizedName]) {
    playerMap[normalizedName] = {
      playerName: normalizedName,
      matches: 0,
      wins: 0,
      losses: 0,
      goals: 0,
    };
  }

  return playerMap[normalizedName];
};

export const getGroupMatchReport = async (groupId: string): Promise<GroupMatchReport> => {
  const normalizedGroupId = groupId.trim();
  if (!normalizedGroupId) {
    throw new Error('ID do grupo e obrigatorio para consultar relatorio de partidas.');
  }

  const eventsQuery = query(eventsCollection, where('groupId', '==', normalizedGroupId));
  const snapshot = await getDocs(eventsQuery);

  const playerMap: Record<string, GroupPlayerMatchStats> = {};
  let totalGoals = 0;

  snapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data();

    const teamA = (data.lineup?.teamA ?? []) as string[];
    const teamB = (data.lineup?.teamB ?? []) as string[];

    const teamAPlayers = Array.from(new Set(teamA.map((player) => player.trim()).filter(Boolean)));
    const teamBPlayers = Array.from(new Set(teamB.map((player) => player.trim()).filter(Boolean)));

    const winner = (data.result?.winner ?? 'draw') as TeamId | 'draw';

    teamAPlayers.forEach((playerName) => {
      const stats = ensurePlayerStats(playerMap, playerName);
      if (!stats) {
        return;
      }

      stats.matches += 1;
      if (winner === 'A') {
        stats.wins += 1;
      } else if (winner === 'B') {
        stats.losses += 1;
      }
    });

    teamBPlayers.forEach((playerName) => {
      const stats = ensurePlayerStats(playerMap, playerName);
      if (!stats) {
        return;
      }

      stats.matches += 1;
      if (winner === 'B') {
        stats.wins += 1;
      } else if (winner === 'A') {
        stats.losses += 1;
      }
    });

    const goals = (data.goals ?? []) as GoalRecord[];
    goals.forEach((goal) => {
      const stats = ensurePlayerStats(playerMap, goal.player ?? '');
      if (!stats) {
        return;
      }

      stats.goals += 1;
      totalGoals += 1;
    });
  });

  const players = Object.values(playerMap).sort((a, b) => {
    if (b.goals !== a.goals) {
      return b.goals - a.goals;
    }

    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }

    return a.playerName.localeCompare(b.playerName);
  });

  return {
    groupId: normalizedGroupId,
    totalMatches: snapshot.size,
    totalGoals,
    players,
  };
};

export const saveGroupMatchReport = async (groupId: string): Promise<GroupMatchReport> => {
  const normalizedGroupId = groupId.trim();
  if (!normalizedGroupId) {
    throw new Error('ID do grupo e obrigatorio para salvar relatorio de partidas.');
  }

  await assertUserIsGroupAdmin(normalizedGroupId);

  const report = await getGroupMatchReport(normalizedGroupId);
  const reportRef = doc(db, 'groupMatchReports', normalizedGroupId);

  await setDoc(reportRef, {
    ...report,
    updatedAt: serverTimestamp(),
  });

  return report;
};

export const isCurrentUserGroupAdmin = async (groupId: string): Promise<boolean> => {
  const normalizedGroupId = groupId.trim();
  if (!normalizedGroupId) {
    return false;
  }

  const userId = auth.currentUser?.uid;
  if (!userId) {
    return false;
  }

  const groupRef = doc(groupsCollection, normalizedGroupId);
  const groupSnapshot = await getDoc(groupRef);
  if (!groupSnapshot.exists()) {
    return false;
  }

  const admins = (groupSnapshot.data().admins ?? []) as string[];
  return admins.includes(userId);
};

const normalizeManualPlayerStats = (players: ManualPlayerStatsInput[]) => {
  const normalizedPlayers = players
    .map((player) => ({
      playerName: player.playerName.trim(),
      matches: Math.max(0, Number(player.matches) || 0),
      wins: Math.max(0, Number(player.wins) || 0),
      losses: Math.max(0, Number(player.losses) || 0),
      goals: Math.max(0, Number(player.goals) || 0),
    }))
    .filter((player) => player.playerName.length > 0);

  normalizedPlayers.forEach((player) => {
    if (player.matches === 0) {
      throw new Error(`Jogador sem jogos nao pode ser salvo: ${player.playerName}.`);
    }

    if (player.wins + player.losses > player.matches) {
      throw new Error(
        `Estatisticas invalidas para ${player.playerName}: vitorias + derrotas excedem jogos.`,
      );
    }
  });

  const uniqueNames = new Set(normalizedPlayers.map((player) => player.playerName.toLowerCase()));
  if (uniqueNames.size !== normalizedPlayers.length) {
    throw new Error('Nao e permitido salvar jogadores duplicados no relatorio.');
  }

  return normalizedPlayers;
};

export const updateGroupMatchReportManual = async (
  groupId: string,
  players: ManualPlayerStatsInput[],
): Promise<GroupMatchReport> => {
  const normalizedGroupId = groupId.trim();
  if (!normalizedGroupId) {
    throw new Error('ID do grupo e obrigatorio para editar estatisticas.');
  }

  await assertUserIsGroupAdmin(normalizedGroupId);

  const normalizedPlayers = normalizeManualPlayerStats(players);
  if (normalizedPlayers.length === 0) {
    throw new Error('Adicione ao menos um jogador para salvar o relatorio manual.');
  }

  const totalGoals = normalizedPlayers.reduce((sum, player) => sum + player.goals, 0);
  const totalMatches = normalizedPlayers.reduce(
    (maxValue, player) => Math.max(maxValue, player.matches),
    0,
  );

  const report: GroupMatchReport = {
    groupId: normalizedGroupId,
    totalMatches,
    totalGoals,
    players: normalizedPlayers.sort((a, b) => {
      if (b.goals !== a.goals) {
        return b.goals - a.goals;
      }

      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      return a.playerName.localeCompare(b.playerName);
    }),
  };

  const reportRef = doc(db, 'groupMatchReports', normalizedGroupId);
  await setDoc(reportRef, {
    ...report,
    updatedAt: serverTimestamp(),
  });

  return report;
};

export const getSavedGroupMatchReport = async (groupId: string): Promise<GroupMatchReport> => {
  const normalizedGroupId = groupId.trim();
  if (!normalizedGroupId) {
    throw new Error('ID do grupo e obrigatorio para consultar relatorio salvo.');
  }

  const reportRef = doc(db, 'groupMatchReports', normalizedGroupId);
  const snapshot = await getDoc(reportRef);

  if (!snapshot.exists()) {
    throw new Error('Nao existe relatorio salvo para este grupo. Gere e salve primeiro.');
  }

  const data = snapshot.data();
  const players = ((data.players ?? []) as GroupPlayerMatchStats[]).map((player) => ({
    playerName: player.playerName ?? '',
    matches: Number(player.matches ?? 0),
    wins: Number(player.wins ?? 0),
    losses: Number(player.losses ?? 0),
    goals: Number(player.goals ?? 0),
  }));

  players.sort((a, b) => {
    if (b.goals !== a.goals) {
      return b.goals - a.goals;
    }

    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }

    return a.playerName.localeCompare(b.playerName);
  });

  return {
    groupId: data.groupId ?? normalizedGroupId,
    totalMatches: Number(data.totalMatches ?? 0),
    totalGoals: Number(data.totalGoals ?? 0),
    players,
  };
};

export const updateEventLineup = async (
  eventId: string,
  lineup: { teamA: string[]; teamB: string[] },
) => {
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

  return runTransaction(db, async (transaction) => {
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

export const registerEventGoal = async (
  eventId: string,
  input: { player: string; team: TeamId; minute?: number },
) => {
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

  return runTransaction(db, async (transaction) => {
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

    const currentGoals = ((data.goals ?? []) as GoalRecord[]).map((goal) => ({
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
