import {
  createGameEvent,
  getGroupMatchReport,
  registerEventGoal,
  updateGroupMatchReportManual,
  updateEventLineup,
  validateGameEvent,
} from './eventService';

jest.mock('firebase/firestore', () => {
  const state: Record<string, Record<string, any>> = {
    groups: {},
    gameEvents: {},
  };

  let idCounter = 1;

  class MockTimestamp {
    seconds: number;

    constructor(seconds: number) {
      this.seconds = seconds;
    }

    static now() {
      return new MockTimestamp(999);
    }
  }

  const toSnapshot = (collectionName: string, docId: string) => {
    const data = state[collectionName]?.[docId];
    return {
      id: docId,
      exists: () => Boolean(data),
      data: () => data,
    };
  };

  return {
    addDoc: jest.fn(async (collectionRef: any, data: any) => {
      const id = `event-${idCounter++}`;
      if (!state[collectionRef.name]) {
        state[collectionRef.name] = {};
      }
      state[collectionRef.name][id] = data;
      return { id };
    }),
    collection: jest.fn((_db: any, name: string) => ({ kind: 'collection', name })),
    doc: jest.fn((refOrDb: any, arg2: string, arg3?: string) => {
      if (refOrDb?.kind === 'collection') {
        return { kind: 'doc', collection: refOrDb.name, id: arg2 };
      }

      return { kind: 'doc', collection: arg2, id: arg3 };
    }),
    getDocs: jest.fn(async (queryRef: any) => {
      const collectionName = queryRef?.collection?.name ?? queryRef?.name;
      const records = state[collectionName] ?? {};
      let docs = Object.entries(records).map(([id, data]) => ({
        id,
        data: () => data,
      }));

      const whereFilters = (queryRef?.constraints ?? []).filter((constraint: any) => constraint.type === 'where');

      whereFilters.forEach((filter: any) => {
        docs = docs.filter((docSnapshot: any) => {
          const value = docSnapshot.data()?.[filter.field];
          return filter.op === '==' ? value === filter.value : true;
        });
      });

      return {
        docs,
        empty: docs.length === 0,
        size: docs.length,
      };
    }),
    getDoc: jest.fn(async (docRef: any) => toSnapshot(docRef.collection, docRef.id)),
    query: jest.fn((collectionRef: any, ...constraints: any[]) => ({
      kind: 'query',
      collection: collectionRef,
      constraints,
    })),
    where: jest.fn((field: string, op: string, value: any) => ({
      type: 'where',
      field,
      op,
      value,
    })),
    orderBy: jest.fn((field: string, direction: string) => ({
      type: 'orderBy',
      field,
      direction,
    })),
    limit: jest.fn((value: number) => ({
      type: 'limit',
      value,
    })),
    runTransaction: jest.fn(async (_db: any, callback: any) => {
      const transaction = {
        get: async (docRef: any) => toSnapshot(docRef.collection, docRef.id),
        update: (docRef: any, data: any) => {
          if (!state[docRef.collection]) {
            state[docRef.collection] = {};
          }
          const current = state[docRef.collection][docRef.id] ?? {};
          state[docRef.collection][docRef.id] = { ...current, ...data };
        },
      };

      return callback(transaction);
    }),
    setDoc: jest.fn(async (docRef: any, data: any) => {
      if (!state[docRef.collection]) {
        state[docRef.collection] = {};
      }

      state[docRef.collection][docRef.id] = data;
      return true;
    }),
    serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
    Timestamp: MockTimestamp,
    __resetFirestoreMockState: () => {
      state.groups = {};
      state.gameEvents = {};
      state.groupMatchReports = {};
      idCounter = 1;
    },
    __seedFirestoreMockState: (collectionName: string, data: Record<string, any>) => {
      state[collectionName] = { ...data };
    },
    __getFirestoreMockState: () => state,
  };
});

jest.mock('./firebase', () => ({
  auth: {
    currentUser: {
      uid: 'admin-user',
    },
  },
  db: {},
}));

