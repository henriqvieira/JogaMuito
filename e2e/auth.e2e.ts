import { createGroupFromHome, dismissOkAlertIfVisible, login, registerNewUser } from './helpers';

describe('Authentication, groups and invite flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should register, login, create group, generate invite and accept invite', async () => {
    const { email, password } = await registerNewUser();

    await element(by.text('Sair')).atIndex(0).tap();
    await login(email, password);

    const { groupName } = await createGroupFromHome();

    await element(by.id('viewGroupsButton')).tap();
    await waitFor(element(by.text(groupName)))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.text('Gerar convite')).atIndex(0).tap();
    await dismissOkAlertIfVisible();

    await waitFor(element(by.id('generatedInviteLink')))
      .toBeVisible()
      .withTimeout(10000);
    const inviteAttrs = await element(by.id('generatedInviteLink')).getAttributes();
    const inviteLink = String((inviteAttrs as any).text ?? (inviteAttrs as any).label ?? '').trim();

    if (!inviteLink) {
      throw new Error('Nao foi possivel capturar o link de convite gerado.');
    }

    await element(by.text('Voltar')).atIndex(0).tap();
    await expect(element(by.id('homeTitle'))).toBeVisible();

    await element(by.id('acceptInviteButton')).tap();
    await expect(element(by.id('inviteInput'))).toBeVisible();
    await element(by.id('inviteInput')).replaceText(inviteLink);
    await element(by.id('acceptInviteConfirmButton')).tap();
    await dismissOkAlertIfVisible();

    await expect(element(by.id('homeTitle'))).toBeVisible();
  });
});
