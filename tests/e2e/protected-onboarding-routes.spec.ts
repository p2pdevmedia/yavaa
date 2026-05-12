import { expect, test } from '@playwright/test';

const protectedRoutes = [
  '/dashboard/seleccionar-modo',
  '/dashboard/onboarding/jefe',
  '/dashboard/onboarding/trabajador',
  '/dashboard/jefe',
  '/dashboard/jefe/publicar-trabajo',
  '/dashboard/jefe/buscar-trabajadores',
  '/dashboard/trabajador'
];

test.describe('protected onboarding routes', () => {
  for (const route of protectedRoutes) {
    test(`redirects unauthenticated users from ${route}`, async ({ page }) => {
      await page.goto(route);

      await expect(page).toHaveURL(/\/sign-in/);
      await expect(page.getByRole('heading', { name: 'Entrá y seguí con tu perfil.' })).toBeVisible();
    });
  }
});
