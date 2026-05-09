import { expect, test, type Page } from '@playwright/test';

const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
const e2eEnabled = process.env.PLAYWRIGHT_E2E === '1';

test.skip(!e2eEnabled, 'PLAYWRIGHT_E2E=1 is required for the booking dashboard e2e.');

const authEmail = 'foundation-client@yavaa.test';

async function authenticateAsSeededClient(page: Page) {
  await page.context().addCookies([
    {
      name: 'yavaa-test-email',
      value: authEmail,
      domain: '127.0.0.1',
      path: '/'
    }
  ]);
}

async function openDashboard(page: Page) {
  await authenticateAsSeededClient(page);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: /Bookings y chat/i })).toBeVisible();
}

test('dashboard chat loads seeded messages and allows sending a new one', async ({ page }) => {
  await openDashboard(page);

  await expect(page.getByText('Necesito reparar una canilla que gotea en la cocina.')).toBeVisible();
  await expect(page.getByText('La canilla sigue goteando, pero no hay olor a gas ni pérdida mayor.')).toBeVisible();

  await page.getByLabel('Nuevo mensaje').fill('Llego mañana a las 10 con las herramientas.');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();

  await expect(page.getByText('Llego mañana a las 10 con las herramientas.')).toBeVisible();
});

test('dashboard booking attachments upload to Blob and appear in the conversation', async ({ page }) => {
  test.skip(!blobToken, 'BLOB_READ_WRITE_TOKEN is required for booking attachment e2e.');

  await openDashboard(page);

  await page.locator('#booking-file').setInputFiles({
    name: 'foto-fuga.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('fake-jpeg-content')
  });

  await page.getByRole('button', { name: 'Subir archivo' }).click();

  await expect(page.getByText('Archivo subido.')).toBeVisible();
  await expect(page.getByText('foto-fuga.jpg')).toBeVisible();
});
