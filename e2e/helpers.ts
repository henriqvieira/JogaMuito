export const E2E_EMAIL = process.env.E2E_EMAIL ?? 'usuario@email.com';
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? '123456';

export const uniqueSuffix = () => Date.now().toString().slice(-6);

export const dismissOkAlertIfVisible = async () => {
  try {
    await waitFor(element(by.text('OK')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.text('OK')).tap();
    return true;
  } catch {
    return false;
  }
};

export const login = async (email = E2E_EMAIL, password = E2E_PASSWORD) => {
  await expect(element(by.id('emailInput'))).toBeVisible();
  await element(by.id('emailInput')).replaceText(email);
  await element(by.id('passwordInput')).replaceText(password);
  await element(by.id('loginButton')).tap();

  await expect(element(by.id('homeTitle'))).toBeVisible();
};

export const registerNewUser = async () => {
  const suffix = uniqueSuffix();
  const email = `e2e_${suffix}@jogamuito.dev`;
  const password = `Senha${suffix}`;
  const name = `E2E ${suffix}`;

  await expect(element(by.id('emailInput'))).toBeVisible();
  await element(by.text('Ainda não tem conta? Cadastre-se')).tap();

  await expect(element(by.id('registerNameInput'))).toBeVisible();
  await element(by.id('registerNameInput')).replaceText(name);
  await element(by.id('registerEmailInput')).replaceText(email);
  await element(by.id('registerPasswordInput')).replaceText(password);
  await element(by.id('registerConfirmPasswordInput')).replaceText(password);
  await element(by.id('registerButton')).tap();

  await expect(element(by.id('homeTitle'))).toBeVisible();

  return { email, password, name };
};

export const createGroupFromHome = async (groupName?: string) => {
  const suffix = uniqueSuffix();
  const resolvedGroupName = groupName ?? `Grupo E2E ${suffix}`;

  await element(by.id('createGroupHomeButton')).tap();
  await expect(element(by.id('groupNameInput'))).toBeVisible();

  await element(by.id('groupNameInput')).replaceText(resolvedGroupName);
  await element(by.id('groupDescriptionInput')).replaceText(`Descricao ${suffix}`);
  await element(by.id('createGroupButton')).tap();
  await dismissOkAlertIfVisible();

  await waitFor(element(by.id('goToViewGroupsButton')))
    .toBeVisible()
    .withTimeout(10000);
  await element(by.id('goToViewGroupsButton')).tap();

  await waitFor(element(by.id('groupInternalIdText')).atIndex(0))
    .toBeVisible()
    .withTimeout(10000);

  const attrs = await element(by.id('groupInternalIdText')).atIndex(0).getAttributes();
  const text = String((attrs as any).text ?? (attrs as any).label ?? '');
  const groupIdMatch = text.match(/Referencia interna:\s*(.+)$/);

  if (!groupIdMatch?.[1]) {
    throw new Error(`Nao foi possivel obter o ID do grupo a partir de: "${text}"`);
  }

  await element(by.text('Voltar')).atIndex(0).tap();
  await expect(element(by.id('homeTitle'))).toBeVisible();

  return {
    groupId: groupIdMatch[1].trim(),
    groupName: resolvedGroupName,
  };
};
