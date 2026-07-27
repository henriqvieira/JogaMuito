import { mapFirebaseError, validateLoginForm, validateRegisterForm } from './authValidation';

describe('validateLoginForm', () => {
  it('deve aceitar um login válido', () => {
    const result = validateLoginForm('usuario@email.com', '123456');

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('deve rejeitar login sem email', () => {
    const result = validateLoginForm('', '123456');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email é obrigatório.');
  });

  it('deve rejeitar senha vazia', () => {
    const result = validateLoginForm('usuario@email.com', '');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Senha é obrigatória.');
  });

  it('deve rejeitar email inválido', () => {
    const result = validateLoginForm('usuario', '123456');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email inválido.');
  });
});

describe('validateRegisterForm', () => {
  it('deve aceitar um cadastro válido', () => {
    const result = validateRegisterForm('Maria', 'maria@email.com', '123456', '123456');

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('deve rejeitar nome curto', () => {
    const result = validateRegisterForm('Ma', 'maria@email.com', '123456', '123456');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Nome deve ter pelo menos 3 caracteres.');
  });

  it('deve rejeitar senha curta', () => {
    const result = validateRegisterForm('Maria', 'maria@email.com', '123', '123');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Senha deve ter pelo menos 6 caracteres.');
  });

  it('deve rejeitar senhas diferentes', () => {
    const result = validateRegisterForm('Maria', 'maria@email.com', '123456', '654321');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('As senhas não coincidem.');
  });
});

describe('mapFirebaseError', () => {
  it('deve mapear erro de senha incorreta', () => {
    const message = mapFirebaseError({ code: 'auth/wrong-password' });

    expect(message).toBe('Email ou senha incorretos.');
  });

  it('deve mapear erro de email já cadastrado', () => {
    const message = mapFirebaseError({ code: 'auth/email-already-in-use' });

    expect(message).toBe('Este email já está em uso.');
  });

  it('deve retornar erro genérico para falha inesperada', () => {
    const message = mapFirebaseError({ code: 'auth/unknown' });

    expect(message).toBe('Erro inesperado durante a autenticação.');
  });
});
