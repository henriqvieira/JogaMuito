import {
  addDoc,
  arrayUnion,
  collection,
  DocumentData,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { FIRESTORE_COLLECTIONS } from './firestoreSchema';

export type GameGroup = {
  id: string;
  groupId?: string | null;
  groupNumber?: number | null;
  name: string;
  description: string;
  isPublic: boolean;
  ownerId: string | null;
  ownerName?: string | null;
  displayId?: string | null;
  createdAt?: Timestamp | null;
  members?: string[];
  admins?: string[];
  paymentExemptions?: string[];
};

export type VisibleGroups = {
  memberGroups: GameGroup[];
  publicGroups: GameGroup[];
};

const groupsCollection = collection(db, FIRESTORE_COLLECTIONS.groups);
const invitesCollection = collection(db, FIRESTORE_COLLECTIONS.groupInvites);

const toTitleCase = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const getNameFromEmail = (email?: string | null) => {
  const localPart = email
    ?.split('@')[0]
    ?.replace(/[._-]+/g, ' ')
    .trim();
  return localPart ? toTitleCase(localPart) : null;
};

export const formatFriendlyGroupId = (groupId: string) => {
  const normalized = groupId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `GRP-${normalized.slice(0, 6)}`;
};

export const formatFriendlyGroupNumber = (groupNumber: number | null | undefined) => {
  if (typeof groupNumber !== 'number' || Number.isNaN(groupNumber)) {
    return 'GRP-000001';
  }

  return `GRP-${String(groupNumber).padStart(6, '0')}`;
};

export const getGroupDisplayId = (group: Pick<GameGroup, 'id' | 'displayId' | 'groupNumber'>) => {
  if (group.displayId?.trim()) {
    return group.displayId.trim();
  }

  return formatFriendlyGroupNumber(group.groupNumber);
};

const generateInviteCode = () =>
  Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

const parseInviteValue = (inviteText: string) => {
  const trimmed = inviteText.trim();
  try {
    const url = new URL(trimmed);
    const segments = url.pathname.replace(/\/$/, '').split('/').filter(Boolean);
    if (segments[0] === 'invite' && segments[1]) {
      return { type: 'invite' as const, value: segments[1] };
    }
    if (segments[0] === 'grupo' && segments[1]) {
      return { type: 'group' as const, value: segments[1] };
    }
  } catch {
    // Not a valid URL, fallback to raw code.
  }

  if (trimmed.includes('/invite/')) {
    const parts = trimmed.split('/invite/');
    if (parts[1]) {
      return { type: 'invite' as const, value: parts[1].replace(/\W/g, '') };
    }
  }

  if (trimmed.includes('/grupo/')) {
    const parts = trimmed.split('/grupo/');
    if (parts[1]) {
      return { type: 'group' as const, value: parts[1].replace(/\W/g, '') };
    }
  }

  return { type: 'invite' as const, value: trimmed };
};

export const getCurrentUserId = () => auth.currentUser?.uid ?? null;

export const getCurrentUserName = () => {
  const displayName = auth.currentUser?.displayName?.trim();
  if (displayName) {
    return displayName;
  }

  const emailName = getNameFromEmail(auth.currentUser?.email);
  if (emailName) {
    return emailName;
  }

  const userId = auth.currentUser?.uid;
  return userId ? `Usuario ${userId.slice(0, 6)}` : 'Criador nao informado';
};

export const getGroupOwnerDisplayName = (group: GameGroup) => {
  if (group.ownerName?.trim()) {
    return group.ownerName.trim();
  }

  if (group.ownerId && group.ownerId === getCurrentUserId()) {
    return getCurrentUserName();
  }

  return 'Criador nao informado';
};

export const isUserAdmin = (group: GameGroup) => {
  const userId = getCurrentUserId();
  return !!userId && (group.admins ?? []).includes(userId);
};

const assertAdmin = async (groupRef: ReturnType<typeof doc>) => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('Autenticação necessária.');
  }

  const groupSnapshot = await getDoc(groupRef);
  if (!groupSnapshot.exists()) {
    throw new Error('Grupo não encontrado.');
  }

  const data = groupSnapshot.data() as DocumentData;
  const admins = data.admins ?? [];
  if (!admins.includes(userId)) {
    throw new Error('Apenas administradores podem executar esta ação.');
  }

  return data;
};

