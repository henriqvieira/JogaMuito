export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  groups: 'groups',
  groupInvites: 'groupInvites',
  gameEvents: 'gameEvents',
  groupMatchReports: 'groupMatchReports',
  matchCosts: 'matchCosts',
  counters: 'counters',
} as const;

export const FIRESTORE_SUBCOLLECTIONS = {
  events: 'events',
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];

export const buildFirestoreCollectionPath = (
  collectionName: FirestoreCollectionName,
  parentId?: string,
  subcollection?: string,
) => {
  if (!parentId) {
    return collectionName;
  }

  if (!subcollection) {
    return `${collectionName}/${parentId}`;
  }

  return `${collectionName}/${parentId}/${subcollection}`;
};
