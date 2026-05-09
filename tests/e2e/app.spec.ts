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
  await expect(page.getByRole('heading', { name: /Etapa 01/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Iniciar sesión/i })).toBeVisible();
});

test('unauthorized access to the protected route redirects to sign in', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard$/);
});

test('auth pages render', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page.getByRole('heading', { name: /Iniciar sesión/i })).toBeVisible();

  await page.goto('/sign-up');
  await expect(page.getByRole('heading', { name: /Crear cuenta/i })).toBeVisible();
});
