import { addGroup, createGroupInvite, validateGroupData } from './groupService';

jest.mock('firebase/firestore', () => {
  const original = jest.requireActual('firebase/firestore');
  return {
    ...original,
    addDoc: jest.fn(() => Promise.resolve({ id: 'group123' })),
    collection: jest.fn(),
    serverTimestamp: jest.fn(() => ({ _seconds: 0, _nanoseconds: 0 })),
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
      ).resolves.toEqual({ id: 'group123' });
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
  });

  describe('createGroupInvite', () => {
    it('deve gerar um link de convite com código único', async () => {
      const inviteLink = await createGroupInvite('group123');

      expect(inviteLink).toMatch(/https:\/\/jogamuito\.app\/invite\/[A-Za-z0-9]{16}/);
    });
  });
});
