import { FIRESTORE_COLLECTIONS, buildFirestoreCollectionPath } from './firestoreSchema';

describe('firestoreSchema', () => {
  it('exposes the production collections used by the app', () => {
    expect(FIRESTORE_COLLECTIONS.users).toBe('users');
    expect(FIRESTORE_COLLECTIONS.groups).toBe('groups');
    expect(FIRESTORE_COLLECTIONS.groupInvites).toBe('groupInvites');
    expect(FIRESTORE_COLLECTIONS.gameEvents).toBe('gameEvents');
    expect(FIRESTORE_COLLECTIONS.groupMatchReports).toBe('groupMatchReports');
    expect(FIRESTORE_COLLECTIONS.matchCosts).toBe('matchCosts');
    expect(FIRESTORE_COLLECTIONS.counters).toBe('counters');
  });

  it('builds nested collection paths for group subcollections', () => {
    expect(buildFirestoreCollectionPath(FIRESTORE_COLLECTIONS.groups, 'group-123', 'events')).toBe(
      'groups/group-123/events',
    );
  });
});
