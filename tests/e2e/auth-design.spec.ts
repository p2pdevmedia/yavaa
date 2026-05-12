import { expect, test, type Page } from '@playwright/test';

const mobileViewport = { width: 390, height: 844 };

async function expectMobileAuthPage(
  page: Page,
  path: string,
  heading: string,
  primaryButton: string
) {
  await page.setViewportSize(mobileViewport);
  await page.goto(path);

  await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  await expect(page.getByRole('button', { name: primaryButton })).toBeVisible();

  const layout = await page.evaluate(() => {
    const firstButton = document.querySelector('button');
    const firstInput = document.querySelector('input');

    return {
      viewportWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      buttonHeight: firstButton ? Number.parseFloat(getComputedStyle(firstButton).height) : 0,
      inputHeight: firstInput ? Number.parseFloat(getComputedStyle(firstInput).height) : 0
    };
  });

  expect(layout.scrollWidth).toBe(layout.viewportWidth);
  expect(layout.buttonHeight).toBeGreaterThanOrEqual(44);
  expect(layout.inputHeight).toBeGreaterThanOrEqual(44);
}

test.describe('auth mobile design', () => {
  test('renders all public auth screens without horizontal overflow', async ({ page }) => {
    await expectMobileAuthPage(page, '/sign-in', 'Entrá y seguí con tu perfil.', 'Iniciar sesión');
    await expectMobileAuthPage(page, '/sign-up', 'Tu cuenta empieza simple.', 'Registrar cuenta');
    await expectMobileAuthPage(
      page,
      '/forgot-password',
      'Volvé a entrar con un enlace seguro.',
      'Enviar enlace'
    );
    await expectMobileAuthPage(
      page,
      '/reset-password',
      'Guardá una contraseña nueva.',
      'Actualizar contraseña'
    );
  });

  test('keeps auth navigation connected on mobile', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto('/sign-in');

    await page.getByRole('link', { name: 'Crear cuenta' }).click();
    await expect(page).toHaveURL(/\/sign-up$/);
    await expect(page.getByRole('heading', { name: 'Tu cuenta empieza simple.' })).toBeVisible();

    await page.getByRole('link', { name: 'Ya tengo cuenta' }).click();
    await expect(page).toHaveURL(/\/sign-in$/);

    await page.getByRole('link', { name: 'Olvidé mi contraseña' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByRole('heading', { name: 'Volvé a entrar con un enlace seguro.' })).toBeVisible();

    await page.getByRole('link', { name: 'Volver a iniciar sesión' }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
  });
});
