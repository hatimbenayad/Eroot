import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('U1 Foundation, Auth & Accessibility', () => {
  test('landing renders Eroot geometric preview and redirects protected /library to /auth', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Host live quizzes/i })).toBeVisible();
    await expect(page.getByTestId('answer-tile-A')).toHaveAttribute('data-shape', 'triangle');
    await expect(page.getByTestId('answer-tile-C')).toHaveAttribute('data-shape', 'circle');

    // Protected route guard
    await page.goto('/library');
    await expect(page).toHaveURL(/\/auth\?redirect=%2Flibrary/);
    await expect(page.getByRole('heading', { name: /Host Account/i })).toBeVisible();

    // No Google OAuth in R1, no AI/paywall elements
    await expect(page.getByText(/Continue with Google/i)).toHaveCount(0);
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

  test('landing, auth, and join pages have zero critical/serious axe violations', async ({
    page,
  }) => {
    for (const path of ['/', '/auth', '/join']) {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).analyze();
      const severe = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(severe, `Axe violations on ${path}`).toEqual([]);
    }
  });
});

