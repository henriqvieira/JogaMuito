import { createGroupFromHome, dismissOkAlertIfVisible, E2E_EMAIL, E2E_PASSWORD } from './helpers';

const E2E_GROUP_ID = process.env.E2E_GROUP_ID;

describe('Finance flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should create match cost, apply exemption and display financial history totals', async () => {
    const suffix = Date.now().toString().slice(-6);

    await expect(element(by.id('emailInput'))).toBeVisible();
    await element(by.id('emailInput')).replaceText(E2E_EMAIL);
    await element(by.id('passwordInput')).replaceText(E2E_PASSWORD);
    await element(by.id('loginButton')).tap();

    await expect(element(by.id('homeTitle'))).toBeVisible();

    const groupId =
      E2E_GROUP_ID ?? (await createGroupFromHome(`Grupo Financas E2E ${suffix}`)).groupId;

    await element(by.id('manageMatchCostsButton')).tap();
    await expect(element(by.id('matchCostGroupIdInput'))).toBeVisible();

    await element(by.id('matchCostGroupIdInput')).replaceText(groupId);
    await element(by.id('matchCostTotalAmountInput')).replaceText('120');

    await element(by.id('matchCostPlayerInput')).replaceText('Ana');
    await element(by.id('addMatchCostPlayerButton')).tap();
    await element(by.id('matchCostPlayerInput')).replaceText('Bruno');
    await element(by.id('addMatchCostPlayerButton')).tap();
    await element(by.id('matchCostPlayerInput')).replaceText('Carlos');
    await element(by.id('addMatchCostPlayerButton')).tap();

    await element(by.id('toggleExempt-Ana')).tap();

    await expect(element(by.id('matchCostChargeableCountText'))).toHaveText(
      'Jogadores pagantes: 2',
    );
    await expect(element(by.id('matchCostExemptCountText'))).toHaveText('Jogadores isentos: 1');
    await expect(element(by.id('matchCostAmountPerPlayerText'))).toHaveText(
      'Valor por pagante: R$ 60.00',
    );

    await element(by.id('saveMatchCostButton')).tap();
    await dismissOkAlertIfVisible();

    await expect(element(by.id('homeTitle'))).toBeVisible();

    await element(by.id('financialHistoryButton')).tap();
    await expect(element(by.id('financialHistoryGroupIdInput'))).toBeVisible();

    await element(by.id('financialHistoryGroupIdInput')).replaceText(groupId);
    await element(by.id('loadFinancialHistoryButton')).tap();
    await dismissOkAlertIfVisible();

    await waitFor(element(by.id('financialHistorySummaryCard')))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.id('financialHistoryTotalPaidText'))).toBeVisible();
    await expect(element(by.id('financialHistoryTotalOwedText'))).toBeVisible();
    await expect(element(by.id('financialHistoryGrandTotalText'))).toBeVisible();

    await waitFor(element(by.id('financialPlayerCard-Ana')))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.id('financialPlayerPaid-Ana'))).toHaveText('Pago: R$ 0.00');
    await expect(element(by.id('financialPlayerOwed-Ana'))).toHaveText('Deve: R$ 0.00');
    await expect(element(by.id('financialPlayerCard-Bruno'))).toBeVisible();
    await expect(element(by.id('financialPlayerOwed-Bruno'))).toHaveText('Deve: R$ 60.00');
    await expect(element(by.id('financialPlayerCard-Carlos'))).toBeVisible();
    await expect(element(by.id('financialPlayerOwed-Carlos'))).toHaveText('Deve: R$ 60.00');
  });
});
