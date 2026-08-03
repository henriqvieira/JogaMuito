import {
  addDoc,
  collection,
  doc,
  getDocs,
  getDoc,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export type MatchCostPlayerInput = {
  name: string;
  isExempt?: boolean;
};

export type CreateMatchCostInput = {
  groupId: string;
  eventId?: string;
  totalAmount: number;
  players: MatchCostPlayerInput[];
};

export type MatchCostPlayerBreakdown = {
  name: string;
  isExempt: boolean;
  amount: number;
  paidAmount?: number;
};

export type UpdateMatchCostInput = {
  matchCostId: string;
  totalAmount: number;
  players: MatchCostPlayerInput[];
};

export type ConfirmMatchCostPaymentInput = {
  matchCostId: string;
  playerName: string;
  paidAmount?: number;
};

export type MatchCostSummary = {
  amountPerPlayer: number;
  chargeablePlayers: number;
  exemptPlayers: number;
  breakdown: MatchCostPlayerBreakdown[];
};

export type SavedMatchCost = {
  id: string;
  groupId: string;
  eventId: string | null;
  totalAmount: number;
  amountPerPlayer: number;
  chargeablePlayers: number;
  exemptPlayers: number;
  breakdown: MatchCostPlayerBreakdown[];
  createdBy: string;
  createdAt?: Timestamp | null;
};

export type GroupFinancialHistoryPlayer = {
  playerName: string;
  paid: number;
  owed: number;
  total: number;
  matches: number;
};

export type GroupFinancialHistory = {
  groupId: string;
  totalPaid: number;
  totalOwed: number;
  grandTotal: number;
  players: GroupFinancialHistoryPlayer[];
};

const matchCostsCollection = collection(db, 'matchCosts');
const groupsCollection = collection(db, 'groups');

const roundToCents = (value: number) => Math.round(value * 100) / 100;

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const assertUserIsGroupAdmin = async (groupId: string) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('Autenticacao necessaria para executar esta acao.');
  }

  const groupRef = doc(groupsCollection, groupId);
  const groupSnapshot = await getDoc(groupRef);
  if (!groupSnapshot.exists()) {
    throw new Error('Grupo nao encontrado para validar permissao.');
  }

  const admins = (groupSnapshot.data().admins ?? []) as string[];
  if (!admins.includes(userId)) {
    throw new Error('Permissao negada: apenas administradores podem alterar custos e pagamentos.');
  }

  return userId;
};

export const validateMatchCostAdminPermission = async (groupId: string) => {
  await assertUserIsGroupAdmin(groupId.trim());
  return true;
};

export const calculateMatchCostSummary = (
  totalAmount: number,
  players: MatchCostPlayerInput[],
): MatchCostSummary => {
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error('Informe um valor total valido para a partida.');
  }

  const normalizedPlayers = players
    .map((player) => ({
      name: player.name.trim(),
      isExempt: Boolean(player.isExempt),
    }))
    .filter((player) => player.name.length > 0);

  if (normalizedPlayers.length === 0) {
    throw new Error('Adicione ao menos um jogador para calcular os custos.');
  }

  const uniqueNames = new Set(normalizedPlayers.map((player) => player.name.toLowerCase()));
  if (uniqueNames.size !== normalizedPlayers.length) {
    throw new Error('Existem jogadores duplicados na lista.');
  }

  const chargeablePlayers = normalizedPlayers.filter((player) => !player.isExempt).length;
  if (chargeablePlayers === 0) {
    throw new Error('Pelo menos um jogador deve participar da divisao de custos.');
  }

  const amountPerPlayer = roundToCents(totalAmount / chargeablePlayers);

  const breakdown = normalizedPlayers.map((player) => ({
    name: player.name,
    isExempt: player.isExempt,
    amount: player.isExempt ? 0 : amountPerPlayer,
  }));

  return {
    amountPerPlayer,
    chargeablePlayers,
    exemptPlayers: normalizedPlayers.length - chargeablePlayers,
    breakdown,
  };
};

