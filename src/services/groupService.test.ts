/// <reference types="jest" />

import * as firestore from 'firebase/firestore';
import { addGroup, createGroupInvite, validateGroupData } from './groupService';

jest.mock('firebase/firestore', () => {
  return {
    addDoc: jest.fn(() => Promise.resolve({ id: 'group123' })),
    arrayUnion: jest.fn((value: string) => value),
    collection: jest.fn(() => ({})),
    doc: jest.fn(() => ({ id: 'group123' })),
    getDoc: jest.fn(() => Promise.resolve({ exists: () => true, data: () => ({}) })),
    getDocs: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
    query: jest.fn(),
    runTransaction: jest.fn(),
    serverTimestamp: jest.fn(() => ({ _seconds: 0, _nanoseconds: 0 })),
    setDoc: jest.fn(() => Promise.resolve()),
    updateDoc: jest.fn(() => Promise.resolve()),
    where: jest.fn(),
  };
});

jest.mock('./firebase', () => ({
  auth: {
    currentUser: {
      uid: 'user123',
    },
  },
  db: {},
}));

describe('groupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (firestore.runTransaction as jest.Mock).mockImplementation(async (_db, callback) => {
      const transaction = {
        get: jest.fn(() => Promise.resolve({ data: () => ({ nextGroupNumber: 1 }) })),
        set: jest.fn(),
      };
      return callback(transaction);
    });
  });

  describe('validateGroupData', () => {
    it('deve aceitar dados válidos', () => {
      expect(() =>
        validateGroupData({
          name: 'Time de Futebol',
          description: 'Grupo para jogos semanais',
          isPublic: true,
          ownerId: 'user123',
        }),
      ).not.toThrow();
    });

    it('deve lançar erro quando nome estiver vazio', () => {
      expect(() =>
        validateGroupData({
          name: '   ',
          description: 'Grupo sem nome',
          isPublic: false,
          ownerId: 'user123',
        }),
      ).toThrow('Nome do grupo é obrigatório.');
    });
  });

  describe('addGroup', () => {
    it('deve criar um grupo quando os dados estiverem corretos', async () => {
      await expect(
        addGroup({
          name: 'Time de Vôlei',
          description: 'Jogos aos finais de semana',
          isPublic: false,
          ownerId: 'user123',
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          id: 'group123',
          groupNumber: 1,
          displayId: 'GRP-000001',
        }),
      );
    });

    it('deve rejeitar criação de grupo sem nome', async () => {
      await expect(
        addGroup({
          name: '',
          description: 'Sem nome',
          isPublic: true,
          ownerId: 'user123',
        }),
      ).rejects.toThrow('Nome do grupo é obrigatório.');
    });

    it('deve persistir os dados do grupo no Firestore', async () => {
      await addGroup({
        name: 'Time de Basquete',
        description: 'Grupo para jogos no final de semana',
        isPublic: true,
        ownerId: 'user123',
      });

      expect(firestore.setDoc).toHaveBeenCalled();
      expect(firestore.runTransaction).toHaveBeenCalled();
      expect(firestore.getDoc).toHaveBeenCalled();
    });

    it('deve rejeitar a criação se o Firestore falhar na transação', async () => {
      (firestore.runTransaction as jest.Mock).mockRejectedValueOnce(
        new Error('firestore unavailable'),
      );

      await expect(
        addGroup({
          name: 'Time de Handebol',
          description: 'Grupo para jogos em dupla',
          isPublic: false,
          ownerId: 'user123',
        }),
      ).rejects.toThrow('firestore unavailable');
    });
  });

  describe('createGroupInvite', () => {
    it('deve gerar um link de convite com código único', async () => {
      const inviteLink = await createGroupInvite('group123');

      expect(inviteLink).toMatch(/https:\/\/jogamuito\.app\/invite\/[A-Za-z0-9]{16}/);
    });
  });
});
