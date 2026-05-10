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
  await expect(page.getByRole('heading', { name: /Qué necesitás resolver hoy/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Buscar servicios/i }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Profesionales verificados/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Iniciar sesión/i })).toBeVisible();
});

test('unauthorized access to the protected route redirects to sign in', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard$/);
});

test('auth pages render', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page.getByRole('heading', { name: /Iniciar sesión/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Continuar con Google/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Olvidé mi contraseña/i })).toBeVisible();

  await page.goto('/sign-up');
  await expect(page.getByRole('heading', { name: /Crear cuenta/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Continuar con Google/i })).toBeVisible();
});

test('password reset pages render', async ({ page }) => {
  await page.goto('/forgot-password');
  await expect(page.getByRole('heading', { name: /Recuperar contraseña/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Enviar enlace/i })).toBeVisible();

  await page.goto('/reset-password');
  await expect(page.getByRole('heading', { name: /Nueva contraseña/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Actualizar contraseña/i })).toBeVisible();
});

test('expired Supabase recovery links land on the retry form', async ({ page }) => {
  await page.goto(
    '/?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
  );

  await expect(page).toHaveURL(/\/forgot-password\?authError=/);
  await expect(page.getByRole('heading', { name: /Recuperar contraseña/i })).toBeVisible();
  await expect(page.getByTestId('forgot-password-error')).toContainText(
    'El enlace de recuperación venció o ya fue usado'
  );
});

test('Supabase recovery codes that land on root continue to the reset callback', async ({ request }) => {
  const response = await request.get('/?code=pkce_test_code', { maxRedirects: 0 });

  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe('/auth/callback?code=pkce_test_code&next=%2Freset-password');
});

test('Supabase implicit recovery links that land on root continue to reset password', async ({ page }) => {
  await page.goto('/#access_token=recovery_access&refresh_token=recovery_refresh&type=recovery');

  await expect(page).toHaveURL(/\/reset-password#access_token=recovery_access&refresh_token=recovery_refresh&type=recovery$/);
  await expect(page.getByRole('heading', { name: /Nueva contraseña/i })).toBeVisible();
});

test('landing page exposes the public discovery entry point', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: /Explorar proveedores/i })).toBeVisible();
  await page.getByRole('link', { name: /Explorar proveedores/i }).click();
  await expect(page).toHaveURL('/providers');
});
