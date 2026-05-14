import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

describe('public agent API docs', () => {
  it('exposes a static /docs/api page backed by the committed Agent API guide', () => {
    const page = readProjectFile('src/app/docs/api/page.tsx');
    const guide = readProjectFile('docs/api/agent-api.md');

    expect(page).toContain("title: `Agent API | ${APP_NAME}`");
    expect(page).toContain("join(process.cwd(), 'docs/api/agent-api.md')");
    expect(page).toContain('Ruta publica: /docs/api');
    expect(page).toContain('Analisis de seguridad');
    expect(page).toContain('Sin secretos');
    expect(page).toContain('Sin permisos nuevos');
    expect(page).toContain('{agentApiMarkdown}');
    expect(page).not.toContain('cookies()');
    expect(page).not.toContain('headers()');
    expect(page).not.toContain('resolveRequestAuth');
    expect(page).not.toContain('getPrismaClient');

    expect(guide).toContain('## Public Security Review');
    expect(guide).toContain('The public documentation does not grant access by itself.');
    expect(guide).toContain('Supabase service role keys or secret keys');
    expect(guide).toContain('Authorization: Bearer <access_token>');
    expect(guide).not.toContain('SUPABASE_SERVICE_ROLE_KEY=');
  });
});
