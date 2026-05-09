import { expect, test } from '@playwright/test';

test('public provider search is reachable from the landing page', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: /Explorar proveedores/i })).toBeVisible();

  await page.getByRole('link', { name: /Explorar proveedores/i }).click();
  await expect(page).toHaveURL('/providers');
  await expect(page.getByRole('heading', { name: /Proveedores/i })).toBeVisible();
});

test('public search filters by category and market and opens a limited profile', async ({ page }) => {
  await page.goto('/providers');

  await page.getByLabel('Categoría').selectOption('home-services');
  await page.getByLabel('Ubicación').selectOption('san-martin-de-los-andes');
  await page.getByRole('button', { name: /Buscar/i }).click();

  await expect(page.getByText(/Carlos Perez/i)).toBeVisible();
  await page.getByRole('link', { name: /Ver perfil/i }).first().click();

  await expect(page).toHaveURL(/\/providers\//);
  await expect(page.getByText(/Acepta urgencias/i)).toBeVisible();
  await expect(page.getByText(/@/)).toHaveCount(0);
});
