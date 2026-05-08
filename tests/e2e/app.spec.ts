import { expect, test } from '@playwright/test';

test('landing page loads and health endpoint responds', async ({ page, request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();

  const health = (await response.json()) as {
    status: string;
    app: string;
    version: string;
  };

  expect(health.status).toBe('ok');

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Yavaa is ready/i })).toBeVisible();
  await expect(page.getByRole('link', { name: 'OpenAPI contract' })).toBeVisible();
});

test('unauthorized access to the protected route redirects home', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/\?next=%2Fdashboard$/);
});
