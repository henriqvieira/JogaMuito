import { createGroupFromHome, dismissOkAlertIfVisible, E2E_EMAIL, E2E_PASSWORD } from './helpers';

const E2E_GROUP_ID = process.env.E2E_GROUP_ID;

const handleWhatsappShareResult = async () => {
  try {
    await waitFor(element(by.text('WhatsApp nao encontrado')))
      .toBeVisible()
      .withTimeout(5000);

    await dismissOkAlertIfVisible();
    return;
  } catch {
    // On Android, WhatsApp may background the app. On iOS, share sheet might stay in-app.
    if (device.getPlatform() === 'android') {
      await device.launchApp({ newInstance: false });
    }
  }
};

describe('Reports flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should create match, register goal, generate stats and share report on WhatsApp', async () => {
    const suffix = Date.now().toString().slice(-6);
    const eventLocation = `Quadra Relatorio E2E ${suffix}`;

    await expect(element(by.id('emailInput'))).toBeVisible();
    await element(by.id('emailInput')).replaceText(E2E_EMAIL);
    await element(by.id('passwordInput')).replaceText(E2E_PASSWORD);
    await element(by.id('loginButton')).tap();

    await expect(element(by.id('homeTitle'))).toBeVisible();

    const groupId =
      E2E_GROUP_ID ?? (await createGroupFromHome(`Grupo Relatorio E2E ${suffix}`)).groupId;

    await element(by.id('createGameEventButton')).tap();
    await expect(element(by.id('eventGroupIdInput'))).toBeVisible();

    await element(by.id('eventGroupIdInput')).replaceText(groupId);
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
    await dismissOkAlertIfVisible();

    await expect(element(by.id('homeTitle'))).toBeVisible();

    await element(by.id('recordGoalsButton')).tap();
    await expect(element(by.id('loadLatestEventGroupIdInput'))).toBeVisible();

    await element(by.id('loadLatestEventGroupIdInput')).replaceText(groupId);
    await element(by.id('loadLatestEventButton')).tap();
    await dismissOkAlertIfVisible();

    await waitFor(element(by.text(`Evento: ${eventLocation}`)))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.text('Ana')).atIndex(0).tap();
    await element(by.id('goalTeamAButton')).tap();
    await element(by.id('goalMinuteInput')).replaceText('10');
    await element(by.id('registerGoalButton')).tap();
    await dismissOkAlertIfVisible();

    await waitFor(element(by.id('resultScoreText')))
      .toHaveText('Time A 1 x 0 Time B')
      .withTimeout(10000);

    await element(by.text('Voltar')).atIndex(0).tap();
    await expect(element(by.id('homeTitle'))).toBeVisible();

    await element(by.id('groupMatchReportButton')).tap();
    await expect(element(by.id('matchReportGroupIdInput'))).toBeVisible();

    await element(by.id('matchReportGroupIdInput')).replaceText(groupId);
    await element(by.id('saveMatchReportButton')).tap();
    await dismissOkAlertIfVisible();

    await waitFor(element(by.id('matchReportSummaryCard')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id('matchReportGroupTitle'))).toBeVisible();
    await expect(element(by.id('matchReportTotalMatches'))).toBeVisible();
    await expect(element(by.id('matchReportTotalGoals'))).toBeVisible();

    await waitFor(element(by.id('matchReportPlayerCard-Ana')))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.id('matchReportPlayerGoals-Ana'))).toHaveText('Gols: 1');

    await element(by.id('shareMatchReportButton')).tap();
    await handleWhatsappShareResult();

    await expect(element(by.id('matchReportSummaryCard'))).toBeVisible();
  });
});