describe('eventService', () => {
  const firestoreMock = jest.requireMock('firebase/firestore') as any;
  const firebaseMock = jest.requireMock('./firebase') as any;

  beforeEach(() => {
    firestoreMock.__resetFirestoreMockState();
    firestoreMock.__seedFirestoreMockState('groups', {
      groupAdmin: {
        admins: ['admin-user'],
      },
      groupNoAdmin: {
        admins: ['other-user'],
      },
    });

    firebaseMock.auth.currentUser = { uid: 'admin-user' };
    jest.clearAllMocks();
  });

  describe('validateGameEvent', () => {
    it('deve rejeitar evento sem data', () => {
      expect(() =>
        validateGameEvent({
          groupId: 'groupAdmin',
          date: '',
          time: '20:00',
          location: 'Quadra 1',
          participants: ['Ana', 'Bruno'],
          lineup: {
            teamA: ['Ana'],
            teamB: ['Bruno'],
          },
        }),
      ).toThrow('Data inválida. Use o formato AAAA-MM-DD.');
    });
  });

  describe('createGameEvent', () => {
    it('deve criar evento quando usuario eh admin e dados sao validos', async () => {
      const result = await createGameEvent({
        groupId: 'groupAdmin',
        date: '2026-08-02',
        time: '19:30',
        location: 'Arena Centro',
        participants: ['Ana', 'Bruno'],
        lineup: {
          teamA: ['Ana'],
          teamB: ['Bruno'],
        },
      });

      expect(result).toEqual({ id: 'event-1' });

      const state = firestoreMock.__getFirestoreMockState();
      expect(state.gameEvents['event-1']).toMatchObject({
        groupId: 'groupAdmin',
        date: '2026-08-02',
        goals: [],
        result: {
          teamA: 0,
          teamB: 0,
          winner: 'draw',
        },
      });
    });

    it('deve falhar quando usuario nao eh admin do grupo', async () => {
      await expect(
        createGameEvent({
          groupId: 'groupNoAdmin',
          date: '2026-08-02',
          time: '19:30',
          location: 'Arena Centro',
          participants: ['Ana', 'Bruno'],
          lineup: {
            teamA: ['Ana'],
            teamB: ['Bruno'],
          },
        }),
      ).rejects.toThrow('Permissão negada: apenas administradores do grupo podem salvar alterações.');
    });

    it('deve falhar ao criar evento sem data', async () => {
      await expect(
        createGameEvent({
          groupId: 'groupAdmin',
          date: '',
          time: '19:30',
          location: 'Arena Centro',
          participants: ['Ana', 'Bruno'],
          lineup: {
            teamA: ['Ana'],
            teamB: ['Bruno'],
          },
        }),
      ).rejects.toThrow('Data inválida. Use o formato AAAA-MM-DD.');
    });
  });

  describe('updateEventLineup', () => {
    it('deve atualizar a escalacao quando usuario eh admin', async () => {
      firestoreMock.__seedFirestoreMockState('gameEvents', {
        'event-77': {
          groupId: 'groupAdmin',
          participants: ['Ana', 'Bruno', 'Carlos', 'Davi'],
          lineup: {
            teamA: ['Ana', 'Bruno'],
            teamB: ['Carlos', 'Davi'],
          },
        },
      });

      const updatedLineup = await updateEventLineup('event-77', {
        teamA: ['Ana', 'Carlos'],
        teamB: ['Bruno', 'Davi'],
      });

      expect(updatedLineup).toEqual({
        teamA: ['Ana', 'Carlos'],
        teamB: ['Bruno', 'Davi'],
      });

      const state = firestoreMock.__getFirestoreMockState();
      expect(state.gameEvents['event-77'].lineup).toEqual({
        teamA: ['Ana', 'Carlos'],
        teamB: ['Bruno', 'Davi'],
      });
    });

    it('deve falhar ao salvar escalacao com jogador fora dos participantes', async () => {
      firestoreMock.__seedFirestoreMockState('gameEvents', {
        'event-88': {
          groupId: 'groupAdmin',
          participants: ['Ana', 'Bruno'],
          lineup: {
            teamA: ['Ana'],
            teamB: ['Bruno'],
          },
        },
      });

      await expect(
        updateEventLineup('event-88', {
          teamA: ['Ana'],
          teamB: ['Jogador Invalido'],
        }),
      ).rejects.toThrow('A escalação contém jogador que não está na lista de participantes.');
    });
  });

  describe('registerEventGoal', () => {
    it('deve registrar gol e atualizar resultado automaticamente', async () => {
      firestoreMock.__seedFirestoreMockState('gameEvents', {
        'event-99': {
          groupId: 'groupAdmin',
          participants: ['Ana', 'Bruno'],
          lineup: {
            teamA: ['Ana'],
            teamB: ['Bruno'],
          },
          goals: [],
          result: {
            teamA: 0,
            teamB: 0,
            winner: 'draw',
          },
        },
      });

      const updated = await registerEventGoal('event-99', {
        player: 'Ana',
        team: 'A',
        minute: 12,
      });

      expect(updated.result).toEqual({
        teamA: 1,
        teamB: 0,
        winner: 'A',
      });

      const state = firestoreMock.__getFirestoreMockState();
      expect(state.gameEvents['event-99'].goals).toHaveLength(1);
      expect(state.gameEvents['event-99'].result).toEqual({
        teamA: 1,
        teamB: 0,
        winner: 'A',
      });
    });

    it('deve falhar ao registrar gol para jogador fora da escalacao do time selecionado', async () => {
      firestoreMock.__seedFirestoreMockState('gameEvents', {
        'event-100': {
          groupId: 'groupAdmin',
          participants: ['Ana', 'Bruno'],
          lineup: {
            teamA: ['Ana'],
            teamB: ['Bruno'],
          },
          goals: [],
          result: {
            teamA: 0,
            teamB: 0,
            winner: 'draw',
          },
        },
      });

      await expect(
        registerEventGoal('event-100', {
          player: 'Ana',
          team: 'B',
        }),
      ).rejects.toThrow('Jogador não pertence ao time selecionado na escalação.');
    });
  });

  describe('getGroupMatchReport', () => {
    it('deve calcular estatisticas individuais e totais do grupo com sucesso', async () => {
      firestoreMock.__seedFirestoreMockState('gameEvents', {
        'event-201': {
          groupId: 'groupAdmin',
          lineup: {
            teamA: ['Ana', 'Carlos'],
            teamB: ['Bruno'],
          },
          result: {
            teamA: 1,
            teamB: 1,
            winner: 'A',
          },
          goals: [
            { player: 'Ana', team: 'A' },
            { player: 'Bruno', team: 'B' },
          ],
        },
        'event-202': {
          groupId: 'groupAdmin',
          lineup: {
            teamA: ['Ana'],
            teamB: ['Bruno'],
          },
          result: {
            teamA: 0,
            teamB: 2,
            winner: 'B',
          },
          goals: [
            { player: 'Bruno', team: 'B' },
            { player: 'Bruno', team: 'B' },
          ],
        },
        'event-203': {
          groupId: 'other-group',
          lineup: {
            teamA: ['VisitanteA'],
            teamB: ['VisitanteB'],
          },
          result: {
            teamA: 0,
            teamB: 0,
            winner: 'draw',
          },
          goals: [],
        },
      });

      const report = await getGroupMatchReport('groupAdmin');

      expect(report.groupId).toBe('groupAdmin');
      expect(report.totalMatches).toBe(2);
      expect(report.totalGoals).toBe(4);
      expect(report.players).toEqual([
        {
          playerName: 'Bruno',
          matches: 2,
          wins: 1,
          losses: 1,
          goals: 3,
        },
        {
          playerName: 'Ana',
          matches: 2,
          wins: 1,
          losses: 1,
          goals: 1,
        },
        {
          playerName: 'Carlos',
          matches: 1,
          wins: 1,
          losses: 0,
          goals: 0,
        },
      ]);
    });

    it('deve falhar quando groupId for vazio', async () => {
      await expect(getGroupMatchReport('   ')).rejects.toThrow(
        'ID do grupo e obrigatorio para consultar relatorio de partidas.',
      );
    });
  });

  describe('updateGroupMatchReportManual', () => {
    it('deve salvar estatisticas manuais quando usuario eh admin', async () => {
      const updated = await updateGroupMatchReportManual('groupAdmin', [
        {
          playerName: 'Ana',
          matches: 3,
          wins: 2,
          losses: 1,
          goals: 4,
        },
        {
          playerName: 'Bruno',
          matches: 3,
          wins: 1,
          losses: 2,
          goals: 2,
        },
      ]);

      expect(updated.totalMatches).toBe(3);
      expect(updated.totalGoals).toBe(6);
      expect(updated.players[0].playerName).toBe('Ana');

      const state = firestoreMock.__getFirestoreMockState();
      expect(state.groupMatchReports.groupAdmin).toMatchObject({
        groupId: 'groupAdmin',
        totalMatches: 3,
        totalGoals: 6,
      });
    });

    it('deve falhar quando houver jogador sem jogos', async () => {
      await expect(
        updateGroupMatchReportManual('groupAdmin', [
          {
            playerName: 'Jogador Sem Jogos',
            matches: 0,
            wins: 0,
            losses: 0,
            goals: 0,
          },
        ]),
      ).rejects.toThrow('Jogador sem jogos nao pode ser salvo: Jogador Sem Jogos.');
    });

    it('deve falhar quando usuario nao eh admin', async () => {
      await expect(
        updateGroupMatchReportManual('groupNoAdmin', [
          {
            playerName: 'Ana',
            matches: 1,
            wins: 1,
            losses: 0,
            goals: 1,
          },
        ]),
      ).rejects.toThrow('Permissão negada: apenas administradores do grupo podem salvar alterações.');
    });
  });
});
