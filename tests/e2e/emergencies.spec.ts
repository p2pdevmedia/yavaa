import fs from 'node:fs';
import path from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { devices, expect, test, type Page } from '@playwright/test';

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, 'utf8');

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

for (const envFile of ['.env.local', '.env']) {
  loadEnvFile(path.join(process.cwd(), envFile));
}

const databaseUrl = process.env.DATABASE_URL;
const e2eEnabled = process.env.PLAYWRIGHT_E2E === '1';
const authEmail = 'foundation-client@yavaa.test';
const descriptionPrefix = 'E2E emergencia creación exitosa';

test.describe.configure({ mode: 'serial' });
test.skip(!e2eEnabled, 'PLAYWRIGHT_E2E=1 is required for emergency creation e2e.');
test.skip(!databaseUrl, 'DATABASE_URL is required for emergency creation e2e cleanup.');

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl!
  })
});

async function authenticateAsSeededClient(page: Page) {
  await page.context().addCookies([
    {
      name: 'yavaa-test-email',
      value: authEmail,
      url: 'http://127.0.0.1:3000'
    }
  ]);
}

async function cleanupEmergencyRequests() {
  const requests = await prisma.emergencyRequest.findMany({
    where: {
      client: {
        email: authEmail
      },
      description: {
        startsWith: descriptionPrefix
      }
    },
    select: {
      id: true
    }
  });

  if (requests.length === 0) {
    return;
  }

  const ids = requests.map((request) => request.id);

  await prisma.$transaction([
    prisma.auditLog.deleteMany({
      where: {
        entityType: 'emergency_request',
        entityId: {
          in: ids
        }
      }
    }),
    prisma.emergencyRequest.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })
  ]);
}

async function createEmergencyFromDashboard(page: Page, description: string) {
  await authenticateAsSeededClient(page);
  await page.goto('/dashboard/jefe/urgencias');

  await expect(page).toHaveURL(/\/dashboard\/jefe\/urgencias$/);
  await expect(page.getByRole('heading', { name: /Crear nueva urgencia/i })).toBeVisible({
    timeout: 15_000
  });

  await page.getByLabel('Descripción').fill(description);

  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().endsWith('/api/emergencies')
  );

  await page.getByRole('button', { name: 'Crear nueva urgencia' }).click();

  const response = await responsePromise;
  const payload = (await response.json()) as {
    request?: {
      id?: string;
      status?: string;
      description?: string;
    };
  };

  expect(response.status()).toBe(201);
  expect(payload.request?.id).toBeTruthy();
  expect(payload.request?.description).toBe(description);
  expect(['DISPATCHING', 'EXPIRED']).toContain(payload.request?.status);
  await expect(page.getByText('Urgencia creada y enviada a contractors elegibles.')).toBeVisible({
    timeout: 15_000
  });
  await expect(page.getByText(description)).toBeVisible();
}

test.beforeEach(async () => {
  await cleanupEmergencyRequests();
});

test.afterEach(async () => {
  await cleanupEmergencyRequests();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test('web client creates an emergency request successfully', async ({ page }) => {
  await createEmergencyFromDashboard(page, `${descriptionPrefix} web`);
});

test.describe('iPhone web client', () => {
  const iphone = devices['iPhone 15'];

  test.use({
    viewport: iphone.viewport,
    deviceScaleFactor: iphone.deviceScaleFactor,
    isMobile: iphone.isMobile,
    hasTouch: iphone.hasTouch,
    userAgent: iphone.userAgent
  });

  test('creates an emergency request successfully', async ({ page }) => {
    await createEmergencyFromDashboard(page, `${descriptionPrefix} iPhone web`);
  });
});
