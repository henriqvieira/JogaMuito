import { buttonVariant, heroGradient, theme } from './theme';

describe('design theme', () => {
  it('exposes the green and yellow visual palette', () => {
    expect(theme.colors.primary).toBe('#22c55e');
    expect(theme.colors.accent).toBe('#facc15');
    expect(heroGradient).toEqual(['#22c55e', '#facc15']);
  });

  it('provides button variants with distinct accents', () => {
    expect(buttonVariant('primary').backgroundColor).toBe('#22c55e');
    expect(buttonVariant('danger').backgroundColor).toBe('#ef4444');
  });
});
