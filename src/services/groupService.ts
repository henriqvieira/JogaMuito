import {
  addDoc,
  arrayUnion,
  collection,
  DocumentData,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export type GameGroup = {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  ownerId: string | null;
  createdAt?: Timestamp | null;
  members?: string[];
  admins?: string[];
  paymentExemptions?: string[];
};

const groupsCollection = collection(db, 'groups');
const invitesCollection = collection(db, 'groupInvites');

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

const getCurrentUserId = () => auth.currentUser?.uid ?? null;

export const isUserAdmin = (group: GameGroup) => {
  const userId = getCurrentUserId();
  return !!userId && (group.admins ?? []).includes(userId);
};

const assertAdmin = async (groupRef: any) => {
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

export const addGroup = async (group: {
  name: string;
  description: string;
  isPublic: boolean;
  ownerId: string | null;
}) => {
  validateGroupData(group);
  return addDoc(groupsCollection, {
    ...group,
    members: group.ownerId ? [group.ownerId] : [],
    admins: group.ownerId ? [group.ownerId] : [],
    paymentExemptions: [],
    createdAt: serverTimestamp(),
  });
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

  const groupRef = doc(db, 'groups', groupId);
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
  const groupRef = doc(db, 'groups', groupId);
  await assertAdmin(groupRef);

  const eventsCollection = collection(groupRef, 'events');
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
  const groupRef = doc(db, 'groups', groupId);
  await assertAdmin(groupRef);
  return updateDoc(groupRef, updates);
};

export const exemptPlayerPayment = async (groupId: string, playerId: string) => {
  const groupRef = doc(db, 'groups', groupId);
  await assertAdmin(groupRef);
  return updateDoc(groupRef, {
    paymentExemptions: arrayUnion(playerId),
  });
};

export const subscribeToGroups = (
  callback: (groups: GameGroup[]) => void,
  errorCallback?: (error: Error) => void,
) => {
  let isActive = true;

  const loadGroups = async () => {
    try {
      const snapshot = await getDocs(query(groupsCollection));
      if (!isActive) {
        return;
      }

      const groups = snapshot.docs
        .map((docSnapshot) => {
          const data = docSnapshot.data() as DocumentData;
          return {
            id: docSnapshot.id,
            name: data.name ?? '',
            description: data.description ?? '',
            isPublic: data.isPublic ?? false,
            ownerId: data.ownerId ?? null,
            createdAt: data.createdAt ?? null,
            members: data.members ?? [],
            admins: data.admins ?? [],
            paymentExemptions: data.paymentExemptions ?? [],
          } as GameGroup;
        })
        .sort((left, right) => {
          const leftTime = left.createdAt?.toMillis?.() ?? 0;
          const rightTime = right.createdAt?.toMillis?.() ?? 0;
          return rightTime - leftTime;
        });

      callback(groups);
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