export const saveMatchCost = async (input: CreateMatchCostInput) => {
  const groupId = input.groupId.trim();
  if (!groupId) {
    throw new Error('ID do grupo e obrigatorio.');
  }

  // Permission is validated before persisting any financial write.
  const userId = await assertUserIsGroupAdmin(groupId);

  const summary = calculateMatchCostSummary(input.totalAmount, input.players);

  const docRef = await addDoc(matchCostsCollection, {
    groupId,
    eventId: input.eventId?.trim() ? input.eventId.trim() : null,
    totalAmount: roundToCents(input.totalAmount),
    amountPerPlayer: summary.amountPerPlayer,
    chargeablePlayers: summary.chargeablePlayers,
    exemptPlayers: summary.exemptPlayers,
    breakdown: summary.breakdown,
    createdBy: userId,
    createdAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    groupId,
    eventId: input.eventId?.trim() ? input.eventId.trim() : null,
    totalAmount: roundToCents(input.totalAmount),
    amountPerPlayer: summary.amountPerPlayer,
    chargeablePlayers: summary.chargeablePlayers,
    exemptPlayers: summary.exemptPlayers,
    breakdown: summary.breakdown,
    createdBy: userId,
    createdAt: null,
  } as SavedMatchCost;
};

export const updateMatchCost = async (input: UpdateMatchCostInput) => {
  const normalizedMatchCostId = input.matchCostId.trim();
  if (!normalizedMatchCostId) {
    throw new Error('ID do custo da partida e obrigatorio.');
  }

  const matchCostRef = doc(db, 'matchCosts', normalizedMatchCostId);
  const currentSnapshot = await getDoc(matchCostRef);

  if (!currentSnapshot.exists()) {
    throw new Error('Registro de custo nao encontrado.');
  }

  const currentData = currentSnapshot.data();
  const groupId = (currentData.groupId ?? '').toString().trim();
  if (!groupId) {
    throw new Error('Registro sem grupo vinculado.');
  }

  await assertUserIsGroupAdmin(groupId);

  const summary = calculateMatchCostSummary(input.totalAmount, input.players);

  return runTransaction(db, async (transaction) => {
    const freshSnapshot = await transaction.get(matchCostRef);
    if (!freshSnapshot.exists()) {
      throw new Error('Registro de custo nao encontrado.');
    }

    transaction.update(matchCostRef, {
      totalAmount: roundToCents(input.totalAmount),
      amountPerPlayer: summary.amountPerPlayer,
      chargeablePlayers: summary.chargeablePlayers,
      exemptPlayers: summary.exemptPlayers,
      breakdown: summary.breakdown,
      updatedAt: serverTimestamp(),
    });

    return true;
  });
};

export const confirmMatchCostPayment = async (input: ConfirmMatchCostPaymentInput) => {
  const normalizedMatchCostId = input.matchCostId.trim();
  const normalizedPlayerName = input.playerName.trim();

  if (!normalizedMatchCostId) {
    throw new Error('ID do custo da partida e obrigatorio.');
  }

  if (!normalizedPlayerName) {
    throw new Error('Nome do jogador e obrigatorio para confirmar pagamento.');
  }

  const matchCostRef = doc(db, 'matchCosts', normalizedMatchCostId);
  const currentSnapshot = await getDoc(matchCostRef);

  if (!currentSnapshot.exists()) {
    throw new Error('Registro de custo nao encontrado.');
  }

  const currentData = currentSnapshot.data();
  const groupId = (currentData.groupId ?? '').toString().trim();
  if (!groupId) {
    throw new Error('Registro sem grupo vinculado.');
  }

  await assertUserIsGroupAdmin(groupId);

  return runTransaction(db, async (transaction) => {
    const freshSnapshot = await transaction.get(matchCostRef);
    if (!freshSnapshot.exists()) {
      throw new Error('Registro de custo nao encontrado.');
    }

    const data = freshSnapshot.data();
    const breakdown = ((data.breakdown ?? []) as MatchCostPlayerBreakdown[]).map((item) => ({
      ...item,
    }));
    const index = breakdown.findIndex((item) => item.name === normalizedPlayerName);

    if (index < 0) {
      throw new Error('Jogador nao encontrado no registro financeiro.');
    }

    const target = breakdown[index];
    const maxAmount = roundToCents(toNumber(target.amount));
    const nextPaidAmount =
      input.paidAmount === undefined
        ? maxAmount
        : roundToCents(Math.min(Math.max(toNumber(input.paidAmount), 0), maxAmount));

    breakdown[index] = {
      ...target,
      paidAmount: nextPaidAmount,
    };

    transaction.update(matchCostRef, {
      breakdown,
      updatedAt: serverTimestamp(),
    });

    return true;
  });
};

export const getMatchCostsByGroup = async (groupId: string) => {
  const normalizedGroupId = groupId.trim();
  if (!normalizedGroupId) {
    throw new Error('ID do grupo e obrigatorio para consultar historico financeiro.');
  }

  const costsQuery = query(
    matchCostsCollection,
    where('groupId', '==', normalizedGroupId),
    orderBy('createdAt', 'desc'),
  );

  const snapshot = await getDocs(costsQuery);

  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      groupId: data.groupId ?? '',
      eventId: data.eventId ?? null,
      totalAmount: toNumber(data.totalAmount),
      amountPerPlayer: toNumber(data.amountPerPlayer),
      chargeablePlayers: toNumber(data.chargeablePlayers),
      exemptPlayers: toNumber(data.exemptPlayers),
      breakdown: (data.breakdown ?? []) as MatchCostPlayerBreakdown[],
      createdBy: data.createdBy ?? '',
      createdAt: (data.createdAt as Timestamp | undefined) ?? null,
    } as SavedMatchCost;
  });
};

export const getGroupFinancialHistory = async (groupId: string) => {
  const records = await getMatchCostsByGroup(groupId);

  const playerMap: Record<string, GroupFinancialHistoryPlayer> = {};
  let totalPaid = 0;
  let totalOwed = 0;

  records.forEach((record) => {
    (record.breakdown ?? []).forEach((item) => {
      const key = item.name.trim();
      if (!key) {
        return;
      }

      if (!playerMap[key]) {
        playerMap[key] = {
          playerName: key,
          paid: 0,
          owed: 0,
          total: 0,
          matches: 0,
        };
      }

      const amount = roundToCents(toNumber(item.amount));
      const paidAmount = roundToCents(Math.min(Math.max(toNumber(item.paidAmount), 0), amount));
      const owedAmount = roundToCents(amount - paidAmount);

      playerMap[key].paid = roundToCents(playerMap[key].paid + paidAmount);
      playerMap[key].owed = roundToCents(playerMap[key].owed + owedAmount);
      playerMap[key].total = roundToCents(playerMap[key].paid + playerMap[key].owed);
      playerMap[key].matches += 1;

      totalPaid = roundToCents(totalPaid + paidAmount);
      totalOwed = roundToCents(totalOwed + owedAmount);
    });
  });

  const players = Object.values(playerMap).sort((a, b) => b.total - a.total);

  return {
    groupId: groupId.trim(),
    totalPaid,
    totalOwed,
    grandTotal: roundToCents(totalPaid + totalOwed),
    players,
  } as GroupFinancialHistory;
};
