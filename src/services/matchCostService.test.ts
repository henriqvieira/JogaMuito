import { calculateMatchCostSummary } from './matchCostService';

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn((_db: any, name: string) => ({ name })),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
  where: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 0, nanoseconds: 0 })),
  },
}));

jest.mock('./firebase', () => ({
  auth: {
    currentUser: {
      uid: 'admin-user',
    },
  },
  db: {},
}));

describe('calculateMatchCostSummary', () => {
  it('deve dividir igualmente entre jogadores nao isentos', () => {
    const summary = calculateMatchCostSummary(120, [
      { name: 'Ana' },
      { name: 'Bruno' },
      { name: 'Carlos' },
    ]);

    expect(summary.amountPerPlayer).toBe(40);
    expect(summary.chargeablePlayers).toBe(3);
    expect(summary.exemptPlayers).toBe(0);
    expect(summary.breakdown).toEqual([
      { name: 'Ana', isExempt: false, amount: 40 },
      { name: 'Bruno', isExempt: false, amount: 40 },
      { name: 'Carlos', isExempt: false, amount: 40 },
    ]);
  });

  it('deve aplicar isencao e cobrar apenas dos pagantes', () => {
    const summary = calculateMatchCostSummary(90, [
      { name: 'Ana', isExempt: true },
      { name: 'Bruno' },
      { name: 'Carlos' },
    ]);

    expect(summary.amountPerPlayer).toBe(45);
    expect(summary.chargeablePlayers).toBe(2);
    expect(summary.exemptPlayers).toBe(1);
    expect(summary.breakdown).toEqual([
      { name: 'Ana', isExempt: true, amount: 0 },
      { name: 'Bruno', isExempt: false, amount: 45 },
      { name: 'Carlos', isExempt: false, amount: 45 },
    ]);
  });

  it('deve arredondar para duas casas decimais no valor por pagante', () => {
    const summary = calculateMatchCostSummary(100, [
      { name: 'Ana' },
      { name: 'Bruno' },
      { name: 'Carlos' },
    ]);

    expect(summary.amountPerPlayer).toBe(33.33);
    expect(summary.breakdown).toEqual([
      { name: 'Ana', isExempt: false, amount: 33.33 },
      { name: 'Bruno', isExempt: false, amount: 33.33 },
      { name: 'Carlos', isExempt: false, amount: 33.33 },
    ]);
  });

  it('deve falhar quando valor total nao for informado', () => {
    expect(() =>
      calculateMatchCostSummary(Number.NaN, [
        { name: 'Ana' },
        { name: 'Bruno' },
      ]),
    ).toThrow('Informe um valor total valido para a partida.');
  });

  it('deve falhar quando valor total for zero ou negativo', () => {
    expect(() =>
      calculateMatchCostSummary(0, [
        { name: 'Ana' },
        { name: 'Bruno' },
      ]),
    ).toThrow('Informe um valor total valido para a partida.');

    expect(() =>
      calculateMatchCostSummary(-50, [
        { name: 'Ana' },
        { name: 'Bruno' },
      ]),
    ).toThrow('Informe um valor total valido para a partida.');
  });

  it('deve falhar quando nao houver jogadores', () => {
    expect(() => calculateMatchCostSummary(100, [])).toThrow(
      'Adicione ao menos um jogador para calcular os custos.',
    );
  });

  it('deve falhar quando todos os jogadores estiverem isentos', () => {
    expect(() =>
      calculateMatchCostSummary(100, [
        { name: 'Ana', isExempt: true },
        { name: 'Bruno', isExempt: true },
      ]),
    ).toThrow('Pelo menos um jogador deve participar da divisao de custos.');
  });

  it('deve falhar quando houver jogadores duplicados', () => {
    expect(() =>
      calculateMatchCostSummary(100, [
        { name: 'Ana' },
        { name: 'ana' },
      ]),
    ).toThrow('Existem jogadores duplicados na lista.');
  });
});