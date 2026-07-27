export type ValidationResult = {
  isValid: boolean;
  error?: string;
};

export const validateLoginForm = (email: string, password: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, error: 'Email é obrigatório.' };
  }

  if (!/\S+@\S+\.\S+/.test(email.trim())) {
    return { isValid: false, error: 'Email inválido.' };
  }

  if (!password) {
    return { isValid: false, error: 'Senha é obrigatória.' };
  }

  return { isValid: true };
};

export const validateRegisterForm = (
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
): ValidationResult => {
  if (!name.trim() || name.trim().length < 3) {
    return { isValid: false, error: 'Nome deve ter pelo menos 3 caracteres.' };
  }

  if (!email.trim()) {
    return { isValid: false, error: 'Email é obrigatório.' };
  }

  if (!/\S+@\S+\.\S+/.test(email.trim())) {
    return { isValid: false, error: 'Email inválido.' };
  }

  if (!password || password.length < 6) {
    return { isValid: false, error: 'Senha deve ter pelo menos 6 caracteres.' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'As senhas não coincidem.' };
  }

  return { isValid: true };
};

export const mapFirebaseError = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: string }).code;

    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Email ou senha incorretos.';
      case 'auth/email-already-in-use':
        return 'Este email já está em uso.';
      default:
        return 'Erro inesperado durante a autenticação.';
    }
  }

  return 'Erro inesperado durante a autenticação.';
};
