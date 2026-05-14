import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

describe('dashboard bottom tabs design', () => {
  it('renders a client-side bottom tab navigator from the dashboard pathname', () => {
    const component = readProjectFile('src/components/dashboard/bottom-tabs-nav.tsx');

    expect(component).toContain("'use client'");
    expect(component).toContain('usePathname');
    expect(component).toContain('getDashboardModeFromPathname');
    expect(component).toContain('getDashboardBottomTabsForMode');
    expect(component).toContain('aria-label="Navegación principal del dashboard"');
    expect(component).toContain('aria-current={active ? \'page\' : undefined}');
    expect(component).toContain('bottom-0');
  });

  it('mounts the bottom tabs from the dashboard layout only', () => {
    const layout = readProjectFile('src/app/dashboard/layout.tsx');
    const rootLayout = readProjectFile('src/app/layout.tsx');

    expect(layout).toContain('BottomTabsNav');
    expect(layout).toContain('<BottomTabsNav />');
    expect(rootLayout).not.toContain('BottomTabsNav');
  });

  it('adds a protected trabajador profile page for the Perfil tab', () => {
    const page = readProjectFile('src/app/dashboard/trabajador/perfil/page.tsx');

    expect(page).toContain("getDashboardPageContext('/dashboard/trabajador/perfil')");
    expect(page).toContain("canSelectProfileMode(context.appUser.permissionContext, 'trabajador')");
    expect(page).toContain("hasCompletedOnboarding(context.appUser.user.profile, 'trabajador')");
    expect(page).toContain('Perfil trabajador');
    expect(page).toContain('/dashboard/onboarding/trabajador?editar=1');
  });
});