export const validateGroupData = (group: {
  name: string;
  description: string;
  isPublic: boolean;
  ownerId: string | null;
}) => {
  if (!group.name || !group.name.trim()) {
    throw new Error('Nome do grupo é obrigatório.');
  }
};

const ensureUserProfile = async (userId: string | null) => {
  if (!userId) {
    throw new Error('Autenticação necessária para criar o grupo.');
  }

  const usersCollection = collection(db, FIRESTORE_COLLECTIONS.users);
  const userRef = doc(usersCollection, userId);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    await setDoc(
      userRef,
      {
        uid: userId,
        name: getCurrentUserName(),
        email: auth.currentUser?.email ?? null,
        role: 'member',
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  return userRef;
};

export const addGroup = async (group: {
  name: string;
  description: string;
  isPublic: boolean;
  ownerId: string | null;
}) => {
  validateGroupData(group);

  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    throw new Error('Autenticação necessária para criar o grupo.');
  }

  await ensureUserProfile(currentUserId);

  const groupNumber = await runTransaction(db, async (transaction) => {
    const counterRef = doc(db, FIRESTORE_COLLECTIONS.counters, 'groups');
    const counterSnapshot = await transaction.get(counterRef);
    const currentValue = Number(counterSnapshot.data()?.nextGroupNumber ?? 1);

    transaction.set(
      counterRef,
      {
        nextGroupNumber: currentValue + 1,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return currentValue;
  });

  const groupRef = doc(groupsCollection);
  const displayId = formatFriendlyGroupNumber(groupNumber);

  await setDoc(groupRef, {
    groupId: groupRef.id,
    groupNumber,
    name: group.name.trim(),
    description: group.description.trim(),
    createdBy: currentUserId,
    ownerId: currentUserId,
    ownerName: getCurrentUserName(),
    members: [currentUserId],
    admins: [currentUserId],
    isPublic: group.isPublic,
    displayId,
    paymentExemptions: [],
    createdAt: serverTimestamp(),
  });

  return { id: groupRef.id, groupId: groupRef.id, groupNumber, displayId };
};

export const createGroupInvite = async (groupId: string) => {
  const code = generateInviteCode();
  await addDoc(invitesCollection, {
    groupId,
    code,
    valid: true,
    createdAt: serverTimestamp(),
  });

  return `https://jogamuito.app/invite/${code}`;
};

const findInviteByCode = async (code: string) => {
  const inviteQuery = query(
    invitesCollection,
    where('code', '==', code),
    where('valid', '==', true),
  );
  const snapshot = await getDocs(inviteQuery);

  if (snapshot.empty) {
    return null;
  }

  const inviteDoc = snapshot.docs[0];
  const data = inviteDoc.data() as DocumentData;
  return {
    groupId: data.groupId as string,
    code: data.code as string,
  };
};

export const acceptInviteWithCode = async (inviteText: string) => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('Autenticação necessária para aceitar o convite.');
  }

  const parsed = parseInviteValue(inviteText);
  let groupId = parsed.value;
  const requiresInvite = parsed.type === 'invite';

  if (parsed.type === 'invite') {
    const invite = await findInviteByCode(parsed.value);
    if (!invite) {
      throw new Error('Convite inválido ou expirado.');
    }
    groupId = invite.groupId;
  }

  const groupRef = doc(db, FIRESTORE_COLLECTIONS.groups, groupId);
  const groupSnapshot = await getDoc(groupRef);
  if (!groupSnapshot.exists()) {
    throw new Error('Grupo não encontrado.');
  }

  const groupData = groupSnapshot.data() as DocumentData;
  const isPublic = groupData.isPublic ?? false;
  if (!isPublic && !requiresInvite) {
    throw new Error('Grupo privado requer convite válido.');
  }

  await updateDoc(groupRef, {
    members: arrayUnion(userId),
  });

  return groupData.name ?? 'Grupo';
};

export const createGroupEvent = async (
  groupId: string,
  event: { title: string; description: string; date?: string },
) => {
  const groupRef = doc(db, FIRESTORE_COLLECTIONS.groups, groupId);
  await assertAdmin(groupRef);

  const eventsCollection = collection(groupRef, FIRESTORE_COLLECTIONS.events);
  return addDoc(eventsCollection, {
    ...event,
    createdBy: getCurrentUserId(),
    createdAt: serverTimestamp(),
  });
};

export const updateGroupInfo = async (
  groupId: string,
  updates: { name?: string; description?: string; isPublic?: boolean },
) => {
  const groupRef = doc(db, FIRESTORE_COLLECTIONS.groups, groupId);
  await assertAdmin(groupRef);
  return updateDoc(groupRef, updates);
};

export const exemptPlayerPayment = async (groupId: string, playerId: string) => {
  const groupRef = doc(db, FIRESTORE_COLLECTIONS.groups, groupId);
  await assertAdmin(groupRef);
  return updateDoc(groupRef, {
    paymentExemptions: arrayUnion(playerId),
  });
};

const mapGroupDoc = (docSnapshot: { id: string; data: () => DocumentData }): GameGroup => {
  const data = docSnapshot.data() as DocumentData;

  return {
    id: data.groupId ?? docSnapshot.id,
    groupId: data.groupId ?? docSnapshot.id,
    groupNumber: data.groupNumber ?? null,
    name: data.name ?? '',
    description: data.description ?? '',
    isPublic: data.isPublic ?? false,
    ownerId: data.createdBy ?? data.ownerId ?? null,
    ownerName: data.ownerName ?? null,
    displayId: data.displayId ?? formatFriendlyGroupNumber(data.groupNumber ?? null),
    createdAt: data.createdAt ?? null,
    members: data.members ?? [],
    admins: data.admins ?? [],
    paymentExemptions: data.paymentExemptions ?? [],
  };
};

const sortGroups = (groups: GameGroup[]) => {
  return [...groups].sort((left, right) => {
    const leftTime = left.createdAt?.toMillis?.() ?? 0;
    const rightTime = right.createdAt?.toMillis?.() ?? 0;
    return rightTime - leftTime;
  });
};

export const loadVisibleGroups = async (): Promise<VisibleGroups> => {
  const currentUserId = getCurrentUserId();

  try {
    const [memberSnapshot, publicSnapshot] = await Promise.all([
      currentUserId
        ? getDocs(query(groupsCollection, where('members', 'array-contains', currentUserId)))
        : Promise.resolve(null),
      getDocs(query(groupsCollection, where('isPublic', '==', true))),
    ]);

    const memberGroups = memberSnapshot ? memberSnapshot.docs.map(mapGroupDoc) : [];
    const memberIds = new Set(memberGroups.map((group) => group.id));
    const publicGroups = publicSnapshot.docs
      .map(mapGroupDoc)
      .filter((group) => !memberIds.has(group.id));

    const mergedGroups = [...memberGroups, ...publicGroups].filter(
      (group, index, allGroups) =>
        allGroups.findIndex((candidate) => candidate.id === group.id) === index,
    );

    return {
      memberGroups: sortGroups(
        mergedGroups.filter(
          (group) =>
            group.ownerId === currentUserId || group.members?.includes(currentUserId ?? ''),
        ),
      ),
      publicGroups: sortGroups(
        mergedGroups.filter(
          (group) => group.isPublic && !group.members?.includes(currentUserId ?? ''),
        ),
      ),
    };
  } catch (error) {
    console.warn('Não foi possível carregar grupos do Firestore.', error);
    return {
      memberGroups: [],
      publicGroups: [],
    };
  }
};

export const subscribeToGroups = (
  callback: (groups: GameGroup[]) => void,
  errorCallback?: (error: Error) => void,
) => {
  let isActive = true;

  const loadGroups = async () => {
    try {
      const visibleGroups = await loadVisibleGroups();
      if (!isActive) {
        return;
      }

      callback([...visibleGroups.memberGroups, ...visibleGroups.publicGroups]);
    } catch (error) {
      if (errorCallback) {
        errorCallback(error as Error);
      }
    }
  };

  loadGroups();

  return () => {
    isActive = false;
  };
};

export { getCurrentUserId };
