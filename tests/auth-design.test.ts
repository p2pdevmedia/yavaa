import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

describe('auth mobile design foundation', () => {
  it('uses Yavaa design tokens in global styles', () => {
    const globals = readProjectFile('src/app/globals.css');

    expect(globals).toContain('--yavaa-violet: #6E3FF3;');
    expect(globals).toContain('--yavaa-violet-hover: #5B30D9;');
    expect(globals).toContain('--yavaa-violet-soft: #EFE7FF;');
    expect(globals).toContain('--yavaa-background: #FBFAF8;');
    expect(globals).toContain('--yavaa-text-primary: #111111;');
    expect(globals).toContain('--yavaa-text-secondary: #666666;');
    expect(globals).toContain('--yavaa-border: #E5E5E5;');
  });

  it('keeps shared inputs and buttons sized for mobile tapping', () => {
    const button = readProjectFile('src/components/ui/button.tsx');
    const input = readProjectFile('src/components/ui/input.tsx');

    expect(button).toContain('rounded-full');
    expect(button).toContain('h-14');
    expect(input).toContain('h-14');
    expect(input).toContain('rounded-[18px]');
  });

  it('renders auth pages with the mobile-first auth shell', () => {
    const signInPage = readProjectFile('src/app/sign-in/page.tsx');
    const signUpPage = readProjectFile('src/app/sign-up/page.tsx');

    expect(signInPage).toContain('AuthPageFrame');
    expect(signUpPage).toContain('AuthPageFrame');
    expect(signInPage).toContain('¿Qué necesitás resolver hoy?');
    expect(signUpPage).toContain('Tu cuenta empieza simple');
  });
});
