import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('public emergency draft flow', () => {
  test('keeps the public urgency form editable before authentication', () => {
    const source = readProjectFile('src/components/emergencies/public-emergency-draft-form.tsx');

    expect(source).toContain('localStorage.getItem(PUBLIC_EMERGENCY_DRAFT_STORAGE_KEY)');
    expect(source).toContain('localStorage.setItem(PUBLIC_EMERGENCY_DRAFT_STORAGE_KEY');
    expect(source).toContain('/sign-in?next=%2Fdashboard%2Fjefe%2Furgencias');
    expect(source).toContain('Iniciar sesión para enviar');
  });

  test('exposes a public Urgencias route inside the guest shell', () => {
    const source = readProjectFile('src/app/urgencias/page.tsx');

    expect(source).toContain('<GuestShell>');
    expect(source).toContain('<PublicEmergencyDraftForm');
  });

  test('keeps the public home inside the guest shell bottom navigation', () => {
    expect(readProjectFile('src/app/page.tsx')).toContain('<GuestShell>');
  });
});
