const E2E_EMAIL = process.env.E2E_EMAIL ?? 'usuario@email.com';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? '123456';
const E2E_GROUP_ID = process.env.E2E_GROUP_ID;

describe('Event flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should create event, assign teams, register goal and show final score', async () => {
    if (!E2E_GROUP_ID) {
      throw new Error(
        'E2E_GROUP_ID nao definido. Configure um grupo onde o usuario de teste seja admin.',
      );
    }

    const suffix = Date.now().toString().slice(-6);
    const eventLocation = `Quadra E2E ${suffix}`;

    await expect(element(by.id('emailInput'))).toBeVisible();
    await element(by.id('emailInput')).replaceText(E2E_EMAIL);
    await element(by.id('passwordInput')).replaceText(E2E_PASSWORD);
    await element(by.id('loginButton')).tap();

    await expect(element(by.id('homeTitle'))).toBeVisible();

    await element(by.id('createGameEventButton')).tap();
    await expect(element(by.id('eventGroupIdInput'))).toBeVisible();

    await element(by.id('eventGroupIdInput')).replaceText(E2E_GROUP_ID);
    await element(by.id('eventDateInput')).replaceText('2026-12-20');
    await element(by.id('eventTimeInput')).replaceText('20:00');
    await element(by.id('eventLocationInput')).replaceText(eventLocation);

    await element(by.id('eventParticipantInput')).replaceText('Ana');
    await element(by.id('addParticipantButton')).tap();
    await element(by.id('eventParticipantInput')).replaceText('Bruno');
    await element(by.id('addParticipantButton')).tap();

    await element(by.id('assignTeamA-Ana')).tap();
    await element(by.id('assignTeamB-Bruno')).tap();

    await element(by.id('saveEventButton')).tap();

    try {
      await waitFor(element(by.text('OK')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.text('OK')).tap();
    } catch {
      // Dialog might not appear depending on execution timing.
    }

    await expect(element(by.id('homeTitle'))).toBeVisible();

    await element(by.id('recordGoalsButton')).tap();
    await expect(element(by.id('loadLatestEventGroupIdInput'))).toBeVisible();

    await element(by.id('loadLatestEventGroupIdInput')).replaceText(E2E_GROUP_ID);
    await element(by.id('loadLatestEventButton')).tap();

    try {
      await waitFor(element(by.text('OK')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.text('OK')).tap();
    } catch {
      // Dialog might not appear depending on execution timing.
    }

    await waitFor(element(by.text(`Evento: ${eventLocation}`)))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.text('Ana')).atIndex(0).tap();
    await element(by.id('goalTeamAButton')).tap();
    await element(by.id('goalMinuteInput')).replaceText('10');
    await element(by.id('registerGoalButton')).tap();

    try {
      await waitFor(element(by.text('OK')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.text('OK')).tap();
    } catch {
      // Dialog might not appear depending on execution timing.
    }

    await waitFor(element(by.id('resultScoreText')))
      .toHaveText('Time A 1 x 0 Time B')
      .withTimeout(10000);
  });
});
