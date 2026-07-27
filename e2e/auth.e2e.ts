describe('Authentication flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should login and access the home screen', async () => {
    await expect(element(by.id('emailInput'))).toBeVisible();
    await element(by.id('emailInput')).typeText('usuario@email.com');
    await element(by.id('passwordInput')).typeText('123456');
    await element(by.id('loginButton')).tap();

    await expect(element(by.id('homeTitle'))).toBeVisible();
  });
});
