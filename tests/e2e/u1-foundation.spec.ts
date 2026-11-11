import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('U1/U10 Foundation, i18n, Mobile Accessibility & Reduced Motion', () => {
  test('landing renders Eroot geometric preview and redirects protected /library to /auth', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Host live quizzes/i })).toBeVisible();
    await expect(page.getByTestId('answer-tile-A')).toHaveAttribute('data-shape', 'triangle');
    await expect(page.getByTestId('answer-tile-C')).toHaveAttribute('data-shape', 'circle');

    // Language switcher translates UI to Spanish cleanly and updates <html lang>
    await page.getByRole('button', { name: 'ES', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { name: /Dirige cuestionarios en vivo/i })).toBeVisible();
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // Protected route guard
    await page.goto('/library');
    await expect(page).toHaveURL(/\/auth\?redirect=%2Flibrary/);
    await expect(page.getByRole('heading', { name: /Host Account/i })).toBeVisible();

    // Google OAuth ships in R2; zero Upgrade/paywall banners
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
    await expect(page.getByText(/Upgrade/i)).toHaveCount(0);
  });

  test('auth form validates invalid email and short password inline', async ({ page }) => {
    await page.goto('/auth');
    await page.getByRole('tab', { name: 'Create account' }).click();
    await page.getByLabel('Email address').fill('invalid-email');
    await page.getByLabel('Password').fill('123');
    await page.getByRole('button', { name: 'Create host account' }).click();

    await expect(page.getByText('Enter a valid email address.')).toBeVisible();
    await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible();
  });

  test('landing, auth, join, and discover pages have zero critical/serious axe violations', async ({
    page,
  }) => {
    for (const path of ['/', '/auth', '/join', '/discover']) {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).analyze();
      const severe = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(severe, `Axe violations on ${path}`).toEqual([]);
    }
  });

  test('mobile /join renders cleanly under reduced motion with zero console errors or axe issues', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/join');
    await expect(page.getByLabel('Game PIN')).toBeVisible();
    await page.getByRole('button', { name: 'ES', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Únete a una partida/i })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const severe = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(severe).toEqual([]);
    expect(consoleErrors).toEqual([]);

    await context.close();
  });
});
