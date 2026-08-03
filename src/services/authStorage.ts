import AsyncStorage from '@react-native-async-storage/async-storage';

export type PersistedAuthSession = {
  uid: string;
  email?: string | null;
};

const AUTH_SESSION_KEY = '@jogamuito:auth';

export const saveAuthSession = async (session: PersistedAuthSession) => {
  try {
    await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn('Não foi possível salvar a sessão persistida.', error);
  }
};

export const getAuthSession = async (): Promise<PersistedAuthSession | null> => {
  try {
    const rawSession = await AsyncStorage.getItem(AUTH_SESSION_KEY);

    if (!rawSession) {
      return null;
    }

    return JSON.parse(rawSession) as PersistedAuthSession;
  } catch (error) {
    console.warn('Não foi possível recuperar a sessão persistida.', error);
    return null;
  }
};

export const clearAuthSession = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_SESSION_KEY);
  } catch (error) {
    console.warn('Não foi possível limpar a sessão persistida.', error);
  }
};
