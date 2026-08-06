export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  groups: 'groups',
  groupInvites: 'groupInvites',
  events: 'events',
  groupMatchReports: 'groupMatchReports',
  matchCosts: 'matchCosts',
  counters: 'counters',
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
